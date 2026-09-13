import { StatusBar } from 'expo-status-bar';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  ApiError,
  type HomeAssistantConnection,
  orielApi,
  type Property,
  type UtilityState,
  type W3dsOffer,
} from './src/api';

const SESSION_KEY = 'oriel.w3ds.session';
const PENDING_SIGN_IN_KEY = 'oriel.w3ds.pending-sign-in';

type Tab = 'home' | 'utilities' | 'settings';
type PendingSignIn = Pick<W3dsOffer, 'session' | 'clientProof' | 'expiresAt'>;

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

function utilityTitle(utility: UtilityState['utility']) {
  return utility === 'electricity' ? 'Electricity' : 'Water';
}

function UtilityCard({ state }: { state: UtilityState | null }) {
  if (!state) {
    return (
      <View style={styles.utilityCard}>
        <Text style={styles.cardEyebrow}>HOME ASSISTANT</Text>
        <Text style={styles.utilityName}>Loading reading…</Text>
      </View>
    );
  }
  const active = state.status === 'connected';
  return (
    <View style={styles.utilityCard}>
      <View style={styles.utilityHeading}>
        <View>
          <Text style={styles.cardEyebrow}>HOME ASSISTANT</Text>
          <Text style={styles.utilityName}>{utilityTitle(state.utility)}</Text>
        </View>
        <View
          style={[styles.statusDot, active ? styles.liveDot : styles.mutedDot]}
        />
      </View>
      {active ? (
        <Text style={styles.utilityValue}>
          {state.value}{' '}
          <Text style={styles.utilityUnit}>{state.unit ?? ''}</Text>
        </Text>
      ) : (
        <Text style={styles.utilityDetail}>{state.detail}</Text>
      )}
      <Text style={styles.utilityDetail} numberOfLines={2}>
        {active
          ? `${state.label ?? 'Live reading'} · ${state.entityId}`
          : (state.entityId ?? '')}
      </Text>
    </View>
  );
}

function Navigation({
  tab,
  onChange,
}: {
  tab: Tab;
  onChange: (tab: Tab) => void;
}) {
  const items: Array<[Tab, string]> = [
    ['home', 'Home'],
    ['utilities', 'Utilities'],
    ['settings', 'Settings'],
  ];
  return (
    <View style={styles.navigation}>
      {items.map(([id, label]) => (
        <Pressable key={id} onPress={() => onChange(id)} style={styles.navItem}>
          <View
            style={[styles.navMark, tab === id && styles.navMarkSelected]}
          />
          <Text style={[styles.navText, tab === id && styles.navTextSelected]}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [pendingSignIn, setPendingSignIn] = useState<PendingSignIn | null>(
    null,
  );
  const [tab, setTab] = useState<Tab>('home');
  const [properties, setProperties] = useState<Property[]>([]);
  const [connection, setConnection] = useState<HomeAssistantConnection | null>(
    null,
  );
  const [electricity, setElectricity] = useState<UtilityState | null>(null);
  const [water, setWater] = useState<UtilityState | null>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const completionInFlight = useRef(false);

  const clearSession = useCallback(async () => {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    await SecureStore.deleteItemAsync(PENDING_SIGN_IN_KEY);
    setSessionToken(null);
    setPendingSignIn(null);
    setProperties([]);
    setConnection(null);
    setElectricity(null);
    setWater(null);
  }, []);

  const completePendingSignIn = useCallback(async (pending: PendingSignIn) => {
    if (completionInFlight.current) return;
    completionInFlight.current = true;
    try {
      const result = await orielApi.completeW3dsSignIn(
        pending.session,
        pending.clientProof,
      );
      if (result.state !== 'complete') return;

      await SecureStore.setItemAsync(SESSION_KEY, result.sessionToken);
      await SecureStore.deleteItemAsync(PENDING_SIGN_IN_KEY);
      setSessionToken(result.sessionToken);
      setPendingSignIn(null);
      setMessage('Your W3DS eID is verified on this iPhone.');
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await SecureStore.deleteItemAsync(PENDING_SIGN_IN_KEY);
        setPendingSignIn(null);
        setMessage('That W3DS sign-in request expired. Start a new one.');
      }
    } finally {
      completionInFlight.current = false;
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const [savedSession, savedPending] = await Promise.all([
        SecureStore.getItemAsync(SESSION_KEY),
        SecureStore.getItemAsync(PENDING_SIGN_IN_KEY),
      ]);
      setSessionToken(savedSession);
      if (savedPending) {
        try {
          const pending = JSON.parse(savedPending) as PendingSignIn;
          if (pending.session && pending.clientProof && pending.expiresAt) {
            setPendingSignIn(pending);
          } else {
            await SecureStore.deleteItemAsync(PENDING_SIGN_IN_KEY);
          }
        } catch {
          await SecureStore.deleteItemAsync(PENDING_SIGN_IN_KEY);
        }
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!pendingSignIn) return;
    void completePendingSignIn(pendingSignIn);
    const interval = setInterval(
      () => void completePendingSignIn(pendingSignIn),
      2_000,
    );
    return () => clearInterval(interval);
  }, [completePendingSignIn, pendingSignIn]);

  const refresh = useCallback(async () => {
    if (!sessionToken) return;
    setLoadingData(true);
    try {
      const [propertyResult, connectionResult, electricityResult, waterResult] =
        await Promise.all([
          orielApi.properties(sessionToken),
          orielApi.connection(sessionToken),
          orielApi.utility(sessionToken, 'electricity'),
          orielApi.utility(sessionToken, 'water'),
        ]);
      setProperties(propertyResult.properties);
      setConnection(connectionResult);
      setElectricity(electricityResult);
      setWater(waterResult);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await clearSession();
        setMessage(
          'Your secure session ended. Please sign in with your W3DS eID again.',
        );
      } else {
        setMessage(errorMessage(error));
      }
    } finally {
      setLoadingData(false);
    }
  }, [clearSession, sessionToken]);

  useEffect(() => {
    if (sessionToken) void refresh();
  }, [refresh, sessionToken]);

  const startW3dsSignIn = useCallback(async () => {
    setSigningIn(true);
    setMessage(null);
    try {
      const offer = await orielApi.startW3dsSignIn();
      const pending: PendingSignIn = {
        session: offer.session,
        clientProof: offer.clientProof,
        expiresAt: offer.expiresAt,
      };
      await SecureStore.setItemAsync(
        PENDING_SIGN_IN_KEY,
        JSON.stringify(pending),
      );
      setPendingSignIn(pending);
      await Linking.openURL(offer.uri);
      setMessage(
        'Approve the sign-in in your W3DS Wallet, then return to Oriel.',
      );
    } catch (error) {
      setMessage(
        `${errorMessage(error)} Make sure W3DS Wallet is installed on this iPhone.`,
      );
    } finally {
      setSigningIn(false);
    }
  }, []);

  const connectHomeAssistant = useCallback(
    async (values: {
      instanceUrl: string;
      electricityEntityId: string;
      waterEntityId: string;
    }) => {
      if (!sessionToken) return;
      setMessage(null);
      const offer = await orielApi.startHomeAssistant(sessionToken, values);
      const result = await WebBrowser.openAuthSessionAsync(
        offer.authorizeUrl,
        'oriel://home-assistant/callback',
      );
      if (result.type !== 'success' || !result.url) {
        throw new Error('Home Assistant authorization was cancelled.');
      }
      const callback = new URL(result.url);
      const authorizationError = callback.searchParams.get('error');
      const code = callback.searchParams.get('code');
      const state = callback.searchParams.get('state');
      if (authorizationError || !code || !state) {
        throw new Error(
          authorizationError ?? 'Home Assistant did not approve access.',
        );
      }
      await orielApi.completeHomeAssistant(sessionToken, code, state);
      setMessage(
        'Home Assistant is connected. Oriel can now read the selected utility sensors.',
      );
      await refresh();
    },
    [refresh, sessionToken],
  );

  const disconnectHomeAssistant = useCallback(async () => {
    if (!sessionToken) return;
    try {
      await orielApi.disconnectHomeAssistant(sessionToken);
      setMessage('Home Assistant was disconnected from Oriel.');
      await refresh();
    } catch (error) {
      setMessage(errorMessage(error));
    }
  }, [refresh, sessionToken]);

  if (!ready) {
    return <LoadingScreen />;
  }

  if (!sessionToken) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="dark" />
        <View style={styles.signInPage}>
          <View>
            <Text style={styles.wordmark}>ORIEL</Text>
            <Text style={styles.signInTitle}>
              A calmer way to run your home.
            </Text>
            <Text style={styles.signInBody}>
              Sign in with your W3DS eID Wallet. Oriel never asks for a password
              or stores your wallet key.
            </Text>
          </View>
          <View>
            <View style={styles.eidCard}>
              <Text style={styles.cardEyebrow}>PRIVATE IDENTITY</Text>
              <Text style={styles.eidTitle}>W3DS eID Wallet</Text>
              <Text style={styles.eidBody}>
                Your Wallet approves this sign-in. This iPhone only keeps a
                secure, revocable Oriel session.
              </Text>
            </View>
            <Pressable
              onPress={() => void startW3dsSignIn()}
              disabled={signingIn}
              style={[styles.primaryButton, signingIn && styles.disabledButton]}
            >
              {signingIn ? (
                <ActivityIndicator color={colors.paper} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  Continue with W3DS eID
                </Text>
              )}
            </Pressable>
            {pendingSignIn ? (
              <Text style={styles.pendingText}>
                Waiting for approval in W3DS Wallet…
              </Text>
            ) : null}
            {message ? <Text style={styles.notice}>{message}</Text> : null}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.appHeader}>
        <Text style={styles.wordmark}>ORIEL</Text>
        <Pressable onPress={() => void refresh()} hitSlop={12}>
          <Text style={styles.refreshText}>
            {loadingData ? 'Updating…' : 'Refresh'}
          </Text>
        </Pressable>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {message ? <Text style={styles.notice}>{message}</Text> : null}
        {tab === 'home' ? (
          <HomeView
            properties={properties}
            connection={connection}
            electricity={electricity}
            water={water}
            onUtilities={() => setTab('utilities')}
            onSettings={() => setTab('settings')}
          />
        ) : null}
        {tab === 'utilities' ? (
          <UtilitiesView
            electricity={electricity}
            water={water}
            onSettings={() => setTab('settings')}
          />
        ) : null}
        {tab === 'settings' ? (
          <SettingsView
            connection={connection}
            onConnect={connectHomeAssistant}
            onDisconnect={() =>
              Alert.alert(
                'Disconnect Home Assistant?',
                'Oriel will delete its encrypted local connection and stop reading utility sensors.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Disconnect',
                    style: 'destructive',
                    onPress: () => void disconnectHomeAssistant(),
                  },
                ],
              )
            }
            onSignOut={() =>
              Alert.alert(
                'Sign out of Oriel?',
                'The secure session will be removed from this iPhone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Sign out',
                    style: 'destructive',
                    onPress: () => void clearSession(),
                  },
                ],
              )
            }
          />
        ) : null}
      </ScrollView>
      <Navigation tab={tab} onChange={setTab} />
    </SafeAreaView>
  );
}

function LoadingScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.centered}>
        <ActivityIndicator color={colors.ink} />
      </View>
    </SafeAreaView>
  );
}

function HomeView({
  properties,
  connection,
  electricity,
  water,
  onUtilities,
  onSettings,
}: {
  properties: Property[];
  connection: HomeAssistantConnection | null;
  electricity: UtilityState | null;
  water: UtilityState | null;
  onUtilities: () => void;
  onSettings: () => void;
}) {
  return (
    <View>
      <Text style={styles.kicker}>PRIVATE HOME OPERATIONS</Text>
      <Text style={styles.pageTitle}>Everything at home, considered.</Text>
      <Text style={styles.pageBody}>
        Your properties, utility readings and operating records—protected by
        your W3DS identity.
      </Text>
      <View style={styles.heroCard}>
        <Text style={[styles.cardEyebrow, styles.lightEyebrow]}>PORTFOLIO</Text>
        <Text style={styles.heroNumber}>{properties.length}</Text>
        <Text style={styles.heroDescription}>
          {properties.length === 1
            ? 'property in Oriel'
            : 'properties in Oriel'}
        </Text>
      </View>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Live utilities</Text>
        <Pressable onPress={onUtilities}>
          <Text style={styles.inlineAction}>View all</Text>
        </Pressable>
      </View>
      <UtilityCard state={electricity} />
      <UtilityCard state={water} />
      {!connection?.connected ? (
        <Pressable onPress={onSettings} style={styles.outlineButton}>
          <Text style={styles.outlineButtonText}>
            Connect Home Assistant utility unit
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function UtilitiesView({
  electricity,
  water,
  onSettings,
}: {
  electricity: UtilityState | null;
  water: UtilityState | null;
  onSettings: () => void;
}) {
  return (
    <View>
      <Text style={styles.kicker}>READ-ONLY UTILITY UNIT</Text>
      <Text style={styles.pageTitle}>Live home utility data.</Text>
      <Text style={styles.pageBody}>
        Oriel can read the two Home Assistant sensors you choose. It cannot turn
        devices on, off, or change your Home Assistant setup.
      </Text>
      <View style={styles.utilityList}>
        <UtilityCard state={electricity} />
        <UtilityCard state={water} />
      </View>
      <Pressable onPress={onSettings} style={styles.outlineButton}>
        <Text style={styles.outlineButtonText}>
          Manage Home Assistant connection
        </Text>
      </Pressable>
    </View>
  );
}

function SettingsView({
  connection,
  onConnect,
  onDisconnect,
  onSignOut,
}: {
  connection: HomeAssistantConnection | null;
  onConnect: (values: {
    instanceUrl: string;
    electricityEntityId: string;
    waterEntityId: string;
  }) => Promise<void>;
  onDisconnect: () => void;
  onSignOut: () => void;
}) {
  const [instanceUrl, setInstanceUrl] = useState('');
  const [electricityEntityId, setElectricityEntityId] = useState('');
  const [waterEntityId, setWaterEntityId] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const connect = async () => {
    setConnecting(true);
    setFormError(null);
    try {
      await onConnect({ instanceUrl, electricityEntityId, waterEntityId });
    } catch (error) {
      setFormError(errorMessage(error));
    } finally {
      setConnecting(false);
    }
  };
  return (
    <View>
      <Text style={styles.kicker}>SETTINGS</Text>
      <Text style={styles.pageTitle}>Your home, your control.</Text>
      <Text style={styles.pageBody}>
        Your W3DS session stays encrypted on this iPhone. Connected utility
        credentials are encrypted on Oriel’s server and removed when you
        disconnect.
      </Text>
      <View style={styles.settingsCard}>
        <Text style={styles.sectionTitle}>Home Assistant</Text>
        {connection?.connected ? (
          <View>
            <Text style={styles.connectedTitle}>
              Connected to {connection.instanceHost}
            </Text>
            <Text style={styles.connectedDetail}>
              Electricity: {connection.electricityEntityId}
              {'\n'}Water: {connection.waterEntityId}
            </Text>
            <Pressable onPress={onDisconnect} style={styles.dangerButton}>
              <Text style={styles.dangerButtonText}>
                Disconnect Home Assistant
              </Text>
            </Pressable>
          </View>
        ) : (
          <View>
            <Text style={styles.formIntro}>
              Enter a public HTTPS Home Assistant address and the two sensors
              Oriel may read.
            </Text>
            <Field
              label="HOME ASSISTANT URL"
              value={instanceUrl}
              onChangeText={setInstanceUrl}
              placeholder="https://home.example.com"
              url
            />
            <Field
              label="ELECTRICITY SENSOR"
              value={electricityEntityId}
              onChangeText={setElectricityEntityId}
              placeholder="sensor.electricity_usage"
            />
            <Field
              label="WATER SENSOR"
              value={waterEntityId}
              onChangeText={setWaterEntityId}
              placeholder="sensor.water_usage"
            />
            {formError ? (
              <Text style={styles.formError}>{formError}</Text>
            ) : null}
            <Pressable
              disabled={connecting}
              onPress={() => void connect()}
              style={[
                styles.primaryButton,
                connecting && styles.disabledButton,
              ]}
            >
              {connecting ? (
                <ActivityIndicator color={colors.paper} />
              ) : (
                <Text style={styles.primaryButtonText}>
                  Authorize Home Assistant
                </Text>
              )}
            </Pressable>
          </View>
        )}
      </View>
      <Pressable onPress={onSignOut} style={styles.signOutButton}>
        <Text style={styles.signOutText}>Sign out from this iPhone</Text>
      </Pressable>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  url = false,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  url?: boolean;
}) {
  return (
    <View>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType={url ? 'url' : 'default'}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const colors = {
  paper: '#F7F6F2',
  ink: '#16251F',
  muted: '#65706A',
  line: '#D9DED8',
  forest: '#1F4A38',
  moss: '#DDE9DE',
  cream: '#EEE8DD',
  red: '#9F2E28',
  placeholder: '#8C958E',
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  signInPage: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 28,
    paddingBottom: 46,
  },
  wordmark: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 3.6,
  },
  signInTitle: {
    color: colors.ink,
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -1.7,
    lineHeight: 46,
    marginTop: 74,
    maxWidth: 340,
  },
  signInBody: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 20,
    maxWidth: 350,
  },
  eidCard: {
    backgroundColor: colors.cream,
    borderRadius: 22,
    marginBottom: 14,
    padding: 22,
  },
  cardEyebrow: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.3,
  },
  lightEyebrow: { color: '#D7E6D8' },
  eidTitle: {
    color: colors.ink,
    fontSize: 23,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: 10,
  },
  eidBody: { color: colors.muted, fontSize: 14, lineHeight: 20, marginTop: 8 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: colors.forest,
    borderRadius: 14,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: 16,
    marginTop: 20,
  },
  primaryButtonText: { color: colors.paper, fontSize: 15, fontWeight: '700' },
  disabledButton: { opacity: 0.65 },
  pendingText: {
    color: colors.forest,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 13,
    textAlign: 'center',
  },
  notice: {
    backgroundColor: colors.moss,
    borderRadius: 12,
    color: colors.forest,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 18,
    padding: 13,
  },
  appHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 12,
  },
  refreshText: { color: colors.forest, fontSize: 13, fontWeight: '700' },
  content: { padding: 24, paddingBottom: 116 },
  kicker: {
    color: colors.forest,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 10,
  },
  pageTitle: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -1.4,
    lineHeight: 39,
    marginTop: 11,
    maxWidth: 350,
  },
  pageBody: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 13,
  },
  heroCard: {
    backgroundColor: colors.forest,
    borderRadius: 24,
    marginTop: 29,
    padding: 24,
  },
  heroNumber: {
    color: colors.paper,
    fontSize: 52,
    fontWeight: '700',
    letterSpacing: -2,
    marginTop: 10,
  },
  heroDescription: { color: '#D7E6D8', fontSize: 14, marginTop: -2 },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  inlineAction: { color: colors.forest, fontSize: 13, fontWeight: '700' },
  utilityList: { marginTop: 26 },
  utilityCard: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
    padding: 18,
  },
  utilityHeading: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  utilityName: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 6,
  },
  statusDot: { borderRadius: 20, height: 9, marginTop: 5, width: 9 },
  liveDot: { backgroundColor: '#3B9A55' },
  mutedDot: { backgroundColor: '#B0B8B2' },
  utilityValue: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: '700',
    letterSpacing: -1,
    marginTop: 18,
  },
  utilityUnit: { color: colors.muted, fontSize: 17, fontWeight: '500' },
  utilityDetail: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 11,
  },
  outlineButton: {
    alignItems: 'center',
    borderColor: colors.forest,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 18,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  outlineButtonText: {
    color: colors.forest,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  navigation: {
    backgroundColor: '#FEFDFC',
    borderTopColor: colors.line,
    borderTopWidth: 1,
    bottom: 0,
    flexDirection: 'row',
    left: 0,
    paddingBottom: 18,
    paddingHorizontal: 22,
    paddingTop: 11,
    position: 'absolute',
    right: 0,
  },
  navItem: { alignItems: 'center', flex: 1 },
  navMark: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    height: 4,
    marginBottom: 5,
    width: 4,
  },
  navMarkSelected: { backgroundColor: colors.forest, width: 20 },
  navText: { color: colors.muted, fontSize: 11, fontWeight: '600' },
  navTextSelected: { color: colors.forest, fontWeight: '800' },
  settingsCard: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.line,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 28,
    padding: 19,
  },
  formIntro: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
  },
  fieldLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginTop: 19,
  },
  input: {
    backgroundColor: colors.paper,
    borderColor: colors.line,
    borderRadius: 11,
    borderWidth: 1,
    color: colors.ink,
    fontSize: 15,
    marginTop: 7,
    minHeight: 48,
    paddingHorizontal: 12,
  },
  formError: { color: colors.red, fontSize: 13, lineHeight: 18, marginTop: 12 },
  connectedTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '700',
    marginTop: 16,
  },
  connectedDetail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 9,
  },
  dangerButton: {
    alignItems: 'center',
    borderColor: '#E1B7B3',
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 21,
    minHeight: 48,
    justifyContent: 'center',
  },
  dangerButtonText: { color: colors.red, fontSize: 14, fontWeight: '700' },
  signOutButton: { alignItems: 'center', marginTop: 24, padding: 14 },
  signOutText: { color: colors.red, fontSize: 14, fontWeight: '700' },
});

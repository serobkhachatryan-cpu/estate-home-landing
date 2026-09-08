'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  initialDecisionStates,
  type DecisionStateMap,
} from '@/lib/fixtures/overview';
import type { DecisionStatus, SystemId } from '@/lib/fixtures/types';

export type OnboardingAnswers = {
  priorities: string[];
  systemsInPlace: string[];
  updateRecipients: string[];
  completed: boolean;
};

export type MaintenanceDecision = 'pending' | 'approved' | 'deferred';

type AppPrototypeState = {
  decisionStates: DecisionStateMap;
  resolveDecision: (
    id: string,
    status: Exclude<DecisionStatus, 'pending'>,
  ) => void;
  maintenanceDecision: MaintenanceDecision;
  setMaintenanceDecision: (
    status: Exclude<MaintenanceDecision, 'pending'>,
  ) => void;
  automationRequests: Record<string, 'idle' | 'requested'>;
  requestAutomationChange: (id: string) => void;
  onboarding: OnboardingAnswers;
  setOnboarding: (answers: Partial<OnboardingAnswers>) => void;
  completeOnboarding: () => void;
  selectedSystemId: SystemId | null;
  setSelectedSystemId: (id: SystemId | null) => void;
};

const defaultOnboarding: OnboardingAnswers = {
  priorities: [],
  systemsInPlace: [],
  updateRecipients: [],
  completed: false,
};

const AppStateContext = createContext<AppPrototypeState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [decisionStates, setDecisionStates] = useState<DecisionStateMap>(
    initialDecisionStates,
  );
  const [maintenanceDecision, setMaintenanceDecisionState] =
    useState<MaintenanceDecision>('pending');
  const [automationRequests, setAutomationRequests] = useState<
    Record<string, 'idle' | 'requested'>
  >({});
  const [onboarding, setOnboardingState] =
    useState<OnboardingAnswers>(defaultOnboarding);
  const [selectedSystemId, setSelectedSystemId] = useState<SystemId | null>(
    null,
  );

  const resolveDecision = useCallback(
    (id: string, status: Exclude<DecisionStatus, 'pending'>) => {
      setDecisionStates((current) => ({ ...current, [id]: status }));
    },
    [],
  );

  const setMaintenanceDecision = useCallback(
    (status: Exclude<MaintenanceDecision, 'pending'>) => {
      setMaintenanceDecisionState(status);
      setDecisionStates((current) => ({
        ...current,
        'boiler-service': status === 'approved' ? 'approved' : 'deferred',
      }));
    },
    [],
  );

  const requestAutomationChange = useCallback((id: string) => {
    setAutomationRequests((current) => ({ ...current, [id]: 'requested' }));
  }, []);

  const setOnboarding = useCallback((answers: Partial<OnboardingAnswers>) => {
    setOnboardingState((current) => ({ ...current, ...answers }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setOnboardingState((current) => ({ ...current, completed: true }));
  }, []);

  const value = useMemo(
    () => ({
      decisionStates,
      resolveDecision,
      maintenanceDecision,
      setMaintenanceDecision,
      automationRequests,
      requestAutomationChange,
      onboarding,
      setOnboarding,
      completeOnboarding,
      selectedSystemId,
      setSelectedSystemId,
    }),
    [
      decisionStates,
      resolveDecision,
      maintenanceDecision,
      setMaintenanceDecision,
      automationRequests,
      requestAutomationChange,
      onboarding,
      setOnboarding,
      completeOnboarding,
      selectedSystemId,
    ],
  );

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}

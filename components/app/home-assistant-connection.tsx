'use client';

import { ExternalLink, LoaderCircle, ShieldCheck, Unplug } from 'lucide-react';
import { useState } from 'react';
import { AppLink } from '@/components/app/app-link';
import { PageHeader } from '@/components/app/app-shell';
import { StatusBadge } from '@/components/app/status-badge';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

type ConnectionSummary = {
  connected: boolean;
  instanceHost: string | null;
  electricityEntityId: string | null;
  waterEntityId: string | null;
  updatedAt: string | null;
};

type ConnectForm = {
  instanceUrl: string;
  electricityEntityId: string;
  waterEntityId: string;
};

const emptyForm: ConnectForm = {
  instanceUrl: '',
  electricityEntityId: '',
  waterEntityId: '',
};

function statusMessage(status: string | undefined) {
  if (status === 'connected') return 'Home Assistant is connected.';
  if (status === 'disconnected') return 'Home Assistant has been disconnected.';
  if (status === 'sign-in-required')
    return 'Sign in with your W3DS eID, then try again.';
  if (status === 'not-connected')
    return 'Home Assistant did not complete the connection.';
  return null;
}

export function HomeAssistantConnection({
  connection,
  localDevelopment = false,
  status,
}: {
  connection: ConnectionSummary;
  localDevelopment?: boolean;
  status?: string;
}) {
  const [form, setForm] = useState<ConnectForm>({
    instanceUrl: '',
    electricityEntityId: connection.electricityEntityId ?? '',
    waterEntityId: connection.waterEntityId ?? '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const message = statusMessage(status);

  const connect = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/home-assistant/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as {
        authorizeUrl?: string;
        error?: string;
      };
      if (!response.ok || !payload.authorizeUrl) {
        throw new Error(payload.error ?? 'Could not start Home Assistant.');
      }
      window.location.assign(payload.authorizeUrl);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Could not start Home Assistant.',
      );
      setSubmitting(false);
    }
  };

  const disconnect = async () => {
    if (
      !window.confirm(
        'Disconnect Home Assistant and delete its encrypted credentials from Oriel?',
      )
    ) {
      return;
    }
    setDisconnecting(true);
    setError(null);
    try {
      const response = await fetch('/api/home-assistant/connection', {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Could not disconnect Home Assistant.');
      window.location.assign('/app/home-assistant?status=disconnected');
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Could not disconnect Home Assistant.',
      );
      setDisconnecting(false);
    }
  };

  return (
    <div>
      <AppLink
        href="/app/settings"
        className="mb-3 inline-block text-[12px] font-medium text-[#815f2c]"
      >
        ← Settings
      </AppLink>
      <PageHeader
        title="Home Assistant"
        description="Use your own Home Assistant unit for live electricity and water readings."
      />

      {localDevelopment ? (
        <div className="mb-4 rounded-2xl bg-[#edf4f4] px-4 py-3 text-[13px] leading-5 text-[#35545a]">
          Local development mode is active. Oriel can reach only this Mac’s Home
          Assistant VM; the connection is not exposed to the internet.
        </div>
      ) : null}

      {message ? (
        <div className="mb-4 rounded-2xl bg-[#f3eadc] px-4 py-3 text-[13px] text-[#61502e]">
          {message}
        </div>
      ) : null}

      {connection.connected ? (
        <section className="rounded-3xl bg-[#173850] px-5 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#d9b779]">
                Connected unit
              </p>
              <h2 className="mt-2 text-[1.2rem] font-semibold tracking-[-0.04em]">
                {connection.instanceHost}
              </h2>
            </div>
            <StatusBadge
              state="normal"
              label="Connected"
              className="border-white/15 bg-white/10 text-white"
            />
          </div>
          <dl className="mt-5 space-y-3 border-t border-white/12 pt-4 text-[13px]">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-white/60">Electricity</dt>
              <dd className="font-medium">{connection.electricityEntityId}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-white/60">Water</dt>
              <dd className="font-medium">{connection.waterEntityId}</dd>
            </div>
          </dl>
          <Button
            variant="ghost"
            className="mt-5 h-9 rounded-full border border-white/20 px-3 text-[12px] text-white hover:bg-white/10 hover:text-white"
            onClick={() => void disconnect()}
            disabled={disconnecting}
          >
            {disconnecting ? (
              <LoaderCircle className="animate-spin" />
            ) : (
              <Unplug />
            )}
            {disconnecting ? 'Disconnecting…' : 'Disconnect'}
          </Button>
        </section>
      ) : null}

      <section className="mt-4 rounded-3xl bg-[#fcfbf8] px-5 py-5 ring-1 ring-[#e0d8cb]">
        <div className="flex gap-3">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[#8f7040]" />
          <div>
            <h2 className="text-[15px] font-semibold text-[#153044]">
              Authorize with Home Assistant
            </h2>
            <p className="mt-1 text-[13px] leading-5 text-[#52626c]">
              You will sign in to your own instance. Oriel reads only the two
              sensors you choose and never sends a device-control command.
            </p>
          </div>
        </div>

        <form className="mt-5" onSubmit={connect}>
          <FieldGroup className="gap-3">
            <Field>
              <FieldLabel htmlFor="home-assistant-url">
                {localDevelopment
                  ? 'Home Assistant address'
                  : 'Home Assistant HTTPS address'}
              </FieldLabel>
              <Input
                id="home-assistant-url"
                className="form-input"
                required
                type="url"
                autoComplete="url"
                placeholder={
                  localDevelopment
                    ? 'http://127.0.0.1:8125'
                    : 'https://your-home.ui.nabu.casa'
                }
                value={form.instanceUrl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    instanceUrl: event.target.value,
                  }))
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="electricity-entity">
                Electricity sensor ID
              </FieldLabel>
              <Input
                id="electricity-entity"
                className="form-input"
                required
                placeholder="sensor.home_electricity_usage"
                value={form.electricityEntityId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    electricityEntityId: event.target.value,
                  }))
                }
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="water-entity">Water sensor ID</FieldLabel>
              <Input
                id="water-entity"
                className="form-input"
                required
                placeholder="sensor.home_water_usage"
                value={form.waterEntityId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    waterEntityId: event.target.value,
                  }))
                }
              />
            </Field>
            {error ? <FieldError>{error}</FieldError> : null}
            <Button
              className="mt-1 w-full bg-[#173850] text-white hover:bg-[#102d43]"
              disabled={submitting}
              size="lg"
              type="submit"
            >
              {submitting ? (
                <LoaderCircle className="animate-spin" />
              ) : (
                <ExternalLink />
              )}
              {submitting
                ? 'Opening Home Assistant…'
                : 'Connect Home Assistant'}
            </Button>
          </FieldGroup>
        </form>
      </section>
    </div>
  );
}

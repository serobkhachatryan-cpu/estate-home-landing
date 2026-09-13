'use client';

import { useState } from 'react';
import { Home, LoaderCircle, Plus, ShieldCheck } from 'lucide-react';
import { AppLink } from '@/components/app/app-link';
import { PageHeader } from '@/components/app/app-shell';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';

const timezones = [
  { value: 'Europe/London', label: 'London (GMT / BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET / CEST)' },
  { value: 'Europe/Yerevan', label: 'Yerevan (AMT)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'America/New_York', label: 'New York (ET)' },
];

type PropertyRole = 'owner' | 'manager' | 'observer';

export type WorkspaceProperty = {
  id: string;
  name: string;
  area: string;
  timezone: string;
  role: PropertyRole;
};

type NewPropertyForm = {
  name: string;
  area: string;
  timezone: string;
};

const defaultForm = (): NewPropertyForm => ({
  name: '',
  area: '',
  timezone: 'Europe/London',
});

function roleLabel(role: PropertyRole) {
  if (role === 'owner') return 'Owner';
  if (role === 'manager') return 'Manager';
  return 'View only';
}

export function PropertiesWorkspace({
  initialProperties,
}: {
  initialProperties: WorkspaceProperty[];
}) {
  const [properties, setProperties] = useState(initialProperties);
  const [open, setOpen] = useState(initialProperties.length === 0);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/properties', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as {
        property?: WorkspaceProperty;
        error?: string;
      };
      if (!response.ok || !payload.property) {
        throw new Error(payload.error ?? 'Could not create this property.');
      }

      setProperties((current) => [...current, payload.property!]);
      setForm(defaultForm());
      setOpen(false);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'Could not create this property.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Properties"
        description="Each home has its own records, access roles, and operating picture."
        actions={
          properties.length ? (
            <Button
              className="bg-[#173850] text-white hover:bg-[#102d43]"
              onClick={() => {
                setError(null);
                setOpen(true);
              }}
              size="icon"
              aria-label="Add property"
            >
              <Plus />
            </Button>
          ) : undefined
        }
      />

      {properties.length ? (
        <ul className="space-y-2" aria-label="Your properties">
          {properties.map((property) => (
            <li key={property.id}>
              <AppLink
                className="block rounded-2xl bg-[#fcfbf8] px-4 py-3.5 ring-1 ring-[#e0d8cb] transition-colors hover:bg-white"
                href={`/app/spending?property=${encodeURIComponent(property.id)}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold text-[#153044]">
                      {property.name}
                    </p>
                    <p className="mt-0.5 text-[12px] text-[#6b777f]">
                      {property.area} · {property.timezone}
                    </p>
                  </div>
                  <span className="rounded-full bg-[#e3efe4] px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.1em] text-[#265b3a]">
                    {roleLabel(property.role)}
                  </span>
                </div>
              </AppLink>
            </li>
          ))}
        </ul>
      ) : (
        <section className="rounded-3xl bg-[#173850] px-5 py-6 text-white">
          <Home className="size-5 text-[#d9b779]" />
          <h2 className="mt-4 text-[1.35rem] font-semibold tracking-[-0.04em]">
            Start with one home.
          </h2>
          <p className="mt-2 text-[13px] leading-5 text-white/68">
            Its spend, decisions, and future building data will remain isolated
            from every other property.
          </p>
          <Button
            className="mt-5 bg-[#d9b779] text-[#153044] hover:bg-[#e6c88f]"
            onClick={() => setOpen(true)}
          >
            <Plus data-icon="inline-start" />
            Add your first property
          </Button>
        </section>
      )}

      <div className="mt-5 flex gap-2 rounded-2xl bg-[#f3eadc] px-3.5 py-3 text-[12px] leading-5 text-[#61502e]">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" />
        Property access is assigned separately. In this first release, owners
        and managers can add costs; observers can only review them.
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="max-h-[calc(100dvh-2rem)] overflow-y-auto bg-[#fdf8f5] text-[#153044]"
          showCloseButton={!submitting}
        >
          <DialogHeader>
            <DialogTitle className="text-[1.25rem] tracking-[-0.035em] text-[#153044]">
              Add a property
            </DialogTitle>
            <DialogDescription className="text-[#6b777f]">
              Keep the operating records for this home separate from every other
              property.
            </DialogDescription>
          </DialogHeader>

          <form className="mt-1" onSubmit={submit}>
            <FieldGroup className="gap-3">
              <Field>
                <FieldLabel htmlFor="property-name">Property name</FieldLabel>
                <Input
                  id="property-name"
                  required
                  maxLength={100}
                  placeholder="Carlton Hill"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="property-area">Location</FieldLabel>
                <Input
                  id="property-area"
                  required
                  maxLength={120}
                  placeholder="St John’s Wood, London"
                  value={form.area}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      area: event.target.value,
                    }))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="property-timezone">Time zone</FieldLabel>
                <select
                  id="property-timezone"
                  className="h-8 w-full rounded-lg border border-[#d8d0c3] bg-transparent px-2.5 text-sm outline-none focus:border-[#815f2c] focus:ring-3 focus:ring-[#d9b779]/30"
                  value={form.timezone}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      timezone: event.target.value,
                    }))
                  }
                >
                  {timezones.map((timezone) => (
                    <option key={timezone.value} value={timezone.value}>
                      {timezone.label}
                    </option>
                  ))}
                </select>
              </Field>
              {error ? <FieldError>{error}</FieldError> : null}
              <Button
                className="mt-1 w-full bg-[#173850] text-white hover:bg-[#102d43]"
                disabled={submitting}
                size="lg"
                type="submit"
              >
                {submitting ? <LoaderCircle className="animate-spin" /> : null}
                {submitting ? 'Creating property…' : 'Create property'}
              </Button>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { CircleAlert, LoaderCircle, Plus } from 'lucide-react';
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
import { cn } from '@/lib/utils';

const categories = [
  { value: 'occupancy', label: 'Occupancy' },
  { value: 'staff', label: 'Staff' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'renovation', label: 'Renovation' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'care', label: 'Care' },
];

type SpendKind = 'plan' | 'fact' | 'forecast';

type SpendRecord = {
  id: string;
  category: string;
  description: string;
  supplier: string | null;
  amountPence: number;
  entryDate: string;
  kind: SpendKind;
  createdAt: string;
};

type LedgerResponse = {
  records: SpendRecord[];
  factTotalPence: number;
};

function today() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .formatToParts(new Date())
    .reduce<Record<string, string>>((result, part) => {
      if (part.type !== 'literal') result[part.type] = part.value;
      return result;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function formatMoney(amountPence: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 2,
  }).format(amountPence / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T12:00:00Z`));
}

function categoryLabel(value: string) {
  return (
    categories.find((category) => category.value === value)?.label ?? value
  );
}

const defaultForm = () => ({
  category: 'utilities',
  description: '',
  supplier: '',
  amountPounds: '',
  entryDate: today(),
  kind: 'fact' as SpendKind,
});

export function SpendLedger({
  canWrite,
  propertyId,
}: {
  canWrite: boolean;
  propertyId: string;
}) {
  const [records, setRecords] = useState<SpendRecord[]>([]);
  const [factTotalPence, setFactTotalPence] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const endpoint = `/api/properties/${encodeURIComponent(propertyId)}/spend-records`;

  useEffect(() => {
    let active = true;
    fetch(endpoint)
      .then(async (response) => {
        const payload = (await response.json()) as LedgerResponse & {
          error?: string;
        };
        if (!response.ok)
          throw new Error(payload.error ?? 'Could not load the ledger.');
        return payload;
      })
      .then((payload) => {
        if (!active) return;
        setRecords(payload.records);
        setFactTotalPence(payload.factTotalPence);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (active) {
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Could not load the ledger.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [endpoint]);

  const factCount = useMemo(
    () => records.filter((record) => record.kind === 'fact').length,
    [records],
  );

  const submit = async (event: { preventDefault: () => void }) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as {
        record?: SpendRecord;
        error?: string;
      };
      if (!response.ok || !payload.record) {
        throw new Error(payload.error ?? 'Could not save this cost.');
      }

      setRecords((current) => [payload.record!, ...current]);
      if (payload.record.kind === 'fact') {
        setFactTotalPence((current) => current + payload.record!.amountPence);
      }
      setConfirmation(`${payload.record.description} has been recorded.`);
      setForm(defaultForm());
      setDialogOpen(false);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'Could not save this cost.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="ledger-heading" className="mt-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8f7040]">
            Operational ledger
          </p>
          <h2
            id="ledger-heading"
            className="mt-1 text-[1.25rem] font-semibold tracking-[-0.035em] text-[#153044]"
          >
            Recorded costs
          </h2>
        </div>
        {canWrite ? (
          <Button
            onClick={() => {
              setFormError(null);
              setDialogOpen(true);
            }}
            className="bg-[#173850] text-white hover:bg-[#102d43]"
          >
            <Plus data-icon="inline-start" />
            Add cost
          </Button>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-[#173850] px-3.5 py-3 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-white/55">
            Fact costs recorded
          </p>
          <p className="mt-1 text-[1.35rem] font-semibold tracking-[-0.045em] tabular-nums">
            {loading ? '—' : formatMoney(factTotalPence)}
          </p>
        </div>
        <div className="rounded-2xl bg-[#fdf8f5] px-3.5 py-3 text-[#153044] ring-1 ring-[#e0d8cb]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#8f7040]">
            Entries
          </p>
          <p className="mt-1 text-[1.35rem] font-semibold tracking-[-0.045em] tabular-nums">
            {loading ? '—' : factCount}
          </p>
        </div>
      </div>

      {confirmation ? (
        <output
          className="mt-3 block rounded-xl bg-[#e3efe4] px-3 py-2 text-[12px] font-medium text-[#265b3a]"
          aria-live="polite"
        >
          {confirmation}
        </output>
      ) : null}

      {!canWrite ? (
        <p className="mt-3 rounded-xl bg-[#f3eadc] px-3 py-2 text-[12px] leading-5 text-[#61502e]">
          Your access is view only. An owner or manager can add costs.
        </p>
      ) : null}

      {loadError ? (
        <div
          role="alert"
          className="mt-3 flex gap-2 rounded-2xl bg-[#f8e8e3] px-3 py-3 text-[12px] leading-5 text-[#833d2e]"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0" />
          {loadError}
        </div>
      ) : null}

      <div className="mt-3 overflow-hidden rounded-2xl bg-[#fdf8f5] ring-1 ring-[#e0d8cb]">
        {loading ? (
          <div className="flex items-center gap-2 px-4 py-5 text-[12px] text-[#6b777f]">
            <LoaderCircle className="size-4 animate-spin" />
            Loading recorded costs…
          </div>
        ) : records.length ? (
          <ul className="divide-y divide-[#e7dfd4]" aria-label="Recorded costs">
            {records.map((record) => (
              <li
                key={record.id}
                className="flex items-start justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                    <p className="truncate text-[13px] font-semibold text-[#153044]">
                      {record.description}
                    </p>
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.1em]',
                        record.kind === 'fact'
                          ? 'bg-[#e3efe4] text-[#265b3a]'
                          : 'bg-[#f3eadc] text-[#815f2c]',
                      )}
                    >
                      {record.kind}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-[#6b777f]">
                    {categoryLabel(record.category)}
                    {record.supplier ? ` · ${record.supplier}` : ''}
                    {' · '}
                    {formatDate(record.entryDate)}
                  </p>
                </div>
                <p className="shrink-0 text-[13px] font-semibold tabular-nums text-[#153044]">
                  {formatMoney(record.amountPence)}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-5">
            <p className="text-[13px] font-semibold text-[#153044]">
              No costs recorded yet.
            </p>
            <p className="mt-1 text-[12px] leading-5 text-[#6b777f]">
              Add the first bill, supplier cost, or planned item. It will remain
              here when you return.
            </p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-h-[calc(100dvh-2rem)] overflow-y-auto bg-[#fdf8f5] text-[#153044]"
          showCloseButton={!submitting}
        >
          <DialogHeader>
            <DialogTitle className="text-[1.25rem] tracking-[-0.035em] text-[#153044]">
              Record a cost
            </DialogTitle>
            <DialogDescription className="text-[#6b777f]">
              This first version stores a property operating record. Receipt
              uploads and approvals come next.
            </DialogDescription>
          </DialogHeader>

          <form className="mt-1" onSubmit={submit}>
            <FieldGroup className="gap-3">
              <Field>
                <FieldLabel htmlFor="cost-description">
                  What was this for?
                </FieldLabel>
                <Input
                  id="cost-description"
                  required
                  maxLength={140}
                  placeholder="Plant-room filter service"
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="cost-amount">Amount (£)</FieldLabel>
                  <Input
                    id="cost-amount"
                    required
                    min="0.01"
                    max="10000000"
                    step="0.01"
                    inputMode="decimal"
                    type="number"
                    placeholder="420.00"
                    value={form.amountPounds}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        amountPounds: event.target.value,
                      }))
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="cost-date">Date</FieldLabel>
                  <Input
                    id="cost-date"
                    required
                    type="date"
                    value={form.entryDate}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        entryDate: event.target.value,
                      }))
                    }
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field>
                  <FieldLabel htmlFor="cost-category">Category</FieldLabel>
                  <select
                    id="cost-category"
                    className="h-8 w-full rounded-lg border border-[#d8d0c3] bg-transparent px-2.5 text-sm outline-none focus:border-[#815f2c] focus:ring-3 focus:ring-[#d9b779]/30"
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="cost-kind">Record type</FieldLabel>
                  <select
                    id="cost-kind"
                    className="h-8 w-full rounded-lg border border-[#d8d0c3] bg-transparent px-2.5 text-sm outline-none focus:border-[#815f2c] focus:ring-3 focus:ring-[#d9b779]/30"
                    value={form.kind}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        kind: event.target.value as SpendKind,
                      }))
                    }
                  >
                    <option value="fact">Fact</option>
                    <option value="plan">Plan</option>
                    <option value="forecast">Forecast</option>
                  </select>
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="cost-supplier">
                  Supplier{' '}
                  <span className="font-normal text-[#6b777f]">(optional)</span>
                </FieldLabel>
                <Input
                  id="cost-supplier"
                  maxLength={100}
                  placeholder="Kingsbridge Mechanical"
                  value={form.supplier}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      supplier: event.target.value,
                    }))
                  }
                />
              </Field>
              {formError ? <FieldError>{formError}</FieldError> : null}
              <Button
                disabled={submitting}
                className="mt-1 w-full bg-[#173850] text-white hover:bg-[#102d43]"
                size="lg"
                type="submit"
              >
                {submitting ? <LoaderCircle className="animate-spin" /> : null}
                {submitting ? 'Saving cost…' : 'Save cost'}
              </Button>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

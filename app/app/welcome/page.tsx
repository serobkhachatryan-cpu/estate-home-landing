'use client';

import { AppLink } from '@/components/app/app-link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAppState } from '@/lib/app-state';
import { cn } from '@/lib/utils';

const priorityOptions = [
  'Understand what I get for money spent',
  'Electricity: useful vs waste',
  'Water: use vs loss',
  'Natural wear of the house',
  'Value of supporting work',
];

const systemOptions = [
  'Electricity metering / bills',
  'Water supply',
  'Heating (later)',
  'Planned maintenance records',
];

const recipientOptions = ['Timur', 'Household help', 'Oriel (pilot notes)'];

function toggleValue(list: string[], value: string) {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

export default function WelcomePage() {
  const router = useRouter();
  const { onboarding, setOnboarding, completeOnboarding } = useAppState();
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: 'What should this home product answer first?',
      text: 'For Timur: money spent → useful outcome. Not gadgets.',
      options: priorityOptions,
      selected: onboarding.priorities,
      onToggle: (value: string) =>
        setOnboarding({
          priorities: toggleValue(onboarding.priorities, value),
        }),
    },
    {
      title: 'What is already in place?',
      text: 'Stage 1 focuses on electricity and water. The rest can wait.',
      options: systemOptions,
      selected: onboarding.systemsInPlace,
      onToggle: (value: string) =>
        setOnboarding({
          systemsInPlace: toggleValue(onboarding.systemsInPlace, value),
        }),
    },
    {
      title: 'Who should see pilot updates?',
      text: 'Keep the circle small while the dashboard is still being drawn.',
      options: recipientOptions,
      selected: onboarding.updateRecipients,
      onToggle: (value: string) =>
        setOnboarding({
          updateRecipients: toggleValue(onboarding.updateRecipients, value),
        }),
    },
  ] as const;

  const current = steps[step];

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <div className="mb-10">
        <AppLink
          href="/app"
          className="flex items-center gap-3"
          aria-label="Oriel app"
        >
          <span className="flex size-9 items-center justify-center rounded-full border border-[#c3ad85] bg-[#173850] font-serif text-lg italic text-white">
            O
          </span>
          <span className="text-sm font-semibold tracking-[0.22em]">ORIEL</span>
        </AppLink>
        <p className="mt-8 eyebrow">Welcome · Timur</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-[#153044]">
          Start with your home.
        </h1>
        <p className="mt-4 text-[15px] leading-6 text-[#52626c]">
          Stage 1 sketch only. Final layout waits for your own dashboard
          drawing.
        </p>
      </div>

      <div className="border border-[#d8d0c3] bg-[#fcfbf8] p-6 sm:p-8">
        <div
          className="mb-6 flex items-center gap-2"
          aria-label={`Step ${step + 1} of 3`}
        >
          {steps.map((_, index) => (
            <span
              key={index}
              className={cn(
                'h-1 flex-1 rounded-full',
                index <= step ? 'bg-[#173850]' : 'bg-[#e0d8cb]',
              )}
            />
          ))}
        </div>

        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
          Step {step + 1} of 3
        </p>
        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-[#153044]">
          {current.title}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#52626c]">{current.text}</p>

        <div className="mt-6 space-y-2">
          {current.options.map((option) => {
            const selected = current.selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => current.onToggle(option)}
                aria-pressed={selected}
                className={cn(
                  'flex w-full items-center justify-between border px-4 py-3 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#a88348]/50',
                  selected
                    ? 'border-[#173850] bg-[#173850] text-white'
                    : 'border-[#d8d0c3] bg-white text-[#243a48] hover:border-[#c3ad85]',
                )}
              >
                <span>{option}</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                  {selected ? 'Selected' : 'Select'}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            className="h-10 rounded-full border-[#cfc5b4]"
            disabled={step === 0}
            onClick={() => setStep((value) => Math.max(0, value - 1))}
          >
            Back
          </Button>
          {step < steps.length - 1 ? (
            <Button
              className="h-10 rounded-full bg-[#173850] hover:bg-[#0d283b]"
              onClick={() =>
                setStep((value) => Math.min(steps.length - 1, value + 1))
              }
            >
              Continue
            </Button>
          ) : (
            <Button
              className="h-10 rounded-full bg-[#173850] hover:bg-[#0d283b]"
              onClick={() => {
                completeOnboarding();
                router.push('/app');
              }}
            >
              Enter home summary
            </Button>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-xs text-[#6b777f]">
        <button
          type="button"
          className="font-medium text-[#815f2c] underline"
          onClick={() => router.push('/app')}
        >
          Skip to home
        </button>
      </p>
    </div>
  );
}

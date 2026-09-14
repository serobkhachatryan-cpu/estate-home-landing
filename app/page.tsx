'use client';

import {
  ArrowDownRight,
  ArrowUpRight,
  Bolt,
  Droplets,
  LockKeyhole,
  Wrench,
} from 'lucide-react';
import { AppLink } from '@/components/app/app-link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const systems = [
  {
    icon: Bolt,
    title: 'Electricity',
    text: 'See whether power bought useful work or unnecessary idle load. Start with the costs that repeat every day.',
  },
  {
    icon: Droplets,
    title: 'Water',
    text: 'Separate normal household use from possible loss, and surface an overnight rise before it becomes a repair.',
  },
  {
    icon: Wrench,
    title: 'Supporting care',
    text: 'Put planned maintenance in the same picture, so you can see how care protects the systems you pay to run.',
  },
];

const estateStandards = [
  {
    number: '01',
    title: 'Paid → received',
    text: 'Understand what you spent and what that money actually put to use or protected.',
  },
  {
    number: '02',
    title: 'Normal → needs a look',
    text: 'See only the exceptions that deserve your attention—not an endless dashboard of signals.',
  },
  {
    number: '03',
    title: 'Now → next',
    text: 'Begin with electricity and water, then expand only when the first picture is trusted.',
  },
];

const pilotValue = [
  {
    category: 'Electricity',
    paid: '£980',
    received: 'Useful power',
    action: 'Lighting, plant and appliances on the right schedule',
    exception: 'Overnight standby is a little high',
  },
  {
    category: 'Water',
    paid: '£90',
    received: 'Use + loss avoided',
    action: 'Normal household use with an overnight rise caught early',
    exception: 'Brief overnight flow rise to review',
  },
  {
    category: 'Supporting care',
    paid: '£350',
    received: 'Reliability protected',
    action: 'Planned filter service supports the priority utilities',
    exception: 'No exception this month',
  },
];

export default function Home() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f1e9] text-[#102030]">
      <section className="relative min-h-[760px] overflow-hidden bg-[#102a3e] text-white sm:min-h-[820px]">
        <img
          alt="A London townhouse at dusk, warmly lit and quietly protected"
          className="absolute inset-0 h-full w-full object-cover object-[64%_center]"
          src="/images/estate-hero.png"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,24,39,0.95)_0%,rgba(8,24,39,0.84)_35%,rgba(8,24,39,0.28)_70%,rgba(8,24,39,0.18)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-[linear-gradient(0deg,rgba(8,24,39,0.78),transparent)]" />

        <nav className="relative mx-auto flex max-w-[1340px] items-center justify-between px-6 py-7 sm:px-10 lg:px-14">
          <a
            className="flex items-center gap-3"
            href="#top"
            aria-label="Oriel home"
          >
            <span className="flex size-9 items-center justify-center rounded-full border border-white/35 bg-white/10 font-serif text-lg italic">
              O
            </span>
            <span className="text-sm font-semibold tracking-[0.22em]">
              ORIEL
            </span>
          </a>
          <a
            className="inline-flex items-center gap-2 text-sm font-medium text-white transition hover:text-[#eac789]"
            href="#introduction"
          >
            Talk to us <ArrowUpRight className="size-4" />
          </a>
        </nav>

        <div
          id="top"
          className="relative mx-auto flex max-w-[1340px] px-6 pb-28 pt-20 sm:px-10 sm:pt-28 lg:px-14 lg:pt-36"
        >
          <div className="max-w-2xl">
            <p className="mb-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#eac789]">
              <span className="h-px w-8 bg-[#eac789]" />
              Private home operations · London
            </p>
            <h1 className="max-w-xl font-serif text-5xl leading-[0.97] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              Optimize your home&apos;s spending—even when you&apos;re away.
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-8 text-white/78 sm:text-xl">
              Start with a simple view of what you paid, what it delivered, and
              what needs a look—beginning with electricity, water and the care
              that keeps them working.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <AppLink
                href="/app"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#eac789] px-6 text-[15px] font-semibold text-[#122434] transition hover:bg-[#f2d49e]"
              >
                See the Stage 1 product <ArrowUpRight className="size-4" />
              </AppLink>
              <a
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-6 text-[15px] font-medium transition hover:border-white/60 hover:bg-white/8"
                href="#introduction"
              >
                Arrange a private introduction{' '}
                <ArrowDownRight className="size-4" />
              </a>
            </div>
            <p className="mt-5 text-sm leading-6 text-white/65">
              On iPhone, open Oriel in Safari, tap Share, then choose{' '}
              <span className="font-medium text-white/90">Add to Home Screen</span>{' '}
              for an app-like experience.
            </p>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[1340px] px-6 pb-6 sm:px-10 sm:pb-8 lg:px-14">
          <div className="overflow-hidden border border-white/20 bg-[#0b2131]/70 shadow-[0_24px_60px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <div className="border-b border-white/15 px-5 py-3 sm:px-7">
              <p className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#eac789]">
                <span className="size-1.5 rounded-full bg-[#eac789] shadow-[0_0_0_4px_rgba(234,199,137,0.12)]" />
                The Oriel standard
              </p>
            </div>
            <div className="grid md:grid-cols-3">
              {estateStandards.map((standard) => (
                <article
                  key={standard.number}
                  className="group relative min-h-0 overflow-hidden border-b border-white/15 px-5 py-5 last:border-b-0 md:min-h-44 md:border-b-0 md:border-r md:px-7 md:last:border-r-0"
                >
                  <span className="pointer-events-none absolute -right-1 -top-6 font-serif text-[7.5rem] leading-none tracking-[-0.1em] text-white/[0.035] transition duration-500 group-hover:text-[#eac789]/[0.09]">
                    {standard.number}
                  </span>
                  <div className="relative flex h-full flex-col">
                    <div>
                      <span className="text-[11px] font-semibold tracking-[0.2em] text-[#eac789]">
                        {standard.number}
                      </span>
                    </div>
                    <h3 className="mt-6 max-w-[15rem] font-serif text-[1.75rem] leading-[0.98] tracking-[-0.045em] text-white">
                      {standard.title}
                    </h3>
                    <p className="mt-3 max-w-[16rem] text-sm leading-5 text-white/63">
                      {standard.text}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="systems" className="bg-[#e7dfd0] py-24 sm:py-32">
        <div className="mx-auto max-w-[1340px] px-6 sm:px-10 lg:px-14">
          <div className="flex flex-col justify-between gap-8 border-b border-[#bcb3a4] pb-12 md:flex-row md:items-end">
            <div>
              <p className="eyebrow">A simple picture, first.</p>
              <h2 className="mt-5 max-w-2xl font-serif text-4xl leading-[1.03] tracking-[-0.04em] sm:text-5xl">
                What you paid. What you received. What needs a look.
              </h2>
            </div>
            <p className="max-w-sm text-[15px] leading-6 text-[#54636d]">
              Oriel does not begin as a surveillance wall or a complicated
              estate console. We start with electricity and water, show the
              value of supporting care, and make exceptions clear enough to act
              on.
            </p>
          </div>

          <div className="grid md:grid-cols-3">
            {systems.map(({ icon: Icon, title, text }, index) => (
              <article
                key={title}
                className="group relative border-b border-[#bcb3a4] py-9 md:px-8 md:odd:border-r md:odd:pr-12 md:even:pl-12"
              >
                <span className="absolute right-0 top-9 text-xs font-semibold tracking-[0.16em] text-[#a2895d] md:right-8">
                  0{index + 1}
                </span>
                <Icon className="size-6 text-[#8f7040]" strokeWidth={1.5} />
                <h3 className="mt-8 text-2xl font-medium tracking-[-0.025em]">
                  {title}
                </h3>
                <p className="mt-3 max-w-md text-[15px] leading-6 text-[#50606a]">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#102a3e] py-24 text-white sm:py-32">
        <div className="mx-auto grid max-w-[1340px] gap-14 px-6 sm:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:px-14">
          <div>
            <p className="eyebrow text-[#eac789]">The Oriel delivery plan</p>
            <h2 className="mt-5 max-w-sm font-serif text-4xl leading-[1.03] tracking-[-0.04em] sm:text-5xl">
              A disciplined timeline and clear pricing.
            </h2>
          </div>
          <ol className="divide-y divide-white/15">
            {[
              [
                'Assessment',
                '1 day',
                '£1,000',
                'We map the bills, existing equipment and daily patterns, then agree the small set of costs worth making visible first.',
              ],
              [
                'Planning & refining',
                '1–2 days',
                '£1,000',
                'We define what “paid”, “received”, “normal” and “needs a look” should mean for your home before any wider rollout.',
              ],
              [
                'Deployment',
                '2 weeks maximum',
                'Up to £25k',
                'We connect the agreed electricity and water signals with minimal disruption. Your Oriel app turns them into one calm, practical view.',
              ],
              [
                'Ongoing operations',
                'Continuous',
                '£1,000 / year',
                'We review exceptions, keep useful systems working and expand the picture only when the first stage is earning trust.',
              ],
            ].map(([title, duration, price, text], index) => (
              <li
                key={title}
                className="grid grid-cols-[44px_1fr] gap-5 py-6 sm:grid-cols-[90px_1fr]"
              >
                <span className="pt-1 text-xs font-semibold tracking-[0.16em] text-[#eac789]">
                  0{index + 1}
                </span>
                <div>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h3 className="text-xl font-medium">{title}</h3>
                    <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                      <span className="font-serif text-2xl leading-none tracking-[-0.04em] text-[#f2d49e]">
                        {price}
                      </span>
                      <span className="w-fit rounded-full border border-[#eac789]/40 bg-[#eac789]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#eac789]">
                        {duration}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 max-w-xl text-[15px] leading-6 text-white/65">
                    {text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#e7dfd0] py-24 sm:py-32">
        <div className="pointer-events-none absolute right-[-12rem] top-[-14rem] size-[34rem] rounded-full border border-[#c3ad85]/30" />
        <div className="pointer-events-none absolute right-[-3rem] top-[-5rem] size-[22rem] rounded-full border border-[#c3ad85]/25" />
        <div className="relative mx-auto max-w-[1340px] px-6 sm:px-10 lg:px-14">
          <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="eyebrow">The first home view</p>
              <h2 className="mt-5 max-w-xl font-serif text-4xl leading-[1.03] tracking-[-0.04em] sm:text-5xl">
                A calmer monthly picture of a London home.
              </h2>
              <p className="mt-6 max-w-lg text-[17px] leading-7 text-[#52626c]">
                The first Oriel view does not overwhelm the owner with raw kWh,
                litres or surveillance feeds. It shows what was paid, what was
                put to use or protected, and the two exceptions worth reviewing.
              </p>
              <div className="mt-9 grid max-w-lg grid-cols-2 border-y border-[#bcb3a4]">
                <div className="py-5 pr-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
                    Paid · this month
                  </p>
                  <p className="mt-2 font-serif text-3xl tracking-[-0.04em] text-[#1b3040]">
                    £1,420
                  </p>
                  <p className="mt-1 text-xs text-[#61717a]">
                    Electricity, water and supporting care
                  </p>
                </div>
                <div className="border-l border-[#bcb3a4] py-5 pl-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
                    Received / protected
                  </p>
                  <p className="mt-2 font-serif text-3xl tracking-[-0.04em] text-[#1b3040]">
                    £1.33
                  </p>
                  <p className="mt-1 text-xs text-[#61717a]">
                    For every £1 paid
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#c2b7a5] bg-[#f9f6ef] shadow-[0_28px_80px_rgba(35,46,52,0.10)]">
              <div className="flex flex-col justify-between gap-5 border-b border-[#d5ccbe] bg-[#f0eadf] px-6 py-6 sm:flex-row sm:items-end sm:px-8">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8f7040]">
                    Paid → received
                  </p>
                  <h3 className="mt-2 font-serif text-3xl tracking-[-0.04em] text-[#153044]">
                    What the owner sees first
                  </h3>
                </div>
                <div className="border-l-2 border-[#a98043] pl-4">
                  <p className="font-serif text-3xl leading-none tracking-[-0.04em] text-[#153044]">
                    2
                  </p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7d683e]">
                    small exceptions
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left">
                  <thead className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#7b817d]">
                    <tr className="border-b border-[#ded6c9]">
                      <th className="px-6 py-4 font-semibold sm:px-8">Area</th>
                      <th className="px-4 py-4 font-semibold">Paid</th>
                      <th className="px-4 py-4 font-semibold">Received</th>
                      <th className="px-6 py-4 text-right font-semibold sm:px-8">
                        Needs a look
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {pilotValue.map((item) => (
                      <tr
                        key={item.category}
                        className="border-b border-[#e5ded2] last:border-0"
                      >
                        <td className="px-6 py-4 sm:px-8">
                          <p className="text-sm font-medium text-[#243a48]">
                            {item.category}
                          </p>
                          <p className="mt-1 text-xs text-[#74808a]">
                            {item.action}
                          </p>
                        </td>
                        <td className="px-4 py-4 text-sm text-[#596a73]">
                          {item.paid}
                        </td>
                        <td className="px-4 py-4 text-sm text-[#596a73]">
                          {item.received}
                        </td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-[#886630] sm:px-8">
                          {item.exception}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#f0eadf] text-[#173246]">
                    <tr>
                      <td className="px-6 py-4 text-sm font-semibold sm:px-8">
                        Total
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold">
                        £1,420
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold">
                        £1,890 protected / put to use
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-[#7d5b27] sm:px-8">
                        £1.33 per £1 paid
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="introduction" className="bg-[#f5f1e9] py-24 sm:py-32">
        <div className="mx-auto grid max-w-[1340px] gap-14 px-6 sm:px-10 lg:grid-cols-[0.9fr_1.1fr] lg:px-14">
          <div>
            <p className="eyebrow">A private introduction</p>
            <h2 className="mt-5 max-w-md font-serif text-4xl leading-[1.03] tracking-[-0.04em] sm:text-5xl">
              Begin with the house you already have.
            </h2>
            <p className="mt-6 max-w-md text-[17px] leading-7 text-[#52626c]">
              Tell us a little about the property. We will arrange a discreet
              conversation about the systems, risks and opportunities that
              matter most.
            </p>
          </div>
          <form
            className="rounded-2xl bg-white p-7 shadow-[0_24px_80px_rgba(31,43,52,0.08)] sm:p-10"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(true);
            }}
          >
            {submitted ? (
              <div className="flex min-h-56 flex-col justify-center">
                <LockKeyhole
                  className="size-7 text-[#8f7040]"
                  strokeWidth={1.5}
                />
                <h3 className="mt-6 text-2xl font-medium tracking-[-0.03em]">
                  Thank you.
                </h3>
                <p className="mt-3 max-w-sm text-[15px] leading-6 text-[#596871]">
                  Your request is ready for the Oriel team. We will be in touch
                  to arrange a private introduction.
                </p>
                <button
                  className="mt-7 w-fit text-sm font-semibold text-[#815f2c] underline decoration-[#c3a574] underline-offset-4"
                  type="button"
                  onClick={() => setSubmitted(false)}
                >
                  Send another request
                </button>
              </div>
            ) : (
              <>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="form-label">
                    Name
                    <Input
                      required
                      className="form-input"
                      placeholder="Your name"
                    />
                  </label>
                  <label className="form-label">
                    Email
                    <Input
                      required
                      className="form-input"
                      placeholder="you@example.com"
                      type="email"
                    />
                  </label>
                </div>
                <label className="form-label mt-5 block">
                  Property or area
                  <Input
                    className="form-input"
                    placeholder="For example: Hampstead, SW10, Surrey"
                  />
                </label>
                <label className="form-label mt-5 block">
                  What would you like to improve?
                  <textarea
                    className="form-input min-h-28 resize-y py-3"
                    placeholder="Electricity, water, supporting care, maintenance, existing systems…"
                  />
                </label>
                <Button
                  className="mt-7 h-12 w-full rounded-full bg-[#173850] text-[15px] hover:bg-[#0d283b]"
                  type="submit"
                >
                  Request a private introduction{' '}
                  <ArrowUpRight className="size-4" />
                </Button>
                <p className="mt-4 text-center text-xs leading-5 text-[#78848a]">
                  No sales pressure. Your details are used only to arrange this
                  conversation.
                </p>
              </>
            )}
          </form>
        </div>
      </section>

      <footer className="bg-[#0b1d2b] py-8 text-sm text-white/60">
        <div className="mx-auto flex max-w-[1340px] flex-col gap-4 px-6 sm:flex-row sm:items-center sm:justify-between sm:px-10 lg:px-14">
          <div className="flex items-center gap-3 text-white">
            <span className="flex size-7 items-center justify-center rounded-full border border-white/30 font-serif italic">
              O
            </span>
            <span className="font-semibold tracking-[0.2em]">ORIEL</span>
          </div>
          <p>Private home operations for complex London estates.</p>
          <AppLink
            href="/app"
            className="text-[11px] tracking-[0.08em] text-white/35 transition hover:text-white/60"
          >
            Product demo
          </AppLink>
        </div>
      </footer>
    </main>
  );
}

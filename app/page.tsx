'use client';

import {
  ArrowDownRight,
  ArrowUpRight,
  Bolt,
  Droplets,
  LockKeyhole,
  MoveRight,
  ShieldCheck,
  ThermometerSun,
  Wrench,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const systems = [
  {
    icon: Bolt,
    title: 'Energy & climate',
    text: 'See where energy goes. Let the home respond intelligently to occupancy, weather and agreed limits.',
  },
  {
    icon: Droplets,
    title: 'Water & wellbeing',
    text: 'Catch leaks, freeze risk and humidity issues before they become expensive repairs.',
  },
  {
    icon: ShieldCheck,
    title: 'Security & perimeter',
    text: 'Bring gates, access, alarms and cameras into one clear, privacy-conscious picture.',
  },
  {
    icon: Wrench,
    title: 'Home health',
    text: 'Know when a boiler, network, pump or critical system needs attention—before the house tells you.',
  },
];

const estateStandards = [
  {
    number: '01',
    title: 'One composed view',
    text: 'The systems and state of your property, at a glance.',
    label: 'Clarity',
  },
  {
    number: '02',
    title: 'Fewer surprises',
    text: 'Patterns reveal what needs attention before cost builds.',
    label: 'Foresight',
  },
  {
    number: '03',
    title: 'Made for complex homes',
    text: 'Calm, considered operations for London’s most demanding properties.',
    label: 'Confidence',
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
          <a className="flex items-center gap-3" href="#top" aria-label="Oriel home">
            <span className="flex size-9 items-center justify-center rounded-full border border-white/35 bg-white/10 font-serif text-lg italic">
              O
            </span>
            <span className="text-sm font-semibold tracking-[0.22em]">ORIEL</span>
          </a>
          <div className="hidden items-center gap-8 text-sm text-white/75 md:flex">
            <a className="transition hover:text-white" href="#systems">
              Your home, unified
            </a>
            <a className="transition hover:text-white" href="#introduction">
              Introductions
            </a>
          </div>
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
              Make every kilowatt, litre of fuel, maintenance visit, and system decision
              visible—then reduce unnecessary costs.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Button
                className="h-12 rounded-full bg-[#eac789] px-6 text-[15px] font-semibold text-[#122434] hover:bg-[#f2d49e]"
                onClick={() =>
                  document.getElementById('introduction')?.scrollIntoView({ behavior: 'smooth' })
                }
              >
                Arrange a private introduction <MoveRight className="size-4" />
              </Button>
              <a
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/25 px-6 text-[15px] font-medium transition hover:border-white/60 hover:bg-white/8"
                href="#systems"
              >
                Explore the systems <ArrowDownRight className="size-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[1340px] px-6 pb-10 sm:px-10 lg:px-14">
          <div className="overflow-hidden border border-white/20 bg-[#0b2131]/70 shadow-[0_24px_60px_rgba(0,0,0,0.18)] backdrop-blur-sm">
            <div className="flex items-center justify-between border-b border-white/15 px-6 py-4 sm:px-8">
              <p className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#eac789]">
                <span className="size-1.5 rounded-full bg-[#eac789] shadow-[0_0_0_4px_rgba(234,199,137,0.12)]" />
                The Oriel standard
              </p>
              <p className="hidden text-xs tracking-[0.08em] text-white/50 sm:block">
                Designed around exceptional homes
              </p>
            </div>
            <div className="grid md:grid-cols-3">
              {estateStandards.map((standard) => (
                <article
                  key={standard.number}
                  className="group relative min-h-56 overflow-hidden border-b border-white/15 px-6 py-7 last:border-b-0 md:border-b-0 md:border-r md:px-8 md:last:border-r-0"
                >
                  <span className="pointer-events-none absolute -right-1 -top-8 font-serif text-[9.5rem] leading-none tracking-[-0.1em] text-white/[0.035] transition duration-500 group-hover:text-[#eac789]/[0.09]">
                    {standard.number}
                  </span>
                  <div className="relative flex h-full flex-col">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold tracking-[0.2em] text-[#eac789]">
                        {standard.number}
                      </span>
                      <span className="h-px w-10 bg-gradient-to-r from-[#eac789] to-transparent" />
                    </div>
                    <h3 className="mt-9 max-w-[15rem] font-serif text-[2rem] leading-[0.98] tracking-[-0.045em] text-white">
                      {standard.title}
                    </h3>
                    <p className="mt-4 max-w-[16rem] text-sm leading-6 text-white/63">{standard.text}</p>
                    <span className="mt-auto pt-7 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d9b779]">
                      {standard.label}
                    </span>
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
              <p className="eyebrow">One home. One accountable picture.</p>
              <h2 className="mt-5 max-w-2xl font-serif text-4xl leading-[1.03] tracking-[-0.04em] sm:text-5xl">
                See the systems that matter before they become a problem.
              </h2>
            </div>
            <p className="max-w-sm text-[15px] leading-6 text-[#54636d]">
              Oriel brings the systems that run a substantial home into one managed service. We
              begin with how the property is actually used, connect what already works, and make
              the critical things visible, reliable and simple to act on.
            </p>
          </div>

          <div className="grid md:grid-cols-2">
            {systems.map(({ icon: Icon, title, text }, index) => (
              <article
                key={title}
                className="group relative border-b border-[#bcb3a4] py-9 md:px-8 md:odd:border-r md:odd:pr-12 md:even:pl-12"
              >
                <span className="absolute right-0 top-9 text-xs font-semibold tracking-[0.16em] text-[#a2895d] md:right-8">
                  0{index + 1}
                </span>
                <Icon className="size-6 text-[#8f7040]" strokeWidth={1.5} />
                <h3 className="mt-8 text-2xl font-medium tracking-[-0.025em]">{title}</h3>
                <p className="mt-3 max-w-md text-[15px] leading-6 text-[#50606a]">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#102a3e] py-24 text-white sm:py-32">
        <div className="mx-auto grid max-w-[1340px] gap-14 px-6 sm:px-10 lg:grid-cols-[0.8fr_1.2fr] lg:px-14">
          <div>
            <p className="eyebrow text-[#eac789]">The Oriel rhythm</p>
            <h2 className="mt-5 max-w-sm font-serif text-4xl leading-[1.03] tracking-[-0.04em] sm:text-5xl">
              Designed once. Watched with care.
            </h2>
          </div>
          <ol className="divide-y divide-white/15">
            {[
              [
                'Understand',
                'We learn the house, the people who use it and the systems already in place.',
              ],
              [
                'Connect',
                'We make the critical layers work together without disrupting how the home feels.',
              ],
              [
                'Watch',
                'The home is quietly monitored for unusual patterns, risks and maintenance needs.',
              ],
              [
                'Explain',
                'You receive a clear picture of what happened, what changed and what merits attention.',
              ],
            ].map(([title, text], index) => (
              <li
                key={title}
                className="grid grid-cols-[44px_1fr] gap-5 py-6 sm:grid-cols-[90px_1fr]"
              >
                <span className="pt-1 text-xs font-semibold tracking-[0.16em] text-[#eac789]">
                  0{index + 1}
                </span>
                <div>
                  <h3 className="text-xl font-medium">{title}</h3>
                  <p className="mt-2 max-w-xl text-[15px] leading-6 text-white/65">{text}</p>
                </div>
              </li>
            ))}
          </ol>
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
              Tell us a little about the property. We will arrange a discreet conversation about
              the systems, risks and opportunities that matter most.
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
                <LockKeyhole className="size-7 text-[#8f7040]" strokeWidth={1.5} />
                <h3 className="mt-6 text-2xl font-medium tracking-[-0.03em]">Thank you.</h3>
                <p className="mt-3 max-w-sm text-[15px] leading-6 text-[#596871]">
                  Your request is ready for the Oriel team. We will be in touch to arrange a
                  private introduction.
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
                    <Input required className="form-input" placeholder="Your name" />
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
                  <Input className="form-input" placeholder="For example: Hampstead, SW10, Surrey" />
                </label>
                <label className="form-label mt-5 block">
                  What would you like to improve?
                  <textarea
                    className="form-input min-h-28 resize-y py-3"
                    placeholder="Energy, security, water protection, maintenance, existing systems…"
                  />
                </label>
                <Button
                  className="mt-7 h-12 w-full rounded-full bg-[#173850] text-[15px] hover:bg-[#0d283b]"
                  type="submit"
                >
                  Request a private introduction <ArrowUpRight className="size-4" />
                </Button>
                <p className="mt-4 text-center text-xs leading-5 text-[#78848a]">
                  No sales pressure. Your details are used only to arrange this conversation.
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
          <p>Private home operations for London and the surrounding estates.</p>
        </div>
      </footer>
    </main>
  );
}

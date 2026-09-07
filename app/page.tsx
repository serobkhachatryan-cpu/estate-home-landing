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
  },
  {
    number: '02',
    title: 'Fewer surprises',
    text: 'Patterns reveal what needs attention before cost builds.',
  },
  {
    number: '03',
    title: 'Made for complex homes',
    text: 'Calm, considered operations for London’s most demanding properties.',
  },
];

const timothySavings = [
  {
    category: 'Electricity',
    before: '£12,600',
    after: '£9,750',
    saved: '£2,850',
    action: 'Schedules aligned to occupancy',
  },
  {
    category: 'Heating fuel & standby power',
    before: '£9,800',
    after: '£7,400',
    saved: '£2,400',
    action: 'Demand and runtime made visible',
  },
  {
    category: 'Reactive maintenance & call-outs',
    before: '£6,400',
    after: '£3,800',
    saved: '£2,600',
    action: 'Early warnings and planned service',
  },
  {
    category: 'Water loss & avoidable repairs',
    before: '£3,600',
    after: '£1,050',
    saved: '£2,550',
    action: 'Slow leak identified early',
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
                    <p className="mt-3 max-w-[16rem] text-sm leading-5 text-white/63">{standard.text}</p>
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
              <p className="eyebrow">One accountable picture.</p>
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
            <p className="eyebrow text-[#eac789]">The Oriel delivery plan</p>
            <h2 className="mt-5 max-w-sm font-serif text-4xl leading-[1.03] tracking-[-0.04em] sm:text-5xl">
              A disciplined timeline.
            </h2>
          </div>
          <ol className="divide-y divide-white/15">
            {[
              [
                'Assessment',
                '1–2 days',
                'We assess the home, its systems, fuel and energy use, and the opportunities worth addressing.',
              ],
              [
                'Planning & refining',
                '1–2 days',
                'We build and refine a practical plan around your priorities and how you want the home to operate.',
              ],
              [
                'Deployment',
                '2 weeks maximum',
                'We install, connect and test the agreed systems with minimal disruption. You receive the Oriel app to see and control your property from anywhere.',
              ],
              [
                'Ongoing support',
                'Continuous',
                'We continue to monitor, optimise, maintain and support the home as its needs evolve.',
              ],
            ].map(([title, duration, text], index) => (
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
                    <span className="w-fit rounded-full border border-[#eac789]/40 bg-[#eac789]/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#eac789]">
                      {duration}
                    </span>
                  </div>
                  <p className="mt-2 max-w-xl text-[15px] leading-6 text-white/65">{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="pricing" className="bg-[#f5f1e9] py-24 sm:py-32">
        <div className="mx-auto max-w-[1340px] px-6 sm:px-10 lg:px-14">
          <div className="grid gap-10 border-b border-[#c8beb0] pb-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <p className="eyebrow">Indicative pricing</p>
              <h2 className="mt-5 max-w-xl font-serif text-4xl leading-[1.03] tracking-[-0.04em] sm:text-5xl">
                A practical guide to your investment.
              </h2>
            </div>
            <p className="max-w-xl text-[17px] leading-7 text-[#52626c]">
              Most first-stage Oriel projects for a complex London home sit between £25,000 and
              £75,000, followed by £750–£1,500 per month for ongoing operations. The exact figure
              depends on the property, its existing systems and the level of support you need.
            </p>
          </div>

          <div className="grid border-b border-[#c8beb0] md:grid-cols-3">
            {[
              [
                '01',
                '£1,250',
                'Initial assessment',
                'A 1–2 day review of the house, its systems and controllable spending.',
                'Standalone assessment',
              ],
              [
                '02',
                '£25k–£75k',
                'Deployment',
                'The first phase: systems integration, sensors, configuration, testing and owner-app handover.',
                'Typical one-off investment',
              ],
              [
                '03',
                '£750–£1,500',
                'Ongoing operations',
                'Monthly monitoring, optimisation, maintenance coordination and support.',
                'Per month',
              ],
            ].map(([number, price, title, description, terms], index) => (
              <article
                key={title}
                className={`flex min-h-72 flex-col border-b border-[#c8beb0] py-8 last:border-b-0 md:border-b-0 md:px-8 md:first:pl-0 md:last:pr-0 ${index < 2 ? 'md:border-r' : ''}`}
              >
                <span className="text-[11px] font-semibold tracking-[0.2em] text-[#8f7040]">{number}</span>
                <p className="mt-8 font-serif text-4xl leading-none tracking-[-0.05em] text-[#173246]">{price}</p>
                <h3 className="mt-4 text-2xl font-medium tracking-[-0.03em] text-[#173246]">{title}</h3>
                <p className="mt-4 max-w-xs text-[15px] leading-6 text-[#596a73]">{description}</p>
                <p className="mt-auto pt-8 text-sm font-semibold text-[#765a30]">{terms}</p>
              </article>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <p className="max-w-2xl text-[15px] leading-6 text-[#596a73]">
              These are guide prices for a complex London property. Major building works, specialist
              equipment or a listed-property retrofit may move the range; your proposal sets out the
              exact scope and final figure before work begins.
            </p>
            <Button
              className="h-12 shrink-0 rounded-full bg-[#173850] px-6 text-[15px] hover:bg-[#0d283b]"
              onClick={() =>
                document.getElementById('introduction')?.scrollIntoView({ behavior: 'smooth' })
              }
            >
              Request a private proposal <ArrowUpRight className="size-4" />
            </Button>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#e7dfd0] py-24 sm:py-32">
        <div className="pointer-events-none absolute right-[-12rem] top-[-14rem] size-[34rem] rounded-full border border-[#c3ad85]/30" />
        <div className="pointer-events-none absolute right-[-3rem] top-[-5rem] size-[22rem] rounded-full border border-[#c3ad85]/25" />
        <div className="relative mx-auto max-w-[1340px] px-6 sm:px-10 lg:px-14">
          <div className="grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
            <div>
              <p className="eyebrow">Illustrative use case</p>
              <h2 className="mt-5 max-w-xl font-serif text-4xl leading-[1.03] tracking-[-0.04em] sm:text-5xl">
                £10,400 less in annual controllable spend.
              </h2>
              <p className="mt-6 max-w-lg text-[17px] leading-7 text-[#52626c]">
                In this first-year scenario, Timothy&apos;s substantial London home moves from
                reactive oversight to measured operations—without replacing everything already
                in place.
              </p>
              <div className="mt-9 grid max-w-lg grid-cols-2 border-y border-[#bcb3a4]">
                <div className="py-5 pr-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
                    Before Oriel
                  </p>
                  <p className="mt-2 font-serif text-3xl tracking-[-0.04em] text-[#1b3040]">£32,400</p>
                  <p className="mt-1 text-xs text-[#61717a]">Annual controllable spend</p>
                </div>
                <div className="border-l border-[#bcb3a4] py-5 pl-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8f7040]">
                    After Oriel
                  </p>
                  <p className="mt-2 font-serif text-3xl tracking-[-0.04em] text-[#1b3040]">£22,000</p>
                  <p className="mt-1 text-xs text-[#61717a]">First 12 months</p>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[#c2b7a5] bg-[#f9f6ef] shadow-[0_28px_80px_rgba(35,46,52,0.10)]">
              <div className="flex flex-col justify-between gap-5 border-b border-[#d5ccbe] bg-[#f0eadf] px-6 py-6 sm:flex-row sm:items-end sm:px-8">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8f7040]">
                    Annual operating costs
                  </p>
                  <h3 className="mt-2 font-serif text-3xl tracking-[-0.04em] text-[#153044]">
                    Before / after Oriel
                  </h3>
                </div>
                <div className="border-l-2 border-[#a98043] pl-4">
                  <p className="font-serif text-3xl leading-none tracking-[-0.04em] text-[#153044]">32%</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7d683e]">
                    lower spend
                  </p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left">
                  <thead className="text-[10px] font-semibold uppercase tracking-[0.13em] text-[#7b817d]">
                    <tr className="border-b border-[#ded6c9]">
                      <th className="px-6 py-4 font-semibold sm:px-8">Area</th>
                      <th className="px-4 py-4 font-semibold">Before</th>
                      <th className="px-4 py-4 font-semibold">After</th>
                      <th className="px-6 py-4 text-right font-semibold sm:px-8">Saved</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timothySavings.map((item) => (
                      <tr key={item.category} className="border-b border-[#e5ded2] last:border-0">
                        <td className="px-6 py-4 sm:px-8">
                          <p className="text-sm font-medium text-[#243a48]">{item.category}</p>
                          <p className="mt-1 text-xs text-[#74808a]">{item.action}</p>
                        </td>
                        <td className="px-4 py-4 text-sm text-[#596a73]">{item.before}</td>
                        <td className="px-4 py-4 text-sm text-[#596a73]">{item.after}</td>
                        <td className="px-6 py-4 text-right text-sm font-semibold text-[#886630] sm:px-8">
                          {item.saved}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#f0eadf] text-[#173246]">
                    <tr>
                      <td className="px-6 py-4 text-sm font-semibold sm:px-8">Total</td>
                      <td className="px-4 py-4 text-sm font-semibold">£32,400</td>
                      <td className="px-4 py-4 text-sm font-semibold">£22,000</td>
                      <td className="px-6 py-4 text-right text-sm font-bold text-[#7d5b27] sm:px-8">£10,400</td>
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
          <p>Private home operations for complex London estates.</p>
        </div>
      </footer>
    </main>
  );
}

# Oriel — London-first business plan

**Version:** 1.1 · 14 October 2026  
**Planning horizon:** 12 months from an approved Aldworth pilot  
**Purpose:** a decision document for founder, investor, employer and launch partners. It is not an investment solicitation, legal opinion, tax forecast or immigration advice.

## 1. Executive decision

Oriel should launch as a **private-estate operations and intelligence layer**, not as a generic smart-home application, an App Store product, a home-security monitoring service or a replacement for Home Assistant, Crestron, Control4, Lutron, KNX or a property-management company.

The first commercial unit is a paid, owner-controlled pilot at a technically complex London or Home Counties home:

```text
Existing building systems and meters
          ↓
Home Assistant (local integration and data substrate)
          ↓
Oriel read-only operations layer
          ↓
Owner · house/estate manager · approved integrator
```

The product promises a calm, traceable answer to four questions:

1. What is happening now in the approved estate systems?
2. What has been recorded over the relevant UK weeks?
3. Which physical source or area produced that number?
4. What needs a human decision, and what remains deliberately outside Oriel’s authority?

The 12-month target is **not mass adoption**. It is evidence that Oriel can safely install, operate and support 3–5 paid design partners, then 10 paid estates through trusted London channels.

## 2. Customer problem

High-value residences commonly combine power, water, fuel, HVAC, security, lighting, networking, AV and specialist plant installed by different contractors over years. The owner or family office does not lack devices; they lack an operational record that is comprehensible, trustworthy and portable between people.

Today the useful evidence is split between controls, invoices, contractor knowledge, manuals, messaging and a house manager’s memory. That creates five failures:

- no one can quickly explain the source and confidence level of a reported number;
- expensive systems have poor handover, provenance and maintenance context;
- an owner receives raw charts or an incomplete human summary rather than a decision-ready view;
- a change of contractor or staff member creates operational risk;
- a technically complex home feels like a collection of private systems, not a managed asset.

Oriel does not sell “more data.” It sells a structured operational record and a disciplined presentation of the data that already exists.

## 3. Product and deliberately narrow MVP

| Component | Customer value | MVP status |
|---|---|---|
| **Oriel Home Assistant card** | Read-only live snapshot, UK weekly history, approved sources, cost evidence where a valid source exists, and safe source/area breakdown | Working local MVP; target pilot delivery |
| **Oriel Home Assistant panel** | Optional wider sidebar view for an administrator/owner | Working prototype; not required for first paid deployment |
| **Oriel Estate Passport** | Asset, meter, warranty, manual and service provenance | Product specification / Phase 2 |
| **Oriel Operations** | Planned maintenance, contractor evidence, approvals and owner report | Product specification / Phase 2 |
| **Oriel public product site** | Explains the offer without exposing estate data | Static release bundle ready for an approved UniWheel deployment |

The MVP must remain local-first and read-only. It does not operate gates, locks, alarms, cameras, HVAC, pumps, power or automation; it does not contain a public login, raw telemetry cloud or investor access to Home Assistant.

## 4. Customer and buying model

### Initial ideal customer profile

An owner, family office, private office, house/estate manager or specialist integrator responsible for a complex London residence with multiple systems, meaningful utility/maintenance spend and a genuine need for accountable operating evidence.

Best early situations:

- a recently refurbished or technically fragmented prime London home;
- an owner who travels frequently or uses a family office/private office;
- a residential asset with a house/estate manager and several specialist contractors;
- an integrator supporting a legacy Control4/KNX/Lutron/Home Assistant estate;
- a boutique developer handing over a small number of premium homes.

Reject a pilot in v1 if there is no cooperative HA administrator, no approved entity mapping, no usable Recorder history or an expectation that Oriel will dispatch engineers/respond to alarms.

### Who pays, uses and influences

| Persona | Role in sale | What matters |
|---|---|---|
| Owner / principal | Economic buyer | Trust, privacy, calm reporting, ownership of access and data |
| Family office / PA | Influencer or buyer | Spend evidence, decisions, contractor accountability and continuity |
| House / estate manager | Daily user | Less chasing, clear status, service history and usable handover |
| Smart-home integrator | Channel partner | Recurring support revenue, fewer blind call-outs and retained client relationship |
| Private-office / luxury property manager | Partner or later competitor | A technical evidence layer that improves its human service |

## 5. Market evidence and competitive position

London is large enough but not a mass-market proposition. The 2024 English Housing Survey market-value work estimates **71,000 London dwellings valued at £2m or more**—a gross universe, not a customer forecast. A small fraction is technically complex, owner-managed and willing to pay for operations software. [GOV.UK Market Value Survey 2024](https://www.gov.uk/government/publications/market-value-survey-2024/market-value-survey-2024-main-report)

The channel is real: CEDIA’s UK research estimated a **£2.9bn** professional smart-home market and approximately **3,700 integrators**, with integrators holding meaningful buying influence. That supports a relationship-led B2B2C approach rather than consumer advertising. [CEDIA UK market research](https://cedia.org/smart-home-professionals/news/cedias-reinvigorated-research-approach-uncovers-uk-professional-smart-home-industry-nears-2.9-billion/)

Useful tailwinds are real but must not be overclaimed:

- Ofgem reported more than 40 million smart meters in Great Britain by September 2025; it is favourable infrastructure, not proof that any particular property has usable data. [Ofgem State of the Market](https://www.ofgem.gov.uk/sites/default/files/2026-01/State-of-the-Market-Energy-Retail-Highlights-January-2026.pdf)
- London’s **Be Seen** requirement concerns monitoring/reporting operational energy for new major developments. It is a potential later segment, not an Oriel compliance claim. [GLA Be Seen guidance](https://www.london.gov.uk/what-we-do/planning/implementing-london-plan/london-plan-guidance-and-spgs/be-seen-energy-monitoring-guidance)
- Planned private-rented-sector energy changes should not be marketed as a present compliance guarantee. [GOV.UK PRS energy-performance response](https://www.gov.uk/government/consultations/improving-the-energy-performance-of-privately-rented-homes-2025-update/outcome/improving-the-energy-performance-of-privately-rented-homes-government-response-html)

### Competitive map

| Competitive budget | Examples in/serving London | Oriel’s response |
|---|---|---|
| Luxury property/house management | Bold & Reeves, Caroline Baker Private Office | Partner with the human service; add source provenance and technical estate intelligence rather than claim replacement |
| Building / smart-home controls | Home Assistant, Control4, Crestron, Lutron, KNX, Loxone | Sit above as read-only operations/evidence layer; never rip-and-replace in v1 |
| Managed Home Assistant | habbb, Luxeia and integrator support contracts | Differentiate with estate operating model, documented source mapping and owner-ready reporting |
| Property-management software | askporter, Fixflo, Arthur Online, PropLink | Do not compete for rent, tenancy, client money or broad compliance in v1 |
| Energy/bill dashboards | Utility providers and meter apps | Make energy a proven feature, not the whole product |

The full London-only research and named competitor analysis are maintained in [Oriel London competitive research](https://github.com/serobkhachatryan-cpu/estate-home-landing/blob/main/docs/oriel-london-competitive-research-2026.md).

## 6. Oriel’s defensible advantages

These are advantages to prove, not marketing claims to assume.

1. **A real pilot with real operational questions.** Aldworth gives Oriel a data-quality and workflow problem that generic dashboard startups do not have.
2. **Local-first trust posture.** The card runs in an authenticated Home Assistant session, reads exact approved sources and has no external runtime dependency, token or device-control path.
3. **Provenance-first UX.** Oriel can show source, period, coverage, meter relationship and limitation rather than pretending all sensor names are reliable facts.
4. **UK weekly and cost discipline.** Monday–Sunday `Europe/London` periods, DST-safe handling, incomplete-week labels and an explicit distinction between tariff estimate and invoice actual are meaningful in owner reporting.
5. **Partner-aligned position.** Integrators and private offices keep their client relationship; Oriel gives them a better recurring operating layer rather than disintermediating them.
6. **Premium but calm product language.** Oriel should be legible for a principal or family office, without exposing the raw technical noise that makes ordinary Home Assistant dashboards hard to trust.

## 7. Commercial offer and pricing hypotheses

Prices below are hypotheses for discovery conversations, not published commitments. Hardware, specialist electrical/plumbing work and third-party services pass through separately with transparent approval.

| Offer | Buyer outcome | Indicative pricing hypothesis |
|---|---|---:|
| **Oriel Estate Audit** | System/source inventory, data-quality assessment, scope and pilot plan | £3,000–£7,500 fixed fee |
| **Oriel Pilot** | Approved source map, card/panel configuration, administrator handoff, acceptance test | £3,000–£7,500 fixed implementation fee |
| **Oriel Care** | Versioned updates, quarterly source review, monthly operational report and bounded support | £300–£900 per estate per month |
| **Oriel Handover Passport** | Asset/meter/manual/service evidence for a refurbished home or developer handover | £2,500–£10,000, scoped per property |

Commercial rules:

- Sell audit before integration where source quality/topology is unknown.
- Price human implementation and support separately from software.
- Do not take responsibility for 24/7 emergency response, device uptime, physical sensor correctness, insurance, security monitoring or savings claims.
- The estate owner controls Home Assistant and data access; support access is named, scoped, time-bound and revocable.

## 8. Go-to-market plan

### First 90 days: proof, not promotion

1. Close Aldworth scope, source map, data-quality rules and administrator handoff.
2. Deliver one accepted local-first pilot with measurable weekly use.
3. Build two short sales artefacts: a privacy-safe product page and a one-page pilot outcome brief.
4. Conduct 10–15 structured discovery meetings: integrators, private-office/estate-management operators and delivery/architect/developer contacts.

### Months 4–12: partner-led design partners

- Convert three to five paid design partners through trusted integrators/private offices.
- Use a standard paid audit as the entry point; do not give away bespoke discovery indefinitely.
- Establish a referral/white-label commercial model only after a partner has seen a successful installation.
- Publish only anonymised/approved outcomes. Never use Aldworth telemetry, property layout, screenshots, names or security context as sales material without written approval.

### Sales funnel assumptions to test

| Stage | Evidence required before scaling |
|---|---|
| Discovery | Buyer has complex systems, named operator and a real visibility/hand-over pain |
| Paid audit | Customer accepts source-quality/topology work before dashboard promises |
| Pilot | Administrator can install and support it; owner understands it; no unsafe data path appears |
| Care plan | Customer receives recurring value without needing bespoke engineering each month |
| Partner replication | An integrator can sell and commission with a bounded checklist |

## 9. Operating model and architecture

### MVP deployment model

```text
Home Assistant instance owned by the estate
  ├─ Oriel Lovelace card (default MVP)
  └─ optional Oriel panel
      └─ reads signed-in HA states + explicitly allowed Recorder history

Public product site (separate static deployment)
  └─ explains Oriel; contains no estate data or credentials
```

This avoids creating a new production cloud before the product has evidence. A later hosted product must be a separate project: role model, MFA, audit log, data-protection design, secrets management, retention/deletion, incident response, UK/EU hosting decision and technical support model.

### Minimum team for the first year

| Responsibility | Owner initially | When to add capacity |
|---|---|---|
| Product / lead engineering / pilot delivery | Oriel Project Lead | Immediately |
| HA/electrical/network installation | Approved integrator / HA administrator | Per estate, contracted |
| UI/brand / content | Freelance/partner | When paid pilot is signed |
| Legal, privacy, employment/immigration | Specialist advisers | Before contract, sponsorship or external data platform |
| Customer success / operations | Founder + project lead | Once 5–10 care estates are active |

## 10. Illustrative 12-month cash model

This is transparent planning arithmetic, not a revenue forecast.

### Base-case revenue assumptions

| Revenue line | Assumption | Illustrative Year-1 recognised revenue |
|---|---:|---:|
| Estate audits | 5 × £5,000 | £25,000 |
| Oriel Care | average 3 estates for six months × £700/month | £12,600 |
| **Total** |  | **£37,600** |

At ten sites the illustrative bottom-up outcome is approximately £95,000: £5,000 onboarding per estate plus £750/month across roughly six months on average. Neither scenario is a forecast.

### Base-case operating costs

| Cost line | Illustrative Year-1 cost | Assumption |
|---|---:|---|
| Project Lead salary | £55,000 | Proposed annual salary |
| Employer on-costs, equipment and benefits | £8,000–£12,000 | Must be checked by employer/accountant |
| Specialist contractors / design / QA | £20,000–£35,000 | Variable, paid only when scope is agreed |
| Legal, privacy, accounting, insurance | £8,000–£15,000 | Required before external commercial scale |
| Travel, tools, hosting and contingency | £8,000–£15,000 | Local-first MVP keeps this lower initially |
| **Indicative runway requirement** | **£135,000–£200,000 for 12–18 months** | Illustrative range after the £55,000 salary proposal; before VAT/corporation-tax treatment and capital structure |

The first year is likely a **proof-and-reference year**, not a profitable SaaS year. Early pilot revenue cannot safely carry the whole employment, security, legal, delivery and support load by itself.

## 11. Milestones and investment gates

| Gate | Evidence required | Decision |
|---|---|---|
| Gate 0 — legal and ownership | Named UK entity/owner, IP terms, access model, no shared credentials | Begin pilot only |
| Gate 1 — technical acceptance | Admin-installed card, verified data, no external calls/control, rollback proven | Permit 30-day pilot |
| Gate 2 — user value | Owner/manager uses it weekly; source map and report resolve a real operational question | Sell paid design partners |
| Gate 3 — repeatability | Three paid pilots delivered with a bounded checklist and support effort | Fund partner-led expansion |
| Gate 4 — hosted platform | Clear need that cannot be met locally; signed privacy/security/architecture plan | Fund cloud/mobile build separately |

## 12. Principal risks and mitigations

| Risk | Why it matters | Mitigation |
|---|---|---|
| Bad or ambiguous source data | Wrong totals destroy trust | Paid audit, source dictionary, fail-closed display, no automatic aggregation |
| Security/privacy breach | Residential system data is highly sensitive | Local-first read-only MVP, named accounts, no secrets/client-side tokens, strict allowlists |
| Service business disguised as SaaS | Bespoke integration can eliminate margin | Price audit/implementation separately, standardise source map and acceptance checklist |
| Partner disintermediation fear | Integrators may refuse participation | Position Oriel as their operating/retention layer, offer referral/white-label terms later |
| Overclaiming value | Savings, insurance or compliance claims create exposure | Make only sourced claims; distinguish estimate, invoice, plan and fact |
| Premature cloud/mobile build | Creates cost and security surface before product-market evidence | Keep card and static site separate; fund hosted platform only after Gate 3 |
| Visa/employment dependency | Delay or error can halt hiring | Take independent UK immigration/employment advice; maintain a lawful interim arrangement only if appropriate |

For a future managed/cloud service, UK GDPR privacy-by-design and IoT security analysis must precede production data flow. [ICO privacy by design/default](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/guide-to-accountability-and-governance/data-protection-by-design-and-by-default/) · [ICO consumer IoT guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/online-tracking/guidance-for-consumer-internet-of-things-products-and-services/)

## 13. Immediate actions

1. Approve the Aldworth pilot boundary and appoint the accountable owner/HA administrator.
2. Agree the Project Lead role, employment/consultancy terms, IP and decision rights.
3. Cut a clean, versioned Oriel card release and complete target-HA acceptance.
4. Run ten discovery conversations using the paid-audit proposition.
5. Decide whether to fund the £135k–£200k proof runway or constrain the work to an unfunded technical demonstrator.

## Source notes

- [Oriel London competitive research](https://github.com/serobkhachatryan-cpu/estate-home-landing/blob/main/docs/oriel-london-competitive-research-2026.md) contains the full UK/London competitive map, additional citations and methodology.
- [GOV.UK — Market Value Survey 2024](https://www.gov.uk/government/publications/market-value-survey-2024/market-value-survey-2024-main-report)
- [CEDIA — UK professional smart-home market research](https://cedia.org/smart-home-professionals/news/cedias-reinvigorated-research-approach-uncovers-uk-professional-smart-home-industry-nears-2.9-billion/)
- [Home Assistant — custom cards](https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/)
- [Home Assistant — Recorder statistics](https://www.home-assistant.io/actions/recorder.get_statistics/)
- [GOV.UK — Skilled Worker visa](https://www.gov.uk/skilled-worker-visa)

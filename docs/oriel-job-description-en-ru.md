# Oriel Project Lead & Lead Product Engineer

## Job Description / Должностное описание

**Version:** draft 1.1 · 14 October 2026  
**Status:** commercial working draft; it is not an employment contract, immigration advice, security policy or a promise of visa eligibility.

---

## English version

### 1. Role at a glance

| Item | Proposed term |
|---|---|
| Title | **Oriel Project Lead & Lead Product Engineer** |
| Employer | `[UK employing entity to be confirmed]` |
| Reporting line | Founder / Sponsor or a nominated investor representative |
| Location | London-first; hybrid/remote by written agreement, with agreed site visits |
| Engagement | Full-time employment preferred for the pilot; an interim consultancy arrangement may be agreed separately |
| Proposed salary | **£55,000 gross per annum**, subject to the final employment agreement, market review and the employer’s legal/immigration advice |
| Product focus | A secure, owner-controlled operating layer for complex private homes, initially built on Home Assistant at Aldworth |

### 2. Purpose of the role

The Oriel Project Lead & Lead Product Engineer turns Oriel from a one-property prototype into a demonstrably safe, repeatable and commercially credible London smart-estate product.

The role combines product leadership, hands-on software development, Home Assistant integration design and pilot delivery. Its success is not a visually attractive dashboard alone. It is a trusted operational view in which each displayed reading has a known source, period, unit, access rule and limitation.

### 3. Core responsibilities

#### Product leadership and commercial readiness

- Own the product roadmap, prioritised backlog, Definition of Done and pilot success measures.
- Convert owner, house-manager, estate-manager, integrator and investor requirements into bounded use cases.
- Keep the first offering narrow: a **read-only operational and evidence layer**, not a replacement for Home Assistant, a security-monitoring business, an accounting system or a remote-control product.
- Maintain the London launch proposition, pricing hypotheses, partner materials and 12-month commercial plan.
- Complete or maintain the mutually agreed **W3DS certification** objective. Any W3DS identity or data integration is a separate approved workstream and is not implied by this role alone.

#### Architecture and engineering

- Lead the Oriel technical architecture: Home Assistant custom card, optional custom panel, source mapping, Recorder history, test harnesses, documentation and public product site.
- Develop and maintain production-quality JavaScript/TypeScript, UI, configuration examples, automated tests, release notes and installation/rollback materials.
- Implement a United Kingdom calendar model: **Monday–Sunday / ISO-8601 weeks in `Europe/London`**, with real period dates and explicit coverage for incomplete data.
- Design an explicit source model: exact allowlists, primary meters, independent meters, feeder/total relationships, units, cost-source provenance and data-quality caveats.
- Preserve the distinction between **Live now**, **recorded history**, **tariff estimate**, **invoice actual**, **plan** and **forecast**. A missing or uncertain source must be withheld or labelled, never invented as zero or fact.

#### Aldworth pilot delivery

- Maintain a signed source inventory for every pilot metric: Home Assistant entity ID, physical meaning, unit, location label, source owner, coverage, aggregation rule and known limitation.
- Deliver a versioned Oriel Lovelace card and, when approved, an optional sidebar panel.
- Configure only confirmed electricity, water, fuel and power sources. Add source/room breakdown only where topology and Recorder coverage are verified.
- Provide the Home Assistant administrator with a clear install, update, rollback and acceptance process.
- Maintain a local historical playback environment that never publishes raw Recorder data, backups, access tokens or estate topology.

#### Quality, security and operations

- Own regression testing, release checklists, issue/risk register and change log.
- Use named accounts and least privilege. Never place secrets, tokens, raw history, backups, user data or private URLs in public GitHub, browser storage, client-side code or investor links.
- Ensure the pilot has no device control, automation change, external telemetry export or camera/access/occupancy exposure unless a later written scope explicitly approves it.
- Report material data-integrity, security or operational risks immediately.

### 4. Required deliverables

1. **Product and pilot foundation:** product brief, user/use-case map, 90-day roadmap, Aldworth pilot boundary, architecture/data-flow diagram, source inventory and metric dictionary.
2. **Working software:** versioned Home Assistant card; optional panel; static public product page; source-level provenance and safe data-quality states.
3. **Operational readiness:** administrator guide, safe configuration template, test harness, release checklist, rollback instructions, handover and training session.
4. **Pilot close-out:** acceptance report, evidence of what worked/failed, known security/data gaps, Phase 2 recommendation and London commercial plan.

### 5. Proposed KPI framework

Targets are set against an approved pilot baseline. They must never incentivise fabricated values or unsafe scope expansion.

| Area | Proposed measure |
|---|---|
| Delivery | At least 90% of agreed milestones delivered on time, or variance raised before the deadline |
| Data integrity | 100% of displayed pilot metrics have source, unit, period and coverage provenance; zero knowingly fabricated facts |
| Access governance | 100% of investor/guest-facing sources are explicit allowlists; no raw catalogue exposure outside administrator scope |
| Historical correctness | UK Monday–Sunday boundaries, validated total/feeder relationships and incomplete periods visibly marked or withheld |
| Security | No known unresolved critical/high finding at release; no credentials committed or published |
| Quality | Automated tests and manual acceptance checks pass for each release; no unresolved release-blocking defect at demo |
| Adoption | An authorised HA administrator can install, update and roll back without developer-only knowledge; a sponsor can interpret the result without engineering support |

### 6. First 90 days

| Period | Outcome |
|---|---|
| Days 1–30 | Confirm stakeholders, access model, pilot boundary and decision cadence; audit sources and history; establish source inventory, local test environment, baseline tests and risk register. |
| Days 31–60 | Deliver the bounded card/panel MVP; configure approved sources; provide administrator handoff; run functional, visual, historical, permissions and recovery tests. |
| Days 61–90 | Operate controlled pilot; resolve priority defects; publish acceptance evidence; train administrator/sponsor; present Phase 2 commercial and technical decision pack. |

### 7. Decision authority and limits

The role may make ordinary product and technical decisions within the approved roadmap, budget, architecture principles and security policy. It may not independently:

- enable control of locks, gates, alarms, cameras, HVAC, power, generators, pumps or any safety-critical system;
- share Home Assistant URLs, credentials, tokens, raw Recorder archives or investor links;
- change production users, Home Assistant configuration, integrations, network exposure or device automations without administrator approval and a rollback plan;
- claim financial savings, invoices, compliance, insurance outcomes or operational guarantees without an approved methodology and source;
- approve material budget, contract, employment, legal or customer-scope changes.

### 8. Skills and working practices

- Strong product discovery, product-management and stakeholder communication skills.
- Hands-on web engineering (JavaScript/TypeScript, responsive UI, testing and release discipline).
- Practical understanding of Home Assistant, telemetry/Recorder data, security boundaries and data provenance.
- Ability to work calmly with high-trust residential environments, incomplete data and specialist contractors.
- Written English suitable for technical, commercial and administrator documentation; Russian communication is beneficial for the current project team.

### 9. Terms requiring employer and legal review

The employment/consultancy agreement—not this job description—must settle employment status, employing entity, work location, hours, holiday, pension, expenses, notice, bonus/equity, tax treatment, insurance, IP assignment, pre-existing IP, confidentiality, data protection, liability and governing law.

For a Skilled Worker route, the employer must independently confirm the sponsor licence, eligible occupation code, salary and going-rate rules, Certificate of Sponsorship and right-to-work process in force at the application date. £55,000 is a commercial proposal, **not** a guarantee of sponsorship eligibility. See the [GOV.UK Skilled Worker overview](https://www.gov.uk/skilled-worker-visa), [eligible job/salary guidance](https://www.gov.uk/skilled-worker-visa/your-job) and [sponsor guidance](https://www.gov.uk/government/collections/sponsorship-information-for-employers-and-sponsors).

---

## Русская рабочая версия

### Назначение

**Руководитель проекта и ведущий инженер продукта Oriel** отвечает за превращение Oriel из прототипа для одного объекта в проверяемый, безопасный и повторяемый продукт для сложных частных домов в Лондоне. Это роль на стыке product leadership, разработки, Home Assistant-интеграции и ведения пилота Aldworth.

### Что должно быть получено

- Понятный и ограниченный продукт: Oriel показывает достоверные текущие и недельные данные, а не обещает управлять домом или заменять охрану/управляющего.
- Нативная Home Assistant карточка, при необходимости panel, с подтверждёнными источниками Electricity, Water, Fuel и Power.
- Историческая UK-разбивка по неделям Mon–Sun, маркировка неполных периодов и честное различение live/history/cost estimate.
- Контролируемая разбивка по помещениям/фидерам только там, где подтверждены физическая схема и данные Recorder.
- Полный handoff для администратора: версия, инструкция, YAML-template, тест, откат и критерии приёмки.
- Локальная тестовая среда по историческим данным без публикации dump, токенов и секретов.

### Ключевые правила работы

- Каждый показатель имеет entity ID, единицу измерения, период, coverage и владельца источника.
- `Unavailable` или `No record` не заменяются нулём, средним или «красивой» цифрой.
- Нет shared admin password; используются named accounts, scoped access и documented approval.
- В рамках пилота нет команд устройствам, внешней выгрузки raw telemetry, камер, замков, доступа, тревог, сетевой топологии и скрытого auto-discovery сенсоров.
- W3DS certification является согласуемой целью развития. Любая реальная W3DS-интеграция требует отдельного scope, security/data review и договора.

### Модель отчётности

- **Еженедельно:** что доставлено, следующие приоритеты, риски, решения и зависимости.
- **Раз в две недели:** демонстрация, backlog/acceptance review.
- **Ежемесячно:** steering pack — roadmap, бюджет/время, data quality, security и коммерческие рекомендации.
- **Сразу:** сообщение о credential exposure, несанкционированном доступе, data-loss риске или существенном дефекте.

### Предлагаемое коммерческое условие

Предлагаемый ориентир — **£55,000 gross per annum** при full-time employment. Это должно быть юридически и иммиграционно проверено работодателем до подписания: должность и зарплата сами по себе не создают право на Skilled Worker sponsorship.

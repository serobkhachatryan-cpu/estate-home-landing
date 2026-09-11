# Oriel application: first product UI

You are the lead product designer and front-end engineer for Oriel, a private home-operations service for complex London estates. Build the first real product UI from the existing Oriel landing page—not a generic smart-home dashboard.

Work in the existing `estate-home-landing` project. Preserve the public marketing page and its visual language. Create the authenticated product prototype at `/app` (and supporting routes/components as needed). Use the project’s current React + TypeScript + Tailwind + shadcn/lucide/recharts stack. Do not introduce a backend, real authentication, or real device integrations yet. Use clearly structured demo fixtures and stateful prototype interactions only.

## Product promise

Oriel makes the operating cost, health, security and maintenance of a substantial home visible and explainable. The product must feel like a composed private-estate operating console: calm, precise, quietly luxurious and trustworthy. It must never feel like a consumer IoT toy, a trading dashboard or a surveillance wall.

## Brand and design direction

- Carry over the landing page palette: deep navy, warm ivory, restrained antique-gold accents, dark ink text and the same elegant serif/sans pairing.
- Keep generous rhythm, strong typography and real hierarchy. Use subtle borders, paper-like surfaces and soft shadows; no gradients, glassmorphism, neon, excessive rounded cards, emoji or fake “AI” decoration.
- Desktop first, but fully responsive. On mobile, navigation becomes compact and all decision-critical content remains easy to scan.
- Accessibility is non-negotiable: keyboard navigation, visible focus, semantic labels, adequate contrast, responsive layouts, no information represented only by colour.

## Build these first usable screens

### 1. App shell and property context

- Left navigation on desktop, bottom or compact menu on mobile.
- Oriel mark and a property switcher. Use a credible demonstration property: “Carlton Hill Residence, NW8”.
- Sections: Overview, Spending, Systems, Maintenance, Activity, Settings.
- A discreet “Demo property” label. Do not imply live connected devices.
- Top bar: current property, overall health state, notifications, user menu for “Timothy Vale”.

### 2. Overview (`/app`)

- A confident, non-alarming opening: “Good evening, Timothy.” followed by a short operational summary. E.g. property operating normally, with two decisions needing review—not a wall of alerts.
- A “Today at a glance” row: total operating spend trend, energy use, fuel level/rate, water status, and security/perimeter status. Use readable numbers with comparison periods and plain-English explanations.
- “Needs your decision” panel with 2–3 high-quality action cards: approve a planned boiler service, choose an overnight heating threshold, review a gate-access exception. Actions should open a confirmation drawer/modal and update the local UI state; they must be labeled demo actions.
- “Property systems” health overview for Climate, Power, Water, Security and Network with simple condition states and last-updated times.
- A compact 7-day spend view showing electricity, heating fuel and maintenance—not just kilowatt hours.
- A timeline/activity strip showing meaningful events: service completed, leak risk avoided, occupancy schedule adjusted. Do not create false urgency.

### 3. Spending (`/app/spending`)

- Clear monthly operating-cost breakdown for electricity, heating fuel, standby power, water/avoidable loss and maintenance.
- Show actual illustrative comparison data in a polished chart/table: month-to-date, forecast, prior period and driver/explanation. Make savings understandable in pounds first; energy units come second.
- Surface 3 concise opportunities, each with expected annual effect, confidence level and explanation. Avoid claiming guaranteed savings.
- Add time range selectors and category filtering with working front-end state.

### 4. Systems (`/app/systems`)

- A composed overview of Climate, Power & fuel, Water, Security & perimeter, and Network.
- Each system has a current condition, key readings, last verified time, and one plain-English explanation of what Oriel is watching.
- System detail panels should be reachable from cards. At least Climate and Water should have working detail drawers/pages that include recent patterns, thresholds and the next planned maintenance item.
- Display controls as “reviewed automations” or “request a change” rather than immediate dangerous toggle switches. Prototype requests may update UI state and must show an explicit confirmation step.

### 5. Maintenance (`/app/maintenance`)

- A quiet, chronological plan: next scheduled visits, items being monitored, and completed work with cost/context.
- Include one quoted/approval item and an interaction to approve or defer it locally.
- Make it clear who is responsible: Oriel, homeowner, or contractor. Avoid fake contractor names and fake contact details.

### 6. First-run onboarding (`/app/welcome`)

- A minimal, elegant 3-step welcome that asks for property priorities, systems in place and who should receive operational updates.
- It should feel like Oriel learning how the home is used, not registering IoT devices. Persist answers only in local client state for this prototype.

## Information design rules

- Prioritize pounds, fuel use, operating status, maintenance and decision context over charts or raw telemetry.
- Explain every non-obvious metric in plain English, with inline help where necessary.
- Never make critical systems look controllable without a confirmation layer.
- No camera feeds, fake video thumbnails, floor-plan surveillance imagery or generic smart-bulb controls.
- Avoid a feature-stuffed interface. Every screen must answer: What is happening? What is costing money? What needs a decision? What is already handled?

## Engineering requirements

- Componentise thoughtfully: app shell, navigation, property header, metric cards, status badges, decision drawer, charts, system card/detail, maintenance rows.
- Keep mock data in typed fixture files separated from presentation.
- Use reusable primitives; avoid giant page components and duplicated markup.
- Use route-safe links and provide loading/empty states where appropriate.
- Do not break the landing page or its existing copy. Add a discreet non-prominent way for local development to reach `/app` if useful.
- Run the full build and lint/format checks available in the repository. Resolve actual errors; do not report work as done if the build is broken.

## Acceptance bar

When complete, I should be able to open `/app`, navigate all five core areas, make prototype decisions, filter spending, inspect Climate/Water and approve/defer maintenance. It should look deliberate at desktop and mobile widths and unmistakably belong to the Oriel landing page.

At the end, summarise: implemented routes/components, interactions, demo-data assumptions, and any deliberately deferred backend/integration work. Do not ask product questions; make the best reasonable design calls and build the working first pass.

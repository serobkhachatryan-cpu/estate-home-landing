# Oriel — working MVP definition and runbook

**Version:** 1.1 · 14 October 2026  
**Status:** verified local pilot MVP. It is not yet a production SaaS, public telemetry portal, iPhone release or managed monitoring service.

## 1. What counts as the Oriel MVP

The MVP is intentionally one focused product:

> **One Oriel Lovelace card on an owner-controlled Home Assistant dashboard, showing approved live states and properly labelled UK weekly history for a small set of estate utilities.**

The optional sidebar panel and the UniWheel public page are supporting artefacts. They do not replace the card and do not turn Home Assistant data into a public website.

```text
Estate-owned Home Assistant
  └─ editable Lovelace dashboard
      └─ custom:oriel-card
          ├─ current state from signed-in `hass.states`
          └─ weekly history from authorised Home Assistant Recorder

Separate static product page
  └─ public explanation only; no estate data, login, tokens or controls
```

## 2. What the working card does

- Shows **Live now** values only from explicit approved Home Assistant entity IDs.
- Shows historical weekly use using **UK Monday–Sunday weeks in `Europe/London`**, including daylight-saving-safe boundaries.
- Treats a cumulative meter as weekly use only when a valid baseline and later reading exist. Gaps, resets and one-off readings fail closed as `No record`, not a fabricated number.
- Keeps imported closed historical records visibly separate from the partial current week.
- Shows GBP only for an explicit, cumulative, reset-free monetary source and labels it as a **tariff estimate**, not an invoice, cash payment or savings claim.
- Opens only explicit source, tariff-component and room/feeder details. `part_of_total` and `independent` sources have different rules; independent meters are never silently summed.
- Reads no token, calls no Home Assistant service, makes no third-party network request and performs no automatic discovery of a customer’s sensor catalogue.

## 3. What is deliberately not in the MVP

- No device commands or automation changes.
- No cameras, audio, access/lock data, occupancy inference, network topology or alarm response.
- No public/investor link to a Home Assistant instance.
- No claim that all 510+ possible sensors are useful. The card uses an approved allowlist; additional systems need a source decision and configuration.
- No unlimited historical retention. The visible history is limited by Home Assistant Recorder retention and the card configuration.
- No external cloud, W3DS/OAuth flow, mobile App Store app, billing system, accounting ledger or generic property-management suite.

## 4. MVP artefacts in this repository

| Artefact | Purpose | Data status |
|---|---|---|
| [Oriel card source](https://github.com/serobkhachatryan-cpu/estate-home-landing/blob/main/home-assistant/oriel-card/oriel-card.js) | Main Home Assistant custom Lovelace card | Live in target HA after administrator configures approved source IDs |
| [Safe public configuration template](https://github.com/serobkhachatryan-cpu/estate-home-landing/blob/main/home-assistant/oriel-card/examples/aldworth-card.template.yaml) | Starting configuration for the card | No estate entity IDs, history, tariff values or secrets; the approved Aldworth YAML is supplied only to the named administrator through a private channel |
| [Historical-playback page](https://github.com/serobkhachatryan-cpu/estate-home-landing/blob/main/home-assistant/oriel-card/aldworth-history-playground.html) | Local historical Aldworth replay | The page is public code only; it requires a locally generated, ignored private data fixture |
| [Synthetic QA playground](https://github.com/serobkhachatryan-cpu/estate-home-landing/blob/main/home-assistant/oriel-card/test-harness.html) | Synthetic safe QA demonstration | Synthetic fixtures only |
| [Optional admin-panel source](https://github.com/serobkhachatryan-cpu/estate-home-landing/blob/main/home-assistant/oriel-panel/oriel-panel.js) | Optional admin sidebar panel | Separate from card; not MVP-critical |
| [UniWheel static release bundle](https://github.com/serobkhachatryan-cpu/estate-home-landing/tree/main/uniwheel-oriel-release) | Static public product page | No estate connection or data |

## 5. Repeatable local verification

From the project directory:

```sh
git clone https://github.com/serobkhachatryan-cpu/estate-home-landing.git
cd estate-home-landing
npm ci
npm run mvp:check
```

`mvp:check` runs the card tests, panel tests and full web build. It does not need estate data and does not upload anything. The separate private-history command below builds the local fixture only when the approved Aldworth import is present.

### Safe synthetic UI playground

```sh
npm run mvp:synthetic
```

Open:

```text
http://127.0.0.1:4173/home-assistant/oriel-card/test-harness.html
```

This environment contains only synthetic states. It is useful for click/visual/regression checks.

### Private Aldworth historical playback

```sh
npm run mvp:aldworth-history
```

Open:

```text
http://127.0.0.1:4173/home-assistant/oriel-card/aldworth-history-playground.html
```

The command builds `public/oriel-private/aldworth-history.js` from the locally stored Aldworth import. That generated file is ignored by Git. It must not be uploaded to UniWheel, GitHub, a CDN or sent in a public archive.

## 6. Verified evidence on 14 October 2026

| Check | Result |
|---|---|
| `npm run test:oriel-card` | 35 passing tests |
| `npm run test:oriel-panel` | 5 passing tests |
| `npm run build:oriel-historical-fixture` | Completed; generated local fixture from 11 approved source series through 19 September 2026 |
| `npm run build` | Completed successfully |

This proves the code and local historic replay behave as intended. It does **not** prove target-server permissions, Recorder retention, entity metadata, mobile layout or a new administrator installation. Those need target-HA acceptance.

## 7. Target Home Assistant acceptance test

The administrator must perform these steps in the estate’s own Home Assistant instance:

1. Create a Home Assistant backup.
2. Copy the reviewed `oriel-card.js` to `/config/www/oriel/oriel-card.js`.
3. Add exactly one JavaScript module resource and one `type: custom:oriel-card` Manual card using the private approved YAML.
4. Use a **versioned resource URL** (for example `?v=23`) and hard-refresh the browser/Companion app after an update.
5. Compare each live reading with **Developer Tools → States**.
6. Compare at least three recorded weeks with **History** / Recorder, including one incomplete current week. Confirm Monday–Sunday dates in `Europe/London`.
7. Open every approved source, cost component and room/feeder detail. Verify that independent meters are not added to a parent total.
8. Check desktop and Home Assistant Companion/mobile.
9. Confirm browser Network activity has no external Oriel/analytics/API call and no click changes a device state.
10. Keep the previous JS version and verify rollback before accepting a new release.

The authoritative public administrator materials are [the card README](https://github.com/serobkhachatryan-cpu/estate-home-landing/blob/main/home-assistant/oriel-card/README.md) and the [administrator guide](https://github.com/serobkhachatryan-cpu/estate-home-landing/blob/main/home-assistant/ADMINISTRATOR-GUIDE.md). The private Aldworth live-install guide and approved configuration are deliberately supplied directly to the named administrator, not published or linked from GitHub.

## 8. Release discipline before handing it to a customer

The current source has passed local tests, but it must be cut as a clean, immutable release before a new administrator installs it:

1. Review working-tree changes and isolate only intended card files.
2. Run `npm run mvp:check` again from that exact commit.
3. Record the actual version number and SHA-256 checksum of `oriel-card.js`.
4. Update the resource query parameter, release notes and administrator guide to match that version.
5. Keep the private Aldworth YAML/data outside public GitHub; publish only a safe generic template.
6. Have the target administrator execute the acceptance test above.

Do **not** label an uncommitted working tree as an earlier release number or reuse an older checksum. A clean release is an operational safety requirement, not administrative bureaucracy.

## 9. MVP success criterion

The MVP is successful when an authorised Home Assistant administrator can install, update and roll back it; the owner/estate manager can interpret the current and weekly view; every visible figure is traceable to an approved source; gaps are honest; and no new route is created for control, secrets or public access.

Only after 30 days of stable use and a signed acceptance should Oriel fund the separate hosted/mobile/identity product track.

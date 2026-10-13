# Oriel card v20 — release manifest

## Release artifact

- File: `oriel-card.js`
- Resource URL: `/local/oriel/oriel-card.js?v=20`
- SHA-256: `9384ae6d4b42004225b4b18954c16df2e0b471e04dc3c62b8627d4238f8a588e`
- Size: `78586` bytes

Before editing the dashboard resource, the administrator must calculate the
SHA-256 of `/config/www/oriel/oriel-card.js` and compare it exactly with this
release manifest.

## What v20 adds

When the card explicitly opts in with:

```yaml
statistics:
  history: true
  cost_history: true
  timezone: Europe/London
```

it displays a separate **This UK week · tariff estimate** tile. It is derived
only from read-only Home Assistant Recorder deltas of every explicitly
configured `cost_entity_ids.<system>` source. The card does **not** add raw
current monetary states.

The estimate is shown only when every component is present to the signed-in
user, monetary, `state_class: total_increasing`, reset-free and has a valid
Recorder baseline and later sample in the current UK Monday–Sunday week. The
components are aligned to their latest shared Recorder timestamp. Missing
data, reset, gap, access error, incorrect metadata or more than eight cost
components produces `Withheld` / `No verified estimate`, never an invented
GBP number.

The tile is a **tariff estimate**, not an invoice, cash-spend ledger, payment
record or accounting fact.

## What was verified locally

- JavaScript syntax check (`node --check`);
- 31 automated card tests, including Home Assistant compressed Recorder
  payloads, counter reset/single-reading withholding, UK Monday–Sunday
  calendar rules, London DST, live tariff calculation, reset rejection and
  cost-history opt-in;
- lint (`npx oxlint`);
- `git diff --check`;
- private Aldworth handoff YAML structural alignment: 32 Electricity weeks,
  4 Water weeks, 32 matching tariff-estimate rows and aligned source
  breakdowns.

## Deliberate safety behaviour

- The card reads only states already present in the signed-in Home Assistant
  dashboard and makes same-origin, read-only Recorder requests.
- It has no token, external request, storage or Home Assistant service call.
- A cumulative-meter single sample, reset, missing baseline or gap is
  `No record`/`Withheld`, never a zero or absolute reading.
- `Live now`, current Recorder week, current tariff estimate and imported
  closed-week history remain explicitly separate.
- Full sensor catalogue is off by default; a production Aldworth card uses
  exact allowlists, not a 510-sensor auto-discovery.

## Server acceptance is still required

Local tests do not prove the availability or metadata of Vitaliy's real
Recorder cost sources. Install `v=20`, then follow
[RELEASE-QA-RU.md](RELEASE-QA-RU.md) and
[ALDWORTH-ADMIN-HANDOFF-RU.md](ALDWORTH-ADMIN-HANDOFF-RU.md) on the target
server before accepting the release.

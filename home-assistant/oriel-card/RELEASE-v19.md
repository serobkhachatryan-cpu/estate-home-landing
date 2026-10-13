# Oriel card v19 — release manifest

## Release artifact

- File: `oriel-card.js`
- Resource URL: `/local/oriel/oriel-card.js?v=19`
- SHA-256: `f59082186621b21758615f40f637c30982732b6f74702dcf066d9b8fff708cba`
- Size: `72014` bytes

The administrator must calculate the checksum of the installed
`/config/www/oriel/oriel-card.js` and compare it exactly with the value above
before editing the dashboard resource.

## What was verified locally

- JavaScript syntax check (`node --check`);
- 28 automated card tests, including Home Assistant compressed Recorder
  payloads, counter reset / single-reading withholding, UK Monday–Sunday
  calendar rules and both London DST changes;
- local Home Assistant resource load at `/local/oriel/oriel-card.js?v=19`;
- live state rendering, imported Aldworth history, UK weekly date labels,
  tariff archive details and room/source detail modal;
- system tab switching (Electricity, Water, Fuel, Power), archive-detail
  interactions and no browser console warnings/errors during the smoke test;
- responsive mobile viewport smoke test.

## Deliberate safety behaviour

- A single cumulative Recorder reading is **not** presented as weekly use.
- A counter reset, missing baseline or gap is presented as `No record`, never
  as a synthetic zero.
- An invalid or misaligned archive is hidden rather than relabelled as a
  current week.
- `Live now`, current Recorder week and imported closed-week history are shown
  separately; no values are silently merged.
- The card makes no external requests, holds no token and never calls a Home
  Assistant service.

## Server acceptance remains required

The local result does not prove access to Vitaliy's server Recorder or its
entity allowlist. Use [RELEASE-QA-RU.md](RELEASE-QA-RU.md) on that server to
verify the real entity IDs, Recorder permission/history, Companion/mobile
layout and restricted-user visibility before accepting the release.

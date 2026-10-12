# Oriel card — isolated historical-data test environment

This playground is a local, repeatable test environment for the Oriel card. It
uses synthetic fixture states and synthetic Recorder history. It does not
connect to Aldworth, a live Home Assistant instance, an API token or an
external service.

## Run the automated checks

From the repository root:

```sh
npm run test:oriel-card
```

The checks confirm that the card queries Recorder only when `statistics: true`
is configured, requests history for one approved source only, and excludes an
unapproved diagnostic sensor.

## Open the visual playground

Serve the repository root with any local static server, then open:

```text
/home-assistant/oriel-card/test-harness.html
```

For example:

```sh
npx vite --host 127.0.0.1 --port 4173
```

Then open [http://127.0.0.1:4173/home-assistant/oriel-card/test-harness.html](http://127.0.0.1:4173/home-assistant/oriel-card/test-harness.html).

## Scenarios

- **Recorded history** — six weeks of normal cumulative-meter data.
- **Missing week** — a recorder gap; the UI must show `No record` rather than
  estimate a value.
- **Unavailable source** — the current entity state is unavailable while the
  historical fixture remains separate.

To add a new scenario, edit only `test-harness.html`; never paste actual
Aldworth exports, Home Assistant databases, tokens, IP addresses or credentials
into this test fixture.

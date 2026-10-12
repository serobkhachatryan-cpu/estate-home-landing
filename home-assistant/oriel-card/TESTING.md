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
is configured, requests the primary approved source first, and excludes an
unapproved diagnostic sensor. An optional source-breakdown requests only its
explicitly configured source IDs after its dropdown is opened; it never scans
the entire state map.

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

## Private Aldworth historical playback

On the local machine that holds the private Recorder copy, build a separate,
ignored fixture and open the playback page:

```sh
npm run build:oriel-historical-fixture
```

Then open:

```text
/home-assistant/oriel-card/aldworth-history-playground.html
```

The generated fixture is served only by the local Vite process from
`public/oriel-private/`, which is ignored by Git.
It includes the approved House Input / House / Pool / Garage electrical meter
split, separately metered Greenhouse, Garden Garage, Lodge and Office feeders,
and House/Lodge/Main water meters. The playback labels the first group as a
reconciled component split and the remaining sources as independent meters; it
does not create an estate total from them. Fuel and backup power remain blank
until their historical data passes the same validation process.

The Aldworth playback fixes the weekly boundary to `Europe/London` and anchors
the timeline to the archive's last recorded timestamp. This makes the weekly
splits reproducible even when the test computer uses another timezone.

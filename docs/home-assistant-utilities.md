# Home Assistant utilities bridge

Oriel treats Home Assistant as the live source for utility telemetry. Each W3DS
user authorizes their own Home Assistant instance through Home Assistant OAuth.
The bridge then reads one selected electricity state and one selected water
state from Home Assistant's REST API. It never calls a Home Assistant service,
so it cannot switch devices, edit automations, or operate a home.

## Deployment configuration

Configure these as server-side runtime values in the hosting service.

| Variable                              | Purpose                                                                                                   |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `ORIEL_PUBLIC_BASE_URL`               | The public HTTPS root for Oriel. It is the Home Assistant OAuth client ID and supplies the callback host. |
| `HOME_ASSISTANT_TOKEN_ENCRYPTION_KEY` | A unique 32-byte base64url secret used only to encrypt OAuth tokens at rest.                              |

Users complete Home Assistant OAuth in their own browser. Access and refresh
tokens are AES-GCM encrypted before they are stored as local, disconnectable
operational state. They are never returned to the browser, committed to source
control, stored in a property record, or written to eVault.

The user enters the Home Assistant HTTPS address and the two entity IDs in
Oriel's Settings flow. The deployed Oriel service must be able to reach that
address over HTTPS. Private LAN addresses and `.local` hostnames are rejected;
use Home Assistant Cloud or a securely managed HTTPS reverse proxy for a hosted
Oriel deployment.

## Local development

This repository also supports a deliberately narrow local test path for the
Home Assistant OS VM on this Mac. With `ORIEL_LOCAL_DEV_MODE=1` and
`ORIEL_PUBLIC_BASE_URL=http://127.0.0.1:3001`, the local Oriel server permits
only `http://127.0.0.1:8125` as a Home Assistant address. It binds to loopback,
never opens Home Assistant to the internet, and uses a local-only test profile
instead of weakening W3DS eID authentication for the deployed app. This exact
allowlist is not enabled for the public Oriel service.

## Private historical imports

Oriel can also display validated daily history from a private Home Assistant
Recorder backup without restoring that backup into the running Home Assistant
unit. The raw archive, extracted SQLite database, and property-specific source
manifest belong under `data/imports/`, which is ignored by Git and must remain
owner-only. Do not upload those files or add them to a deployment bundle.

The local importer accepts a recorder database and private source manifest,
then sends only normalized daily consumption to the loopback-only Oriel
development server:

```bash
npm run import:home-assistant-history -- \
  --db data/imports/<property>/analysis/data/home-assistant_v2.db \
  --manifest data/imports/<property>/analysis/oriel-utility-history-manifest.json \
  --energy data/imports/<property>/analysis/data/.storage/energy \
  --endpoint http://127.0.0.1:3001
```

The importer uses Home Assistant's long-term `state` and `sum` values, retains
only complete 23–25-hour local days, and rejects reset/correction intervals
when the two deltas disagree. A source manifest can set a cutoff after a known
meter discontinuity; preceding points remain private and are not smoothed or
estimated. Each source must be explicitly scoped. Never add phase, circuit,
house, lodge, or main meters together unless the plumbing/electrical topology
has been confirmed.

A configured energy tariff may produce a clearly labelled estimate. It is not
an invoice, and water or electricity spend is not shown as fact until billing
records or an approved tariff model are imported.

### Full historical sensor inventory

For a property recorder snapshot, use the all-sensor importer to retain every
long-term statistic in its own source context. It reads the recorder and the
three Home Assistant registries locally, then imports normalized daily values
and safe display metadata only:

```bash
npm run import:home-assistant-sensors -- \
  --db data/imports/<property>/analysis/data/home-assistant_v2.db \
  --entity-registry data/imports/<property>/analysis/data/.storage/core.entity_registry \
  --device-registry data/imports/<property>/analysis/data/.storage/core.device_registry \
  --area-registry data/imports/<property>/analysis/data/.storage/core.area_registry \
  --endpoint http://127.0.0.1:3001 \
  --timezone Europe/London
```

The importer creates one daily series per statistic ID; it does **not** create
a combined estate total. It uses state deltas for cumulative water meters (the
recorder's historical `sum` column can diverge after meter resets), and only
shows a complete 23–25-hour local day. Measurements such as temperature,
power, humidity and equipment health are stored as complete-day averages with
their daily range. A missing current state is displayed as an archived source,
not silently discarded.

The original Oriel Home, Electricity, Water, Care and Systems screens consume
these normalized records. Systems exposes every source and its date coverage;
source totals, electrical phases, branches, overlapping Starlink generations,
and retired meters are explicitly separate. Do not publish a recorder import
to a public site without a private data boundary and the property owner's
explicit approval.

## Operating boundaries

- The connection uses Home Assistant's OAuth/IndieAuth flow, with Oriel's
  public root as the client ID and `/api/home-assistant/callback` as its
  same-host callback URL.
- The endpoint accepts only `domain.object_id` entity IDs and creates exactly
  one `/api/states/<entity_id>` request per utility refresh.
- Oriel returns no OAuth access token, refresh token, or Home Assistant URL to
  utility pages. The connected owner can see the configured hostname in
  Settings and can disconnect, which deletes the encrypted credentials and
  attempts to revoke the upstream Home Assistant refresh token.
- W3DS eID authentication is required before an app visitor can request a
  utility reading.
- Live readings and normalized local historical imports are read-only. Neither
  is treated as an eVault property or expense record, and Oriel never writes
  back to Home Assistant.

When the upstream `Property` and `PropertyExpense` schemas are published,
Oriel can add an owner-authorized eVault projection for utility-derived
financial records. Raw Home Assistant telemetry should remain in Home Assistant
rather than being copied wholesale into Oriel.

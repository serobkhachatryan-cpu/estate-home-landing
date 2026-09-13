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

## Operating boundaries

- The connection uses Home Assistant's OAuth/IndieAuth flow, with Oriel's
  public root as the client ID and `/api/home-assistant/callback` as its
  same-host callback URL.
- The endpoint accepts only `domain.object_id` entity IDs and creates exactly
  one `/api/states/<entity_id>` request per utility refresh.
- Oriel returns no OAuth access token, refresh token, or Home Assistant URL to
  utility pages. The connected owner can see the configured hostname in
  Settings and can disconnect, which deletes the encrypted credentials.
- W3DS eID authentication is required before an app visitor can request a
  utility reading.
- This first slice displays live readings only. It does not treat telemetry as
  an eVault property or expense record, and it does not write back to Home
  Assistant.

When the upstream `Property` and `PropertyExpense` schemas are published,
Oriel can add an owner-authorized eVault projection for utility-derived
financial records. Raw Home Assistant telemetry should remain in Home Assistant
rather than being copied wholesale into Oriel.

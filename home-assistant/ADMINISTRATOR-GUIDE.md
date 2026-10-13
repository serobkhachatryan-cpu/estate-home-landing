# Oriel for Home Assistant — installation guide for the card and panel

This document is the complete installation handoff for the native Oriel
interfaces. It covers both delivery options:

1. **Oriel card** — displayed inside a normal Home Assistant dashboard.
2. **Oriel panel** — a dedicated full-screen Oriel page in the sidebar.

Both are read-only browser components. They independently read Home Assistant
states already available to the signed-in user; neither component calls a Home
Assistant service, stores a token, embeds the investor site, or contacts an
external API.

## Choose the right interface

| Need | Install |
| --- | --- |
| Oriel should appear **alongside ordinary Home Assistant cards** (lights, climate, native entity cards, etc.) | **Oriel card** |
| Oriel needs its own full-page workspace in the HA sidebar | **Oriel panel** |
| Both views are useful | Install both; they are independent and can coexist |

> **Home Assistant Overview note.** The newer auto-generated `Overview`
> dashboard does not accept arbitrary custom cards. To place Oriel next to
> other cards, use a normal, editable Lovelace dashboard (for example
> `Estate overview`) and add Oriel there through **Edit dashboard → Add card →
> Manual**. This is a Home Assistant product limitation, not a limitation of
> the Oriel card.

## Official public download links

Download only from these repository links:

| File | Purpose | Download |
| --- | --- | --- |
| `oriel-card.js` | Normal Home Assistant dashboard card | [Download card](https://raw.githubusercontent.com/serobkhachatryan-cpu/estate-home-landing/main/home-assistant/oriel-card/oriel-card.js) |
| `oriel-panel.js` | Optional full-screen sidebar panel | [Download panel](https://raw.githubusercontent.com/serobkhachatryan-cpu/estate-home-landing/main/home-assistant/oriel-panel/oriel-panel.js) |
| This guide | Current installation steps | [Open guide on GitHub](https://github.com/serobkhachatryan-cpu/estate-home-landing/blob/main/home-assistant/ADMINISTRATOR-GUIDE.md) |
| Release QA runbook (Russian) | v20 server acceptance, live/Recorder/tariff checks and rollback | [Open release QA runbook](https://github.com/serobkhachatryan-cpu/estate-home-landing/blob/main/home-assistant/oriel-card/RELEASE-QA-RU.md) |
| Release manifest | v20 checksum and verified behaviour | [Open v20 manifest](https://github.com/serobkhachatryan-cpu/estate-home-landing/blob/main/home-assistant/oriel-card/RELEASE-v20.md) |
| Aldworth → Vitaliy handoff (Russian) | Clean single-card installation, live/Recorder semantics and acceptance | [Open handoff](https://github.com/serobkhachatryan-cpu/estate-home-landing/blob/main/home-assistant/oriel-card/ALDWORTH-ADMIN-HANDOFF-RU.md) |
| Aldworth template YAML | Public, non-sensitive configuration shape | [Open template](https://github.com/serobkhachatryan-cpu/estate-home-landing/blob/main/home-assistant/oriel-card/examples/aldworth-card.template.yaml) |
| Aldworth pilot boundary | Approved data, access and delivery boundary | [Open pilot boundary](https://github.com/serobkhachatryan-cpu/estate-home-landing/blob/main/docs/aldworth-oriel-pilot-boundary-ru.md) |

The links are public HTTPS URLs. No Home Assistant backup, Recorder database,
Long-Lived Access Token, password, network address, or raw Aldworth data is
included in the published files.

The complete Aldworth card YAML is intentionally **not** a public download: it
contains approved entity topology, historical usage and tariff estimates. It
must be handed only to the project's approved Home Assistant administrator by
a controlled channel. The public template is safe to inspect but cannot be
used to reproduce the estate's private history.

## Before installing

1. Create a backup in **Settings → System → Backups**.
2. Install as a Home Assistant administrator.
3. Check the downloaded filename and source domain before placing the file on
   the Home Assistant host.
4. Decide which interface is needed. The card is sufficient for a normal
   dashboard. The panel is optional and can be installed separately.

## A. Install the Oriel card

### A1. Copy the card asset

Create the local web directory and copy the downloaded file there:

```sh
mkdir -p /config/www/oriel
cp /path/to/oriel-card.js /config/www/oriel/oriel-card.js
```

The final file path must be:

```text
/config/www/oriel/oriel-card.js
```

It is then served locally by Home Assistant as:

```text
/local/oriel/oriel-card.js
```

Use Terminal & SSH, File editor, Studio Code Server or Samba share. Do not put
the file in `custom_components`; this is a frontend resource, not an HA
integration.

### A2. Register it as a dashboard resource

1. Open **Settings → Dashboards**.
2. Select the `⋮` menu, then **Resources**.
3. Choose **Add resource**.
4. Enter this URL:

   ```text
   /local/oriel/oriel-card.js?v=20
   ```

5. Choose **JavaScript module**.
6. Choose **Create**, then refresh the browser page.

### A3. Add the card

1. Open the target dashboard.
2. Choose `⋮ → Edit dashboard → Add card → Manual`.
3. Paste the configuration below and press **Save**.

```yaml
type: custom:oriel-card
history_weeks: 8
statistics:
  history: true
  # Europe/London is the default; state it explicitly for a UK estate.
  timezone: Europe/London
entity_ids:
  electricity:
    # The first approved sensor is the stable primary weekly/Recorder source.
    - sensor.REPLACE_WITH_APPROVED_ELECTRICITY_SOURCE
  water:
    - sensor.REPLACE_WITH_APPROVED_WATER_SOURCE
  fuel:
    - sensor.REPLACE_WITH_APPROVED_FUEL_SOURCE
  power:
    - sensor.REPLACE_WITH_APPROVED_BACKUP_POWER_SOURCE
```

Replace only the placeholders with owner-approved entity IDs. Omit an entity
only when no approved source exists; never substitute a guessed ID.

For an explicit, verified current-week tariff estimate, replace the existing
`statistics:` block with the following version, then add only approved monetary
cumulative counters:

```yaml
statistics:
  history: true
  cost_history: true
  timezone: Europe/London

# Add this top-level block next to entity_ids:, not inside it.
cost_entity_ids:
  electricity:
    - sensor.REPLACE_WITH_APPROVED_PHASE_A_COST
    - sensor.REPLACE_WITH_APPROVED_PHASE_B_COST
    - sensor.REPLACE_WITH_APPROVED_PHASE_C_COST
```

This is not a shortcut for showing an arbitrary live price. Every listed
counter must be present, monetary and `state_class: total_increasing`, with a
reset-free Recorder history since the UK Monday baseline. The v20 card derives
GBP from Recorder deltas only and shows `Withheld` when it cannot prove that
condition; it never sums the current monetary states. The result is labelled
**tariff estimate**, not an invoice or cash-spend figure.

### A3a. Put Oriel alongside other cards

Use a normal editable dashboard, then add standard HA cards and the Oriel card
to the same view. For example, add a native **Entities** card for selected
meters, a **Weather** card and `custom:oriel-card`. Home Assistant lays those
cards out using its normal dashboard layout; Oriel is not a separate app,
iframe or embedded website.

Do not convert or replace the system-generated `Overview` dashboard just to
install Oriel. Keep it as the default quick overview if desired, or make the
editable dashboard the household landing page only after the owner approves
that navigation choice.

`statistics.history: true` enables a read-only same-origin request to the
signed-in Home Assistant Recorder for the **first** approved
`entity_ids.<system>` sensor. That first position is a deliberate stable
primary source: do not reorder it unless its historical series has been
reviewed. The card never silently falls back from a main meter to a secondary
feeder because availability changes.

`Europe/London` is the default time zone for Recorder and archive processing.
It defines UK weeks as Monday 00:00 to Sunday 23:59:59, including British
Summer Time transitions. A weekly consumption value is calculated only for a
cumulative meter with a valid pre-week baseline and a later in-week Recorder
sample. A single point, reset, gap, missing permission or Recorder failure is
shown as **No record** / a visible warning—not as the meter's absolute state
or as zero.

The card's top **Live now** snapshot is the current approved Home Assistant
state; it is not a weekly use figure. If imported `archive_weekly_values` are
also configured, they remain an audited closed-week archive. The live snapshot
and the separately calculated **This UK week · Recorder** value are displayed
alongside it but are intentionally not appended to or merged into the imported
archive ribbon. No data leaves Home Assistant and no device service is called.

### A3b. Optional source / feeder breakdown

The card can show the focus week's overall value and an expandable breakdown
by explicitly approved meters or electrical feeders. This is appropriate only
where an administrator has confirmed the physical relationship. It is not an
automatic scan for rooms or sensors.

```yaml
source_breakdowns:
  electricity:
    title: "Where electricity was metered"
    note: "Only approved component feeders may be compared with the total."
    sources:
      - entity_id: sensor.APPROVED_HOUSE_FEEDER_ENERGY
        label: House
        relation: part_of_total
        archive_weekly_values: ["<latest_kwh>", "<previous_kwh>"]
        archive_weekly_recorded_days: ["<latest_days>", "<previous_days>"]
      - entity_id: sensor.APPROVED_POOL_FEEDER_ENERGY
        label: Pool
        relation: part_of_total
        archive_weekly_values: ["<latest_kwh>", "<previous_kwh>"]
        archive_weekly_recorded_days: ["<latest_days>", "<previous_days>"]
  water:
    title: "Independent water meters"
    sources:
      - entity_id: sensor.APPROVED_LODGE_WATER_METER
        label: Lodge Water
        relation: independent
        archive_weekly_values: ["<latest_litres>", "<previous_litres>"]
        archive_weekly_recorded_days: ["<latest_days>", "<previous_days>"]
```

`source_breakdowns` is a separate exact allowlist, so the sources do not need
to be repeated in `entity_ids`. Source archive arrays must be aligned, in the
same latest-to-oldest UK Monday–Sunday order, with the parent system's archive
arrays. Every supplied `archive_week_starts` item must be a real consecutive
UK Monday. Invalid dates, non-Mondays, gaps, duplicate weeks, or mismatched
array lengths/order are withheld as **No aligned archive history**, never
displayed as zero or an estimate.

The default `relation: independent` is never summed with the overall value.
`relation: part_of_total` only allows a percentage when all components have the
same recorded-day coverage and reconcile to the parent meter within rounding
tolerance. The card never allocates a tariff estimate, invoice, cash payment
or GBP spend across sources. With no imported archive, opening this dropdown
with `statistics.history: true` can make read-only Recorder requests only for
its explicit sources (maximum 16); closing it makes no extra history request.

### A4. Optional: full trusted-admin catalogue

To show all available `sensor.*` states in the expandable catalogue, add this
single line to the card YAML:

```yaml
show_catalog: true
```

Use it **only** on an admin-only owner/estate-operations dashboard. Do not use
it for an investor, guest, tenant or contractor because an estate's full
sensor list may include device-health and personal-device telemetry.

This catalogue is intentionally off by default: it can include technical,
diagnostic and irrelevant sensors. The normal card view shows only the
approved `entity_ids` (or explicit `sensor_groups`) and avoids a noisy estate
inventory.

### A5. Optional: explicit groups for an operational dashboard

For a user who should see specific non-utility sources without seeing every
sensor, use `sensor_groups` instead of `inventory_mode: all_sensors`:

```yaml
type: custom:oriel-card
sensor_groups:
  - id: water-operations
    label: Water operations
    icon: "≈"
    entity_ids:
      - sensor.REPLACE_WITH_WATER_TOTAL
      - sensor.REPLACE_WITH_WATER_FLOW
      - sensor.REPLACE_WITH_TANK_LEVEL
  - id: estate-weather
    label: Estate weather
    icon: "◌"
    entity_ids:
      - sensor.REPLACE_WITH_OUTDOOR_TEMPERATURE
      - sensor.REPLACE_WITH_OUTDOOR_HUMIDITY
```

`sensor_groups` overrides the automatic tabs. Each group must contain only
owner-approved exact entity IDs.

## B. Optional: install the full-screen Oriel panel

1. Download [oriel-panel.js](https://raw.githubusercontent.com/serobkhachatryan-cpu/estate-home-landing/main/home-assistant/oriel-panel/oriel-panel.js).
2. Copy it to:

   ```text
   /config/www/oriel/oriel-panel.js
   ```

3. Add this under the existing `panel_custom:` key in
   `/config/configuration.yaml`. Do not create a second `panel_custom:` key.

   ```yaml
   panel_custom:
     - name: oriel-panel
       url_path: oriel
       sidebar_title: Oriel
       sidebar_icon: mdi:home-analytics
       module_url: /local/oriel/oriel-panel.js?v=1
       require_admin: true
   ```

4. Run **Developer tools → YAML → Check configuration**.
5. Restart Home Assistant and open **Oriel** in the sidebar.

The panel and card have separate JS files and neither depends on the other.

## Verification

After installation:

- The card/panel opens without an external login screen.
- The **Live now** snapshot and each displayed source match their state in
  **Developer tools → States**.
- With `statistics.history: true`, validate at least two UK weeks against
  Recorder; a missing/reset/incomplete period must remain **No record**.
- A source-breakdown row is either explicitly configured and aligned with the
  selected week, or it is visibly withheld; independent meters are not added
  together.
- A missing state remains `Unavailable` / `No data`; it is not converted to
  zero or an estimate.
- There are no buttons that control a Home Assistant device.
- Browser developer tools show no external requests initiated by Oriel.

## Updating safely

1. Download the new file from the corresponding official link above.
2. Replace the local file under `/config/www/oriel/`.
3. Increment the cache version in the resource URL, for example:

   ```text
   /local/oriel/oriel-card.js?v=20
   ```

   For the panel, update its `module_url` version similarly.
4. Refresh the browser. For the panel, check YAML and restart Home Assistant
   when configuration changes are made.

## Rollback and removal

- Restore the previous JS asset from the Home Assistant backup, use its prior
  version query string, then refresh the browser.
- To remove the card, delete it through **Edit dashboard**. Remove its
  Resource only if no other dashboard uses it.
- To remove the panel, remove only the `- name: oriel-panel` item from
  `panel_custom`, check configuration and restart Home Assistant.

## Support boundary

For support, send the Oriel maintainer only the product version, browser
error text and non-sensitive screenshots. Never paste an HA password,
Long-Lived Access Token, `secrets.yaml`, Home Assistant backup, database or
network/VPN credentials into a chat, ticket or Git repository.

# Oriel Lovelace card

For the complete administrator handoff, including public download links, see
[Oriel for Home Assistant — administrator guide](../ADMINISTRATOR-GUIDE.md).

This is a read-only custom card for a standard Home Assistant dashboard. It is
not a `panel_custom` page.

1. Copy `oriel-card.js` to `/config/www/oriel/oriel-card.js`.
2. Add `/local/oriel/oriel-card.js?v=1` as a JavaScript module resource in
   **Settings → Dashboards → Resources**.
3. Add a Manual card to any dashboard:

```yaml
type: custom:oriel-card
inventory_mode: all_sensors
entity_ids:
  electricity:
    - sensor.shellypro3em_9454c5b9da04_energy
  water:
    - sensor.main_water_total_l
archive_weekly_values:
  electricity: [244.7, 834.1, 476.2, 485.4, 486.5, 367.0]
  water: [148, 1690, 501, 1116, 1331, 877]
archive_weekly_costs:
  electricity: [93.77, 320.29, 182.84, 186.39, 186.81, 140.91]
archive_anchor: "2026-09-19T12:00:00.000Z"
archive_timezone: Europe/London
```

`archive_anchor` and `archive_timezone` make every imported row an explicit UK
calendar week (Monday–Sunday), for example `14–20 Sept 2026`.

The card reads only `hass.states` from the signed-in dashboard. Do not enable
`inventory_mode: all_sensors` for an investor, guest or tenant: it exposes the
full sensor catalogue to that authenticated user. Use exact `entity_ids` for a
limited audience.

## All-sensor and custom-group display

With `inventory_mode: all_sensors`, the card creates tabs for Electricity,
Water, Fuel, Backup power, Climate & weather, Security & video, Network & PoE
and Other sensors, based on the entities delivered by Home Assistant. It does
not need the Oriel panel to be installed.

Administrators may replace those automatic groups with explicit dashboard
groups. This is the recommended method for an audience that should see more
than utilities but not the whole estate catalogue:

```yaml
type: custom:oriel-card
sensor_groups:
  - id: water-operations
    label: Water operations
    icon: "≈"
    entity_ids:
      - sensor.main_water_total_l
      - sensor.main_water_flow
      - sensor.lodge_water_tank_volume
  - id: weather
    label: Estate weather
    icon: "◌"
    entity_ids:
      - sensor.outdoor_temperature
      - sensor.outdoor_humidity
```

`sensor_groups` takes precedence over the automatic groups. Every listed
entity remains a direct Home Assistant state; a source that is unavailable is
shown as unavailable rather than replaced with a value.

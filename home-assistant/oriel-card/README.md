# Oriel Lovelace card

For the complete administrator handoff, including public download links, see
[Oriel for Home Assistant — administrator guide](../ADMINISTRATOR-GUIDE.md).

This is a read-only custom card for a standard Home Assistant dashboard. It is
not a `panel_custom` page.

1. Copy `oriel-card.js` to `/config/www/oriel/oriel-card.js`.
2. Add `/local/oriel/oriel-card.js?v=4` as a JavaScript module resource in
   **Settings → Dashboards → Resources**.
3. Add a Manual card to any dashboard:

```yaml
type: custom:oriel-card
entity_ids:
  electricity:
    - sensor.shellypro3em_9454c5b9da04_energy
  water:
    - sensor.main_water_total_l

# Optional private archive data. Each list is latest -> oldest and must align
# to the same Monday–Sunday UK weeks. Do not put an archive or billing data in
# a public repository.
archive_weekly_values:
  electricity: ["<latest_kwh>", "<previous_kwh>"]
archive_week_starts:
  electricity: ["<latest_monday_YYYY-MM-DD>", "<previous_monday_YYYY-MM-DD>"]
archive_weekly_recorded_days:
  electricity: ["<complete_days_in_latest_week>", "<complete_days_in_previous_week>"]

# Optional: use only a verified monetary source that is tied to this meter.
# The card calls this a tariff estimate, never an invoice, cash payment or
# general financial fact.
cost_entity_ids:
  electricity:
    - sensor.approved_phase_a_energy_cost
    - sensor.approved_phase_b_energy_cost
    - sensor.approved_phase_c_energy_cost
archive_weekly_costs:
  electricity: ["<latest_gbp_tariff_estimate>", "<previous_gbp_tariff_estimate>"]
archive_weekly_cost_matching_days:
  electricity: ["<matching_days_in_latest_week>", "<matching_days_in_previous_week>"]
archive_cost_source_labels:
  electricity: "Tariff estimate · Home Assistant published · approved meter phases"
archive_source_details:
  electricity:
    - role: "Approved meter"
      label: "House Input"
      entity_id: sensor.approved_house_input_energy
    - role: "Tariff component"
      label: "Energy cost · phase A"
      entity_id: sensor.approved_phase_a_energy_cost
archive_anchor: "2026-09-19T12:00:00.000Z"
archive_timezone: Europe/London
```

`archive_week_starts` is the strongest audit trail: use explicit UK Mondays
for every imported row. If it is omitted, `archive_anchor` and
`archive_timezone` derive the same Monday–Sunday weeks, for example
`14–20 Sept 2026`.

The card reproduces the Oriel weekly-ribbon layout: a chosen focus week, a
scrollable Mon–Sun timeline, a yellow focus line and an explicit list of the
approved measurement/cost sources. A cost is rendered only when a matching
`archive_weekly_costs` value is supplied. A `Plan`, `Fact`, `Cash` or
"efficient/inefficient" comparison is **not** fabricated from consumption.
If a later approved financial source exists, add aligned currency values under
`archive_weekly_plan_costs`; otherwise the card visibly says that no plan is
configured.

`archive_source_details` is optional. It is useful when replaying a private
archive in a separate test instance where the historical source is not a live
state today: it names the approved archived source but never invents a current
value for it.

The card reads only `hass.states` from the signed-in dashboard. Do not enable
`inventory_mode: all_sensors` for an investor, guest or tenant: it exposes the
full sensor catalogue to that authenticated user. Use exact `entity_ids` for a
limited audience.

## Full catalogue and custom-group display

With `show_catalog: true`, the card adds a collapsible administrator catalogue
of every `sensor.*` state delivered to the signed-in Home Assistant user. This
is separate from the approved sources used by the weekly ribbon. It does not
need the Oriel panel to be installed.

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

`sensor_groups` takes precedence over the default utility tabs. Every listed
entity remains a direct Home Assistant state; a source that is unavailable is
shown as unavailable rather than replaced with a value.

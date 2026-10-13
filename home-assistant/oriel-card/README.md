# Oriel Lovelace card

For the complete administrator handoff, including public download links, see
[Oriel for Home Assistant — administrator guide](../ADMINISTRATOR-GUIDE.md).
For the server release and acceptance checklist for v20, see
[RELEASE-QA-RU.md](RELEASE-QA-RU.md).

This is a read-only custom card for a standard Home Assistant dashboard. It is
not a `panel_custom` page.

1. Copy `oriel-card.js` to `/config/www/oriel/oriel-card.js`.
2. Add `/local/oriel/oriel-card.js?v=20` as a JavaScript module resource in
   **Settings → Dashboards → Resources**.
3. Add a Manual card to any dashboard:

```yaml
type: custom:oriel-card
history_weeks: 8
statistics:
  history: true
  # Optional verified current-week tariff estimate from Recorder deltas of
  # every approved cost counter. Do not derive GBP from current raw states.
  cost_history: true
  # Europe/London is the default when this line is omitted. Keep it explicit
  # for a UK estate so Recorder and archive weeks use Mon–Sun consistently.
  timezone: Europe/London
entity_ids:
  electricity:
    # The first approved ID is the stable primary source for the weekly
    # Recorder ribbon. Keep it first; later IDs are live approved sources.
    - sensor.shellypro3em_9454c5b9da04_energy
  water:
    - sensor.house_water_1_total_l

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

## Optional measured source breakdown

The focus-week total can have an expandable, explicitly configured breakdown
by meter or feeder. This is useful for a verified circuit split such as a
House Input meter with distinct House, Pool and Garage feeders, or for showing
separate water meters without pretending they are one estate total.

```yaml
source_breakdowns:
  electricity:
    title: "Where electricity was metered"
    open: false
    note: "Only the three approved component feeders are compared with House Input."
    sources:
      - entity_id: sensor.approved_house_feeder_energy
        label: House
        relation: part_of_total
        archive_weekly_values: ["<latest_kwh>", "<previous_kwh>"]
        archive_weekly_recorded_days: ["<latest_days>", "<previous_days>"]
      - entity_id: sensor.approved_pool_feeder_energy
        label: Pool
        relation: part_of_total
        archive_weekly_values: ["<latest_kwh>", "<previous_kwh>"]
        archive_weekly_recorded_days: ["<latest_days>", "<previous_days>"]
  water:
    title: "Independent water meters"
    note: "These meters are shown separately and are not added together."
    sources:
      - entity_id: sensor.approved_lodge_water_meter
        label: Lodge Water
        relation: independent
        archive_weekly_values: ["<latest_litres>", "<previous_litres>"]
        archive_weekly_recorded_days: ["<latest_days>", "<previous_days>"]
```

`source_breakdowns` is an additional explicit allowlist: it does not discover
similar sensors and its source IDs do not need to be duplicated under
`entity_ids`. A source archive series must have exactly the same number and
order of weeks as the parent system. If `archive_week_starts` is supplied for a
source, every date must match the parent UK Monday at the same position.
Misaligned history is withheld, never converted to zero.

`relation: part_of_total` does **not** make the card assume that meters can be
summed. It permits a percentage only for the selected week when every component
has matching recorded-day coverage and their values reconcile to the displayed
parent total within a small rounding tolerance. `relation: independent` is the
default and is never added to the total. The card does not allocate a tariff
estimate, bill, cash payment or GBP figure across a breakdown.

Without private archive arrays, a breakdown source can use Recorder history
only when `statistics.history: true` is enabled and the reader opens the
dropdown. The card then makes a read-only history request for each explicitly
configured source (maximum 16); it never discovers or queries all sensors.

`archive_week_starts` is the strongest audit trail: use one real, consecutive
UK Monday for every imported row. Invalid dates, non-Mondays, gaps, duplicate
weeks, or a length/order mismatch cause the imported archive to be withheld;
they are never rendered as zero. If it is omitted, `archive_anchor` and
`archive_timezone` derive the same Monday–Sunday weeks, for example
`14–20 Sept 2026`.

The card reproduces the Oriel weekly-ribbon layout: a chosen focus week, a
scrollable Mon–Sun timeline, a yellow focus line and an explicit list of the
approved measurement/cost sources. A cost is rendered only when a matching
`archive_weekly_costs` value is supplied **for every displayed usage week**,
with aligned `archive_weekly_cost_matching_days`, explicit `cost_entity_ids`
and a non-empty source label. Otherwise the timeline stays in its native
consumption unit and explicitly withholds the GBP estimate. A `Plan`, `Fact`, `Cash` or
"efficient/inefficient" comparison is **not** fabricated from consumption.
If a later approved financial source exists, add aligned currency values under
`archive_weekly_plan_costs`; otherwise the card visibly says that no plan is
configured.

`archive_source_details` is optional. It is useful when replaying a private
archive in a separate test instance where the historical source is not a live
state today: it names the approved archived source but never invents a current
value for it.

## Live state and Recorder history

The card always renders a **Live now** snapshot from the current approved
Home Assistant state delivered to the signed-in browser. It is not a weekly
consumption figure. With `statistics.history: true`, the card makes a
read-only same-origin Recorder request for the **first** approved
`entity_ids.<system>` sensor only. That stable first position is intentional:
the weekly ribbon must not silently change from a main meter to a secondary
feeder merely because availability changes.

`Europe/London` is the default time zone for Recorder and archive calculations.
Weeks run Monday 00:00 through Sunday 23:59:59 in that zone, including across
British Summer Time changes. A Recorder-derived weekly use is shown only for a
cumulative meter with a valid pre-week baseline and a later sample in the
week. A single reading, counter reset, missing history or permission failure
shows **No record** / a visible warning rather than an absolute counter value
or a synthetic zero.

When private `archive_weekly_values` are supplied, they represent an imported
closed-week record. The current live state and the separately calculated
**This UK week · Recorder** value remain visibly separate from that archive;
the card does not silently append or merge the two series. This prevents a
live counter or partial current week from being mistaken for an audited
historical row.

When `statistics.cost_history: true` and explicit `cost_entity_ids` are
provided, the card also shows a separate **This UK week · tariff estimate**.
It uses only Recorder deltas from every approved monetary, cumulative cost
counter; it never sums their raw current states. A missing baseline, reset,
gap, non-monetary/non-cumulative component or Recorder error withholds the GBP
estimate rather than presenting a synthetic value. This is a tariff estimate,
not an invoice, cash payment or finance ledger.

The card reads only `hass.states` from the signed-in dashboard. Its weekly
sources are allowlist-only: without exact `entity_ids` it displays no source,
rather than discovering a similar-looking sensor automatically. Do not enable
`show_catalog: true` for an investor, guest or tenant: it exposes the
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
      - sensor.house_water_1_total_l
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

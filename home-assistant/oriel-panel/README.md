# Oriel native Home Assistant panel

For the complete administrator handoff, including public download links, see
[Oriel for Home Assistant — administrator guide](../ADMINISTRATOR-GUIDE.md).

This is a dependency-free `panel_custom` panel, designed in the Oriel visual
language and rendered directly inside Home Assistant. It is not an iframe of
the public investor view.

At runtime, it reads approved current states from the `hass.states` object that
Home Assistant has already provided to the signed-in browser. It may also make
one internal Home Assistant websocket request for the selected approved source
to render the six-week Recorder timeline. It stores no token, makes no Home
Assistant service call, and loads no Oriel/W3DS/investor data.

## Full Aldworth inventory mode

The weekly interface stays deliberately focused on **Electricity**, **Water**,
**Fuel**, and **Backup power**. It now also has an expandable **All approved
Aldworth sensors** catalogue on that same page. With the opt-in configuration
below it displays every `sensor.*` entity that the signed-in Home Assistant
has supplied: its native friendly name, state, unit, entity ID, availability
and a navigation category. Nothing is queried from another system and no
value is estimated.

The Aldworth Recorder snapshot used for the pilot contains **510 sensor
entities**. It includes utilities, tank levels, UPS/backup power, weather and
climate, security/NVR storage, network health and PoE. The catalogue maps
these for navigation as Electricity, Water, Fuel, Backup power, Climate &
weather, Security & video, Network & PoE, and Other estate sensors. The
mapping does not change the underlying Home Assistant source or value.

Enable the complete catalogue only for an authenticated, trusted estate user:

```yaml
panel_custom:
  - name: oriel-panel
    url_path: oriel
    sidebar_title: Oriel
    sidebar_icon: mdi:home-analytics
    module_url: /local/oriel/oriel-panel.js?v=5
    require_admin: true
    config:
      inventory_mode: all_sensors
```

`all_sensors` is intentionally explicit because a full Home Assistant
catalogue may include device-health or personal-device entities. For a
tenant, investor, or other limited audience, keep the default allow-list or
use exact `entity_ids`; do not enable full inventory mode.

## Approved live-data boundary

The default Aldworth rules are deliberately narrow and only cover sources
already identified in Home Assistant:

| System | Approved source rule |
| --- | --- |
| Electricity | `sensor.total_power`, `sensor.total_l1_power`, `sensor.total_l2_power`, `sensor.total_l3_power`, and `sensor.shellypro3em_*_(power\|energy\|energy_cost)` |
| Water | `sensor.house_water_1_(flow\|total_l)`, `sensor.main_water_(flow\|total_l)`, `sensor.lodge_water_(flow\|total_l\|tank_volume)` |
| Fuel | `sensor.house_fuel_tank_*` and its `_volume` states |
| Power | estate UPS/battery states with the locations office, lodge, basement, or loft |

The panel does not calculate a cost total. It displays each cost state exactly
as Home Assistant publishes it, avoiding an invented aggregation or tariff.
If a state is unavailable, it says so; if no approved state exists, it shows
an empty state rather than making up a reading.

## Weekly timeline boundary

The panel has four tabs only: **Electricity**, **Water**, **Fuel** and
**Power**. Each tab presents a vertical six-week timeline and lets the
signed-in user select a weekly period.

For the timeline, the panel requests Recorder history only through the
existing signed-in Home Assistant websocket and only for the selected approved
source. The request is `history/history_during_period` with one explicit
`entity_id`, `minimal_response: true` and `no_attributes: true`. It never asks
for all history, events, recordings, registries, cameras or configuration.

Cumulative energy and water sources show a within-week delta; fuel and
UPS/battery sources show the final recorded state of that week. A period with
no Recorder result remains **No record**; Oriel does not estimate, fill or
interpolate it.

For a tighter boundary, or for a non-admin audience, the administrator can
replace a system's default rule with an exact `entity_ids` list in the YAML
configuration below. An exact list takes precedence over the defaults.

## Admin installation

1. Create a Home Assistant backup in **Settings → System → Backups**.
2. In the Home Assistant Terminal / SSH add-on, copy the local panel asset:

   ```sh
   mkdir -p /config/www/oriel
   curl -fsSL https://raw.githubusercontent.com/serobkhachatryan-cpu/estate-home-landing/main/home-assistant/oriel-panel/oriel-panel.js \
     -o /config/www/oriel/oriel-panel.js
   ```

   Or copy [`oriel-panel.js`](./oriel-panel.js) through File editor, Studio
   Code Server, or a Samba share into `/config/www/oriel/oriel-panel.js`.

3. Add this to `/config/configuration.yaml`:

   ```yaml
   panel_custom:
     - name: oriel-panel
       url_path: oriel
       sidebar_title: Oriel
       sidebar_icon: mdi:home-analytics
       module_url: /local/oriel/oriel-panel.js?v=5
       require_admin: false
   ```

   `require_admin: false` allows authenticated Home Assistant users to see the
   panel, but it remains read-only and displays only its approved sources. For
   an admin-only pilot, set it to `true`.

   To replace a default group with a hard allowlist, add a `config` block
   beneath that panel entry. Omit a group entirely to retain its approved
   default rule (including the existing Shelly cost-state rule):

   ```yaml
       config:
         entity_ids:
           water:
             - sensor.house_water_1_flow
             - sensor.main_water_flow
             - sensor.lodge_water_flow
             - sensor.house_water_1_total_l
             - sensor.main_water_total_l
             - sensor.lodge_water_total_l
             - sensor.lodge_water_tank_volume
           fuel:
             - sensor.house_fuel_tank_1
             - sensor.house_fuel_tank_1_volume
           power:
             - sensor.office_ups_battery
             - sensor.office_ups_runtime
   ```

4. In **Developer tools → YAML**, run **Check configuration**. If it passes,
   restart Home Assistant from **Settings → System**.
5. Refresh the browser. **Oriel** appears in the Home Assistant sidebar at
   `/oriel`.

The `/local` file is held by Home Assistant after installation. The public
Oriel investor page is never embedded or loaded in the native panel. Climate,
Security and Network are intentionally catalogue categories rather than extra
weekly timeline tabs.

## Updating safely

Copy a new `oriel-panel.js`, increase the `?v=` value in `module_url`, check
the YAML, restart, and refresh the browser. Keep the last
working copy in the Home Assistant backup so a rollback is simple.

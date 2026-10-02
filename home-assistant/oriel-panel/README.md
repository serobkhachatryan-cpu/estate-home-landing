# Oriel native Home Assistant panel

This is a dependency-free `panel_custom` panel, designed in the Oriel visual
language and rendered directly inside Home Assistant. It is not an iframe of
the public investor view.

At runtime, it only receives the `hass.states` object that Home Assistant has
already provided to the signed-in browser. It makes no network request, stores
no token, makes no service call, and loads no Oriel/W3DS/investor data.

## Approved live-data boundary

The default Aldworth rules are deliberately narrow and only cover sources
already identified in Home Assistant:

| System | Approved source rule |
| --- | --- |
| Electricity | `sensor.total_power`, `sensor.total_l1_power`, `sensor.total_l2_power`, `sensor.total_l3_power`, and `sensor.shellypro3em_*_(power\|energy\|energy_cost)` |
| Water | `sensor.house_water_1_(flow\|total_l)`, `sensor.main_water_(flow\|total_l)`, `sensor.lodge_water_(flow\|total_l\|tank_volume)` |
| Fuel | `sensor.house_fuel_tank_*` and its `_volume` states |
| Power | estate UPS/battery states with the locations office, lodge, basement, or loft |
| Climate | `sensor.basement_ups_temperature` |
| Security | `sensor.aldworth_nvr_storage_utilization` |
| Network | `sensor.starlink_ping_2` |

The panel does not calculate a cost total. It displays each cost state exactly
as Home Assistant publishes it, avoiding an invented aggregation or tariff.
If a state is unavailable, it says so; if no approved state exists, it shows
an empty state rather than making up a reading.

For a still tighter boundary, the administrator can replace a system's default
rule with an exact `entity_ids` list in the YAML configuration below.

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
       module_url: /local/oriel/oriel-panel.js?v=2
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
           security:
             - sensor.aldworth_nvr_storage_utilization
           network:
             - sensor.starlink_ping_2
   ```

4. In **Developer tools → YAML**, run **Check configuration**. If it passes,
   restart Home Assistant from **Settings → System**.
5. Refresh the browser. **Oriel** appears in the Home Assistant sidebar at
   `/oriel`.

The `/local` file is held by Home Assistant after installation. The public
Oriel investor page is never embedded or loaded in the native panel.

## Updating safely

Copy a new `oriel-panel.js`, increase `?v=2` in `module_url` (for example,
`?v=3`), check the YAML, restart, and refresh the browser. Keep the last
working copy in the Home Assistant backup so a rollback is simple.

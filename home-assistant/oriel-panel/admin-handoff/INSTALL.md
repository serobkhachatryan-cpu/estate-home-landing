# Oriel for Home Assistant — admin handoff

## What this is

Oriel is a native, read-only Home Assistant custom panel. It appears in the
Home Assistant sidebar as **Oriel** and receives its current values directly
from Home Assistant's `hass.states` object.

It does **not** embed the public Oriel investor website, call an external API,
send telemetry, contain a token, invoke a Home Assistant service, or require
W3DS.

## Install (five minutes)

1. Create a backup: **Settings → System → Backups**.
2. Copy `oriel-panel.js` from this package to:

   ```text
   /config/www/oriel/oriel-panel.js
   ```

   Create `/config/www/oriel/` if it does not yet exist.
3. Merge the contents of `configuration.yaml.snippet` into:

   ```text
   /config/configuration.yaml
   ```

   If `panel_custom:` already exists, add only the `- name: oriel-panel` item
   under the existing key; YAML must contain `panel_custom:` only once.
4. In **Developer tools → YAML**, choose **Check configuration**.
5. If the check passes, restart Home Assistant from **Settings → System** and
   refresh the browser.

Open `/oriel`, or use the new **Oriel** sidebar item.

## Acceptance check

- The Oriel sidebar item opens without an external login screen.
- Electricity displays the same current `sensor.total_power` value as Home
  Assistant, when that entity is available.
- Water displays only the approved house/lodge/main-water source states.
- Existing Shelly monetary states are displayed individually; Oriel does not
  calculate an invented total cost.
- An unavailable Home Assistant entity appears as **Unavailable**, not as an
  estimated number.
- No button changes a device state; this panel is read-only.

## Access and data boundary

`require_admin: false` in the supplied snippet lets authenticated Home
Assistant users access the panel. For an admin-only pilot, change it to
`true` before restart.

The built-in source rules are limited to the identified Aldworth estate
sensors: total/phase electricity, Shelly energy/cost, house/lodge/main water,
house fuel tanks, estate UPS/battery, basement UPS temperature, NVR storage,
and Starlink ping. Exact entity IDs can be substituted through the panel's
configuration when a stricter allowlist is required.

## Updating or removing

To update, replace `/config/www/oriel/oriel-panel.js`, change the version in
`module_url` (for example `?v=1.0.1`), check configuration, restart, and
refresh.

To remove, delete the `oriel-panel` entry from `panel_custom`, optionally
remove `/config/www/oriel/`, check configuration, and restart.

## Русская версия

Это нативная read-only панель Home Assistant. Она получает только текущие
состояния из уже авторизованной сессии Home Assistant. Внешних токенов,
W3DS, iframe, API-запросов наружу и управления устройствами нет.

1. Создать backup Home Assistant.
2. Скопировать `oriel-panel.js` в `/config/www/oriel/oriel-panel.js`.
3. Добавить YAML из `configuration.yaml.snippet` в
   `/config/configuration.yaml`.
4. Выполнить **Developer tools → YAML → Check configuration**.
5. Перезапустить Home Assistant и открыть пункт **Oriel** в sidebar.

Если `panel_custom:` уже есть, нельзя создавать второй такой ключ — нужно
добавить только новый элемент `- name: oriel-panel` внутрь существующего
списка.

# Oriel native Home Assistant panel — no W3DS

This panel is a local, dependency-free Home Assistant custom panel. It reads
the signed-in Home Assistant user's already-authorised live state from `hass`.
It has no Oriel login screen, access token, external URL, analytics service,
or telemetry relay.

## Admin installation

1. In Home Assistant OS, create a backup in **Settings → System → Backups**.
2. Create the directory `/config/www/oriel/` and copy `oriel-panel.js` there.
   The official **File editor**, **Studio Code Server**, or **Samba share** app
   can access `/config`; do not expose this directory publicly.
3. Add this entry to `/config/configuration.yaml`:

   ```yaml
   panel_custom:
     - name: oriel-panel
       sidebar_title: Oriel
       sidebar_icon: mdi:home-analytics
       module_url: /local/oriel/oriel-panel.js?v=1
       require_admin: false
   ```

4. In **Developer tools → YAML**, run **Check configuration**. If it passes,
   restart Home Assistant from **Settings → System**.
5. Refresh the browser. **Oriel** appears in the Home Assistant sidebar.

`require_admin: false` allows ordinary Home Assistant users to see Oriel, but
they only see what their existing Home Assistant session is permitted to read.
Set it to `true` for an administrator-only rollout.

## Data boundary

The panel receives only the states already made available by Home Assistant to
the open browser session. It filters out personal mobile-device entities and
shows estate-oriented sources. There is no W3DS authentication because Home
Assistant is the identity boundary for this local panel.

This first native panel is live-state only. Recorder history, cost analysis,
and investor access should be added separately rather than copied into the
panel as unsynchronised external data.

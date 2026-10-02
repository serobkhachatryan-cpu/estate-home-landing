/*
 * Oriel local Home Assistant panel.
 *
 * This file is served from Home Assistant's /config/www directory. It never
 * fetches the public Oriel website, a recorder export, or an external API.
 * Every reading is rendered from the current `hass.states` object supplied by
 * Home Assistant to the signed-in browser session.
 */

const ORIEL_SYSTEMS = [
  {
    id: "power",
    label: "Power",
    description: "UPS and backup-power states published by Home Assistant.",
    icon: "⚡",
    primary: /battery/i,
  },
  {
    id: "electricity",
    label: "Electricity",
    description: "Main load, phase states, and cost states published by Home Assistant.",
    icon: "ϟ",
    primary: /^sensor\.total_power$/i,
  },
  {
    id: "water",
    label: "Water",
    description: "House, lodge, and main-water flow and volume states.",
    icon: "≈",
    primary: /^sensor\.main_water_flow$/i,
  },
  {
    id: "fuel",
    label: "Fuel",
    description: "Fuel-tank level and volume states published by Home Assistant.",
    icon: "◒",
    primary: /^sensor\.house_fuel_tank_\d+(?:_volume)?$/i,
  },
  {
    id: "climate",
    label: "Climate",
    description: "Approved estate temperature and humidity states.",
    icon: "◌",
    primary: /^sensor\.basement_ups_temperature$/i,
  },
  {
    id: "security",
    label: "Security",
    description: "Approved property security and NVR states.",
    icon: "◇",
    primary: /^sensor\.aldworth_nvr_storage_utilization$/i,
  },
  {
    id: "network",
    label: "Network",
    description: "Approved estate-connectivity states.",
    icon: "⌁",
    primary: /^sensor\.starlink_ping_2$/i,
  },
];

/*
 * Default rules cover only the Aldworth sources already identified in Home
 * Assistant. An administrator can replace any group with an exact entity-id
 * list through `panel_custom.config.entity_ids` (shown in README.md).
 */
const DEFAULT_ENTITY_RULES = {
  power: [
    /^sensor\.(?:office|lodge|basement|loft).*ups.*$/i,
    /^sensor\.(?:office|lodge|basement|loft).*battery.*$/i,
  ],
  electricity: [
    /^sensor\.total(?:_l[123])?_power$/i,
    /^sensor\.shellypro3em_[a-z0-9]+_(?:power|energy|energy_cost)$/i,
  ],
  water: [
    /^sensor\.house_water_1_(?:flow|total_l)$/i,
    /^sensor\.main_water_(?:flow|total_l)$/i,
    /^sensor\.lodge_water_(?:flow|total_l|tank_volume)$/i,
  ],
  fuel: [/^sensor\.house_fuel_tank_\d+(?:_volume)?$/i],
  climate: [/^sensor\.basement_ups_temperature$/i],
  security: [/^sensor\.aldworth_nvr_storage_utilization$/i],
  network: [/^sensor\.starlink_ping_2$/i],
};

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function attributes(entity) {
  return entity && entity.attributes && typeof entity.attributes === "object"
    ? entity.attributes
    : {};
}

function friendlyName(entity) {
  const name = attributes(entity).friendly_name;
  return name || entity.entity_id.replace(/^[^.]+\./, "").replace(/_/g, " ");
}

function isAvailable(entity) {
  const state = String(entity && entity.state != null ? entity.state : "").toLowerCase();
  return ["", "unknown", "unavailable", "none"].indexOf(state) === -1;
}

function numericState(entity) {
  const parsed = Number.parseFloat(String(entity && entity.state != null ? entity.state : ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function isMonetary(entity) {
  const unit = String(attributes(entity).unit_of_measurement || "").toUpperCase();
  return attributes(entity).device_class === "monetary" || unit === "GBP" || unit === "£";
}

function displayValue(entity) {
  if (!entity) return "No approved source";
  if (!isAvailable(entity)) return "Unavailable";

  const unit = String(attributes(entity).unit_of_measurement || "").trim();
  const number = numericState(entity);
  if (isMonetary(entity) && number !== null) {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 2,
    }).format(number);
  }
  if (number !== null) {
    const decimals = Math.abs(number) >= 100 ? 1 : 2;
    const formatted = new Intl.NumberFormat("en-GB", {
      maximumFractionDigits: decimals,
    }).format(number);
    return formatted + (unit ? " " + unit : "");
  }
  return String(entity.state) + (unit ? " " + unit : "");
}

function updatedAt(entity) {
  const value = Date.parse((entity && (entity.last_updated || entity.last_changed)) || "");
  return Number.isFinite(value) ? value : null;
}

function formattedUpdatedAt(entities) {
  const timestamps = entities.map(updatedAt).filter(function (value) {
    return value !== null;
  });
  if (!timestamps.length) return "No timestamp published";
  const newest = Math.max.apply(Math, timestamps);
  return "Latest source update · " + new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(newest));
}

function validEntityId(value) {
  return typeof value === "string" && /^[a-z_]+\.[a-zA-Z0-9_]+$/.test(value);
}

function configuredEntityIds(panel, systemId) {
  const config = panel && panel.config;
  const groups = config && config.entity_ids;
  const candidate = groups && groups[systemId];
  if (!Array.isArray(candidate) || !candidate.length) return null;
  return candidate.filter(validEntityId);
}

function belongsToSystem(system, entity, panel) {
  const configured = configuredEntityIds(panel, system.id);
  if (configured) return configured.indexOf(entity.entity_id) !== -1;
  const rules = DEFAULT_ENTITY_RULES[system.id] || [];
  return rules.some(function (rule) {
    return rule.test(entity.entity_id);
  });
}

function entityPriority(system, entity) {
  let priority = isAvailable(entity) ? 100 : 0;
  const source = entity.entity_id + " " + friendlyName(entity);
  if (system.primary.test(entity.entity_id) || system.primary.test(source)) priority += 80;
  if (attributes(entity).device_class === "power") priority += 20;
  if (isMonetary(entity)) priority += 10;
  if (/total/i.test(source)) priority += 8;
  if (/main/i.test(source)) priority += 5;
  return priority;
}

function costState(entities) {
  return (
    entities.find(isMonetary) ||
    entities.find(function (entity) {
      return /(?:energy_)?cost/i.test(entity.entity_id);
    }) ||
    null
  );
}

class OrielPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._selectedSystem = "electricity";
    this._hass = null;
    this._panel = null;
    this._renderQueued = false;
  }

  set hass(hass) {
    this._hass = hass;
    this.queueRender();
  }

  set panel(panel) {
    this._panel = panel;
    this.queueRender();
  }

  connectedCallback() {
    this.render();
  }

  queueRender() {
    if (this._renderQueued) return;
    this._renderQueued = true;
    Promise.resolve().then(() => {
      this._renderQueued = false;
      this.render();
    });
  }

  render() {
    const stateMap = this._hass && this._hass.states ? this._hass.states : {};
    const states = Object.keys(stateMap).map(function (key) {
      return stateMap[key];
    });
    const selected = ORIEL_SYSTEMS.find((system) => system.id === this._selectedSystem) || ORIEL_SYSTEMS[0];
    const selectedStates = states
      .filter((entity) => belongsToSystem(selected, entity, this._panel))
      .sort((a, b) => {
        const difference = entityPriority(selected, b) - entityPriority(selected, a);
        return difference || friendlyName(a).localeCompare(friendlyName(b));
      });
    const availableCount = selectedStates.filter(isAvailable).length;
    const primary = selectedStates.find(isAvailable) || selectedStates[0] || null;
    const cost = costState(selectedStates);
    const coverage = ORIEL_SYSTEMS.map((system) => ({
      system: system,
      count: states.filter((entity) => belongsToSystem(system, entity, this._panel) && isAvailable(entity)).length,
    }));

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; min-height: 100%; color: #15344a; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        * { box-sizing: border-box; }
        .page { min-height: 100vh; padding: 30px clamp(18px, 4vw, 66px) 54px; background: #e7e1d7; }
        .shell { max-width: 1420px; margin: 0 auto; border: 1px solid #d2c8b9; border-radius: 34px; padding: clamp(22px, 4vw, 52px); background: #f7f3eb; box-shadow: 0 18px 50px rgba(48, 37, 19, .08); }
        header { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; padding-bottom: 26px; border-bottom: 1px solid #d6cbbb; }
        .brand { font-size: 24px; font-weight: 750; letter-spacing: -.04em; }
        .eyebrow, .section-label, .metric-label, .system-label { margin: 0; color: #907044; font-size: 12px; font-weight: 800; letter-spacing: .17em; text-transform: uppercase; }
        h1 { margin: 0; max-width: 760px; font-family: Georgia, "Times New Roman", serif; font-size: clamp(34px, 5vw, 66px); line-height: .97; letter-spacing: -.055em; }
        .live { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 9px; margin-top: 3px; padding: 11px 14px; border-radius: 999px; background: #e7eee5; color: #315039; font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: #5a8a5d; box-shadow: 0 0 0 4px rgba(90, 138, 93, .14); }
        .intro { margin: 23px 0 0; max-width: 760px; color: #5a6a75; font-size: 18px; line-height: 1.5; }
        .tabs { display: flex; gap: 8px; overflow-x: auto; padding: 26px 0 7px; scrollbar-width: thin; }
        button { appearance: none; cursor: pointer; font: inherit; }
        .tab { flex: 0 0 auto; border: 1px solid #d5cbbb; border-radius: 14px; padding: 12px 15px; color: #425664; background: #faf7f0; font-size: 14px; font-weight: 750; }
        .tab[aria-selected="true"] { border-color: #15344a; background: #15344a; color: #fffdf8; }
        .content { margin-top: 18px; border-radius: 28px; overflow: hidden; background: #102737; color: #f5f0e6; }
        .hero { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(250px, .85fr); gap: 24px; padding: clamp(24px, 4vw, 46px); border-bottom: 1px solid #d4c6ac; }
        .system-label, .metric-label { color: #d9b46e; }
        .hero h2 { margin: 0; font-size: clamp(36px, 5vw, 68px); line-height: 1; letter-spacing: -.055em; }
        .system-copy { margin: 8px 0 0; color: #afbbc2; font-size: 18px; }
        .summary { align-self: end; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
        .metric { min-height: 132px; border: 1px solid rgba(224, 204, 166, .25); border-radius: 18px; padding: 18px; background: rgba(255,255,255,.06); }
        .metric-value { display: block; overflow-wrap: anywhere; margin-top: 10px; color: #fffdf8; font-size: clamp(24px, 3vw, 40px); font-weight: 760; letter-spacing: -.04em; }
        .metric-meta { display: block; margin-top: 9px; color: #9aabb6; font-size: 13px; line-height: 1.35; }
        .readings { padding: clamp(24px, 3vw, 38px); }
        .section-head { display: flex; justify-content: space-between; gap: 16px; align-items: end; margin-bottom: 17px; }
        .section-title { margin: 5px 0 0; font-size: 24px; letter-spacing: -.035em; }
        .timestamp { max-width: 330px; color: #9aabb6; font-size: 14px; text-align: right; }
        .list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        .reading { min-height: 132px; padding: 17px; border: 1px solid rgba(224, 204, 166, .2); border-radius: 16px; background: rgba(255,255,255,.045); }
        .reading-name { color: #b8c3c7; font-size: 14px; line-height: 1.35; }
        .reading-value { margin-top: 20px; color: #fffdf8; font-size: 25px; font-weight: 760; letter-spacing: -.04em; overflow-wrap: anywhere; }
        .reading-meta { display: block; margin-top: 8px; color: #718590; font-size: 11px; line-height: 1.35; overflow-wrap: anywhere; }
        .empty { padding: 28px; border: 1px dashed rgba(224,204,166,.35); border-radius: 16px; color: #b7c4c9; line-height: 1.55; }
        .coverage { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; margin-top: 26px; }
        .coverage-item { min-width: 0; padding: 13px; border: 1px solid #d5cbbb; border-radius: 14px; background: #fbf8f2; }
        .coverage-name { display: block; color: #63717a; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .coverage-value { display: block; margin-top: 6px; font-size: 20px; font-weight: 750; letter-spacing: -.04em; }
        footer { margin-top: 25px; color: #6f7e87; font-size: 13px; line-height: 1.55; }
        @media (max-width: 900px) { .hero { grid-template-columns: 1fr; } .list { grid-template-columns: repeat(2, minmax(0, 1fr)); } .coverage { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        @media (max-width: 560px) { .page { padding: 0; } .shell { border: 0; border-radius: 0; min-height: 100vh; padding: 24px 16px 35px; } header { display: block; } .live { margin-top: 20px; } .intro { font-size: 16px; } .summary, .list { grid-template-columns: 1fr; } .coverage { grid-template-columns: repeat(2, minmax(0, 1fr)); } .section-head { display: block; } .timestamp { margin-top: 8px; text-align: left; } }
      </style>
      <main class="page">
        <section class="shell">
          <header>
            <div>
              <div class="brand">Oriel</div>
              <p class="eyebrow">Home Assistant · live estate systems</p>
              <h1>Estate systems, in their real state.</h1>
              <p class="intro">The Oriel layout is running inside Home Assistant. It reads only the current states supplied to this signed-in session—no public investor link, history export, external account, or telemetry relay.</p>
            </div>
            <div class="live"><span class="dot"></span>Live Home Assistant state</div>
          </header>
          <nav class="tabs" role="tablist" aria-label="Oriel systems">
            ${ORIEL_SYSTEMS.map((system) => `<button class="tab" data-system="${system.id}" role="tab" aria-selected="${system.id === selected.id}" aria-controls="oriel-current-states">${system.icon} ${system.label}</button>`).join("")}
          </nav>
          <section class="content" id="oriel-current-states" role="tabpanel" aria-live="polite">
            <div class="hero">
              <div>
                <p class="system-label">Selected system · live now</p>
                <h2>${escapeHtml(selected.label)}</h2>
                <p class="system-copy">${escapeHtml(selected.description)}</p>
              </div>
              <div class="summary">
                <div class="metric">
                  <span class="metric-label">Primary current state</span>
                  <strong class="metric-value">${escapeHtml(displayValue(primary))}</strong>
                  <span class="metric-meta">${primary ? escapeHtml(friendlyName(primary)) : "No approved source"}</span>
                </div>
                <div class="metric">
                  <span class="metric-label">${cost ? "HA cost state" : "Live sources"}</span>
                  <strong class="metric-value">${cost ? escapeHtml(displayValue(cost)) : escapeHtml(String(availableCount))}</strong>
                  <span class="metric-meta">${cost ? escapeHtml(friendlyName(cost)) : `${selectedStates.length} approved source${selectedStates.length === 1 ? "" : "s"}`}</span>
                </div>
              </div>
            </div>
            <div class="readings">
              <div class="section-head">
                <div>
                  <p class="section-label">Published Home Assistant states</p>
                  <h3 class="section-title">${availableCount} available source${availableCount === 1 ? "" : "s"}</h3>
                </div>
                <div class="timestamp">${escapeHtml(formattedUpdatedAt(selectedStates))}</div>
              </div>
              ${selectedStates.length ? `<div class="list">${selectedStates.map((entity) => `<article class="reading"><div class="reading-name">${escapeHtml(friendlyName(entity))}</div><div class="reading-value">${escapeHtml(displayValue(entity))}</div><span class="reading-meta">${escapeHtml(entity.entity_id)} · ${isAvailable(entity) ? "published by Home Assistant" : "currently unavailable"}</span></article>`).join("")}</div>` : `<div class="empty">No approved ${escapeHtml(selected.label.toLowerCase())} source is currently exposed to this panel. The panel does not infer or import a value from any other system.</div>`}
            </div>
          </section>
          <section class="coverage" aria-label="Live system coverage">
            ${coverage.map(({ system, count }) => `<div class="coverage-item"><span class="coverage-name">${escapeHtml(system.label)}</span><strong class="coverage-value">${count}</strong></div>`).join("")}
          </section>
          <footer>Data boundary: this local panel renders only the current Home Assistant entity states covered by its approved rules or explicit configuration. It never loads the Oriel investor site and contains no external token.</footer>
        </section>
      </main>
    `;

    this.shadowRoot.querySelectorAll("[data-system]").forEach((button) => {
      button.addEventListener("click", () => {
        this._selectedSystem = button.dataset.system;
        this.render();
      });
    });
  }
}

if (!customElements.get("oriel-panel")) {
  customElements.define("oriel-panel", OrielPanel);
}

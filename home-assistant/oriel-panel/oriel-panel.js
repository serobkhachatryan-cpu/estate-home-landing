/*
 * Oriel local Home Assistant panel.
 *
 * This is intentionally dependency-free: it is served from Home Assistant's
 * /config/www directory and receives the already-authorised `hass` object
 * from Home Assistant. It makes no external request and contains no token.
 */

const ORIEL_SYSTEMS = [
  {
    id: "power",
    label: "Power",
    description: "Backup power and UPS health",
    icon: "⚡",
    matches: /battery|ups|input_voltage|output_voltage|runtime|\bload\b/i,
  },
  {
    id: "electricity",
    label: "Electricity",
    description: "Grid load, phases and metered cost",
    icon: "ϟ",
    matches: /shelly|total.*power|phase.*(power|energy|cost)|\benergy\b|\bcost\b/i,
  },
  {
    id: "water",
    label: "Water",
    description: "House, lodge and main water supply",
    icon: "≈",
    matches: /water/i,
    exclude: /fuel|heating_tank/i,
  },
  {
    id: "fuel",
    label: "Fuel",
    description: "Heating and fuel tank levels",
    icon: "◒",
    matches: /fuel|heating_tank/i,
  },
  {
    id: "climate",
    label: "Climate",
    description: "Temperatures and environmental control",
    icon: "◌",
    matches: /temperature|humidity|climate|heating/i,
  },
  {
    id: "security",
    label: "Security",
    description: "Property protection sensors",
    icon: "◇",
    matches: /alarm|lock|door|window|gate|property.*motion/i,
  },
  {
    id: "network",
    label: "Network",
    description: "Estate connectivity and network equipment",
    icon: "⌁",
    matches: /starlink|router|network|internet|\bwan\b|unifi/i,
  },
];

const PROPERTY_SOURCE = /house|lodge|main|total|shelly|ups|battery|loft|basement|office|starlink|router|network|internet|heating|fuel/i;
const EXCLUDED_SOURCE = /iphone|ipad|tiart|phone|person|tracker/i;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function displayValue(state) {
  if (!state || state.state === "unknown" || state.state === "unavailable") {
    return "0";
  }

  const unit = state.attributes?.unit_of_measurement;
  return `${state.state}${unit ? ` ${unit}` : ""}`;
}

function isAvailable(state) {
  return state && !["unknown", "unavailable", "none"].includes(String(state.state).toLowerCase());
}

function updatedLabel(states) {
  const newest = states
    .map((state) => Date.parse(state.last_updated || state.last_changed || ""))
    .filter(Number.isFinite)
    .sort((a, b) => b - a)[0];

  if (!newest) return "Waiting for live state";
  return `Live sync · ${new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(newest))}`;
}

function friendlyName(entity) {
  return entity.attributes?.friendly_name || entity.entity_id.replace(/^[^.]+\./, "").replaceAll("_", " ");
}

function sourceMatches(system, entity) {
  const source = `${entity.entity_id} ${friendlyName(entity)} ${entity.attributes?.device_class || ""}`;
  return PROPERTY_SOURCE.test(source) && !EXCLUDED_SOURCE.test(source) && system.matches.test(source) && !(system.exclude && system.exclude.test(source));
}

function entityPriority(system, entity) {
  const source = `${entity.entity_id} ${friendlyName(entity)}`.toLowerCase();
  let priority = 0;
  if (source.includes("total")) priority += 30;
  if (source.includes("main")) priority += 20;
  if (entity.attributes?.device_class === "monetary") priority += 12;
  if (entity.attributes?.device_class === "power") priority += 10;
  if (isAvailable(entity)) priority += 5;
  if (system.id === "electricity" && source.includes("cost")) priority += 15;
  return priority;
}

class OrielPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._selectedSystem = "power";
    this._hass = null;
  }

  set hass(hass) {
    this._hass = hass;
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const states = this._hass ? Object.values(this._hass.states || {}) : [];
    const selected = ORIEL_SYSTEMS.find((system) => system.id === this._selectedSystem) || ORIEL_SYSTEMS[0];
    const selectedStates = states
      .filter((entity) => sourceMatches(selected, entity))
      .sort((a, b) => entityPriority(selected, b) - entityPriority(selected, a) || friendlyName(a).localeCompare(friendlyName(b)));
    const availableCount = selectedStates.filter(isAvailable).length;
    const primary = selectedStates.find(isAvailable) || selectedStates[0];
    const stateRows = selectedStates.slice(0, 18);
    const coverage = ORIEL_SYSTEMS.map((system) => ({
      system,
      count: states.filter((entity) => sourceMatches(system, entity) && isAvailable(entity)).length,
    }));

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; min-height: 100%; color: #15344a; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        * { box-sizing: border-box; }
        .page { min-height: 100vh; padding: 30px clamp(18px, 4vw, 66px) 54px; background: #e7e1d7; }
        .shell { max-width: 1420px; margin: 0 auto; border: 1px solid #d2c8b9; border-radius: 34px; padding: clamp(22px, 4vw, 52px); background: #f7f3eb; box-shadow: 0 18px 50px rgba(48, 37, 19, .08); }
        header { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; padding-bottom: 26px; border-bottom: 1px solid #d6cbbb; }
        .brand { font-size: 24px; font-weight: 750; letter-spacing: -.04em; }
        .eyebrow { margin: 0 0 8px; color: #907044; font-size: 12px; font-weight: 800; letter-spacing: .17em; text-transform: uppercase; }
        h1 { margin: 0; max-width: 760px; font-family: Georgia, "Times New Roman", serif; font-size: clamp(34px, 5vw, 66px); line-height: .97; letter-spacing: -.055em; }
        .live { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 9px; margin-top: 3px; padding: 11px 14px; border-radius: 999px; background: #e7eee5; color: #315039; font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: #5a8a5d; box-shadow: 0 0 0 4px rgba(90, 138, 93, .14); }
        .intro { margin: 23px 0 0; max-width: 760px; color: #5a6a75; font-size: 18px; line-height: 1.5; }
        .tabs { display: flex; gap: 8px; overflow-x: auto; padding: 26px 0 7px; scrollbar-width: thin; }
        button { appearance: none; cursor: pointer; font: inherit; }
        .tab { flex: 0 0 auto; border: 1px solid #d5cbbb; border-radius: 14px; padding: 12px 15px; color: #425664; background: #faf7f0; font-size: 14px; font-weight: 750; }
        .tab[aria-selected="true"] { border-color: #15344a; background: #15344a; color: #fffdf8; }
        .content { margin-top: 18px; border-radius: 28px; overflow: hidden; background: #102737; color: #f5f0e6; }
        .hero { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(260px, .8fr); gap: 24px; padding: clamp(24px, 4vw, 46px); border-bottom: 1px solid #d4c6ac; }
        .hero h2 { margin: 0; font-size: clamp(36px, 5vw, 68px); line-height: 1; letter-spacing: -.055em; }
        .system-copy { margin: 8px 0 0; color: #afbbc2; font-size: 18px; }
        .summary { align-self: end; border: 1px solid rgba(224, 204, 166, .25); border-radius: 18px; padding: 18px; background: rgba(255,255,255,.06); }
        .summary-label, .section-label, .system-label { color: #d9b46e; font-size: 12px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
        .summary-value { display: block; overflow-wrap: anywhere; margin-top: 8px; font-size: clamp(24px, 3vw, 40px); font-weight: 760; letter-spacing: -.04em; }
        .summary-meta { display: block; margin-top: 8px; color: #9aabb6; font-size: 14px; }
        .readings { padding: clamp(24px, 3vw, 38px); }
        .section-head { display: flex; justify-content: space-between; gap: 16px; align-items: baseline; margin-bottom: 17px; }
        .section-title { margin: 0; font-size: 24px; letter-spacing: -.035em; }
        .timestamp { color: #9aabb6; font-size: 14px; text-align: right; }
        .list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        .reading { min-height: 128px; padding: 17px; border: 1px solid rgba(224, 204, 166, .2); border-radius: 16px; background: rgba(255,255,255,.045); }
        .reading-name { color: #b8c3c7; font-size: 14px; line-height: 1.35; }
        .reading-value { margin-top: 20px; color: #fffdf8; font-size: 25px; font-weight: 760; letter-spacing: -.04em; overflow-wrap: anywhere; }
        .reading-id { display: block; margin-top: 8px; color: #718590; font-size: 11px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .empty { padding: 28px; border: 1px dashed rgba(224,204,166,.35); border-radius: 16px; color: #b7c4c9; }
        .coverage { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); gap: 8px; margin-top: 26px; }
        .coverage-item { min-width: 0; padding: 13px; border: 1px solid #d5cbbb; border-radius: 14px; background: #fbf8f2; }
        .coverage-name { display: block; color: #63717a; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .coverage-value { display: block; margin-top: 6px; font-size: 20px; font-weight: 750; letter-spacing: -.04em; }
        footer { margin-top: 25px; color: #6f7e87; font-size: 13px; line-height: 1.5; }
        @media (max-width: 900px) { .hero { grid-template-columns: 1fr; } .list { grid-template-columns: repeat(2, minmax(0, 1fr)); } .coverage { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        @media (max-width: 560px) { .page { padding: 0; } .shell { border: 0; border-radius: 0; min-height: 100vh; padding: 24px 16px 35px; } header { display: block; } .live { margin-top: 20px; } .intro { font-size: 16px; } .list { grid-template-columns: 1fr; } .coverage { grid-template-columns: repeat(2, minmax(0, 1fr)); } .section-head { display: block; } .timestamp { margin-top: 8px; text-align: left; } }
      </style>
      <main class="page">
        <section class="shell">
          <header>
            <div>
              <div class="brand">Oriel</div>
              <p class="eyebrow">Home Assistant · local operations</p>
              <h1>Estate systems, in their real state.</h1>
              <p class="intro">A local Oriel workspace powered directly by this Home Assistant session. No W3DS login, external dashboard, token, or telemetry relay is involved.</p>
            </div>
            <div class="live"><span class="dot"></span>Live from Home Assistant</div>
          </header>
          <nav class="tabs" aria-label="Oriel systems">
            ${ORIEL_SYSTEMS.map((system) => `<button class="tab" data-system="${system.id}" aria-selected="${system.id === selected.id}">${system.icon} ${system.label}</button>`).join("")}
          </nav>
          <section class="content" aria-live="polite">
            <div class="hero">
              <div>
                <p class="system-label">Selected system</p>
                <h2>${escapeHtml(selected.label)}</h2>
                <p class="system-copy">${escapeHtml(selected.description)}</p>
              </div>
              <div class="summary">
                <span class="summary-label">Primary live reading</span>
                <strong class="summary-value">${escapeHtml(displayValue(primary))}</strong>
                <span class="summary-meta">${primary ? escapeHtml(friendlyName(primary)) : "No approved source"}</span>
              </div>
            </div>
            <div class="readings">
              <div class="section-head">
                <div>
                  <p class="section-label">Live readings</p>
                  <h3 class="section-title">${availableCount} active source${availableCount === 1 ? "" : "s"}</h3>
                </div>
                <div class="timestamp">${escapeHtml(updatedLabel(selectedStates))}</div>
              </div>
              ${stateRows.length ? `<div class="list">${stateRows.map((entity) => `<article class="reading"><div class="reading-name">${escapeHtml(friendlyName(entity))}</div><div class="reading-value">${escapeHtml(displayValue(entity))}</div><span class="reading-id">${escapeHtml(entity.entity_id)}</span></article>`).join("")}</div>` : `<div class="empty">No matching live sources are currently exposed for ${escapeHtml(selected.label)}. The display intentionally shows no invented values.</div>`}
            </div>
          </section>
          <section class="coverage" aria-label="Live system coverage">
            ${coverage.map(({ system, count }) => `<div class="coverage-item"><span class="coverage-name">${system.label}</span><strong class="coverage-value">${count}</strong></div>`).join("")}
          </section>
          <footer>Live values are read inside Home Assistant from the signed-in user’s authorised entity state. Historical charts and financial records remain the next implementation phase.</footer>
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

customElements.define("oriel-panel", OrielPanel);

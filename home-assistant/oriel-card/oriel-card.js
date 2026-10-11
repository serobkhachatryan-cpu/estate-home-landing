/*
 * Oriel Lovelace card — a read-only companion to the full Oriel panel.
 * Add as `type: custom:oriel-card` to any Home Assistant dashboard.
 * No network calls, storage, token or HA service calls are used.
 */

const UTILITY_SYSTEMS = [
  { id: "electricity", label: "Electricity", icon: "ϟ", unit: "kWh" },
  { id: "water", label: "Water", icon: "≈", unit: "L" },
  { id: "fuel", label: "Fuel", icon: "◒", unit: "L" },
  { id: "power", label: "Power", icon: "⚡", unit: "" },
];

const INVENTORY_SYSTEMS = [
  ...UTILITY_SYSTEMS,
  { id: "climate", label: "Climate & weather", icon: "◌", unit: "" },
  { id: "security", label: "Security & video", icon: "◇", unit: "" },
  { id: "network", label: "Network & PoE", icon: "⌁", unit: "" },
  { id: "other", label: "Other sensors", icon: "·", unit: "" },
];

const rules = {
  electricity: /(?:shelly|total(?:_l[123])?_power|plug_1_(?:energy|power)|energy_cost)/i,
  water: /(?:water|irrigation|outdoor_pool|tank)/i,
  fuel: /(?:fuel|genset)/i,
  power: /(?:battery|ups|input_voltage|output_voltage|(?:^|_)load$|total_l[123]_power|total_power)/i,
  climate: /(?:temperature|humidity|illuminance|pressure|rain|wind|uv|solar|dewpoint)/i,
  security: /(?:nvr|camera|cam_|disk_write|storage_|recording|intercom|gates_)/i,
  network: /(?:cpu_usage|memory_usage|device_status|poe_power|starlink|wifi|switch|gateway|_ap_)/i,
};

const esc = (value) => String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
const attrs = (entity) => entity && entity.attributes && typeof entity.attributes === "object" ? entity.attributes : {};
const name = (entity) => attrs(entity).friendly_name || entity.entity_id.replace(/^.*?\./, "").replace(/_/g, " ");
const available = (entity) => !["", "unknown", "unavailable", "none"].includes(String(entity && entity.state || "").toLowerCase());
const value = (entity) => Number.parseFloat(String(entity && entity.state || ""));
const money = (entity) => attrs(entity).device_class === "monetary" || /^(GBP|£)$/i.test(String(attrs(entity).unit_of_measurement || ""));
const format = (raw, unit = "", isMoney = false) => {
  if (!Number.isFinite(raw)) return "No data";
  if (isMoney) return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 }).format(raw);
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: Math.abs(raw) >= 100 ? 1 : 2 }).format(raw) + (unit ? ` ${unit}` : "");
};
const display = (entity) => !entity ? "No source" : !available(entity) ? "Unavailable" : format(value(entity), attrs(entity).unit_of_measurement || "", money(entity));
const exactIds = (config, system) => Array.isArray(config.entity_ids && config.entity_ids[system]) ? config.entity_ids[system] : null;
const categoryId = (id) => {
  const source = String(id).toLowerCase();
  if (rules.water.test(source)) return "water";
  if (rules.fuel.test(source)) return "fuel";
  if (rules.power.test(source)) return "power";
  if (rules.electricity.test(source)) return "electricity";
  if (rules.climate.test(source)) return "climate";
  if (rules.security.test(source)) return "security";
  if (rules.network.test(source)) return "network";
  return "other";
};
const category = (id) => (INVENTORY_SYSTEMS.find((system) => system.id === categoryId(id)) || INVENTORY_SYSTEMS.at(-1)).label;

class OrielCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._selected = "electricity";
    this._expanded = false;
    this._hass = null;
    this._config = {};
  }

  setConfig(config) {
    if (!config || typeof config !== "object") throw new Error("Oriel card requires a configuration object");
    this._config = config;
    this.render();
  }

  set hass(hass) { this._hass = hass; this.render(); }

  getCardSize() { return this._expanded ? 18 : 8; }

  systems() {
    const custom = Array.isArray(this._config.sensor_groups) ? this._config.sensor_groups
      .filter((group) => group && typeof group.id === "string" && typeof group.label === "string")
      .map((group) => ({ id: group.id, label: group.label, icon: group.icon || "·", unit: group.unit || "", entity_ids: Array.isArray(group.entity_ids) ? group.entity_ids : [] })) : [];
    if (custom.length) return custom;
    return this._config.inventory_mode === "all_sensors" ? INVENTORY_SYSTEMS : UTILITY_SYSTEMS;
  }

  sources(system) {
    const stateMap = this._hass && this._hass.states || {};
    const exact = system.entity_ids && system.entity_ids.length ? system.entity_ids : exactIds(this._config, system.id);
    return Object.values(stateMap).filter((entity) => {
      if (!/^sensor\./i.test(entity.entity_id)) return false;
      if (exact) return exact.includes(entity.entity_id);
      if (this._config.inventory_mode === "all_sensors") return categoryId(entity.entity_id) === system.id;
      return rules[system.id] && rules[system.id].test(entity.entity_id);
    }).sort((a, b) => name(a).localeCompare(name(b)));
  }

  render() {
    const systems = this.systems();
    const system = systems.find((item) => item.id === this._selected) || systems[0];
    this._selected = system.id;
    const sources = this.sources(system);
    const primary = sources.find(available) || sources[0];
    const cost = sources.find(money) || sources.find((entity) => /cost/i.test(entity.entity_id));
    const weekly = Array.isArray(this._config.archive_weekly_values && this._config.archive_weekly_values[system.id])
      ? this._config.archive_weekly_values[system.id] : [];
    const weeklyCosts = Array.isArray(this._config.archive_weekly_costs && this._config.archive_weekly_costs[system.id])
      ? this._config.archive_weekly_costs[system.id] : [];
    const max = Math.max(1, ...weekly.filter(Number.isFinite));
    const allSensors = this._config.inventory_mode === "all_sensors"
      ? Object.values(this._hass && this._hass.states || {}).filter((entity) => /^sensor\./i.test(entity.entity_id)) : [];
    const groups = allSensors.reduce((result, entity) => {
      const key = category(entity.entity_id); (result[key] ||= []).push(entity); return result;
    }, {});
    const latest = weekly[0];
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; color:#173448; font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif; }
        * { box-sizing:border-box; } .card { overflow:hidden; border-radius:22px; background:#f8f4ec; box-shadow:0 8px 24px rgba(35,29,18,.13); }
        header { display:flex; justify-content:space-between; gap:12px; padding:19px 20px 15px; border-bottom:1px solid #ded4c4; } .brand{font-weight:800;font-size:21px;letter-spacing:-.04em}.sub{margin-top:3px;color:#72808a;font-size:12px}.state{align-self:start;padding:7px 9px;border-radius:99px;background:#e6efe5;color:#35573a;font-size:10px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}.dot{display:inline-block;width:7px;height:7px;margin-right:5px;border-radius:50%;background:#58905e}
        .tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;padding:12px 12px 0}.tab{border:1px solid #dbd0c1;border-radius:10px;background:#fffdf8;color:#52636d;padding:9px 4px;font:700 12px inherit;cursor:pointer}.tab[aria-selected="true"]{border-color:#173448;background:#173448;color:#fffdf8}
        .main{margin:12px;background:#102737;color:#f8f3e9;border-radius:17px;overflow:hidden}.hero{display:grid;grid-template-columns:1fr auto;gap:10px;padding:18px}.eyebrow{margin:0;color:#dbb56e;font-size:10px;font-weight:800;letter-spacing:.15em;text-transform:uppercase}.hero h2{margin:6px 0 0;font-size:29px;letter-spacing:-.05em}.metric{align-self:end;text-align:right}.metric strong{display:block;margin-top:6px;font-size:22px;letter-spacing:-.05em}.metric span{color:#9eafb7;font-size:10px}.timeline{padding:0 18px 18px}.week{display:grid;grid-template-columns:72px 1fr 76px;gap:8px;align-items:center;padding:7px 0;color:#c4d0d3;font-size:11px}.track{height:10px;border-radius:99px;background:#233d4e;overflow:hidden}.bar{height:100%;border-radius:inherit;background:linear-gradient(90deg,#829b9c,#cad4bd)}.week strong{text-align:right;color:#fffdf8;font-size:11px}.cost{display:block;margin-top:2px;color:#dcb76f;font-size:9px}.empty{padding:16px;color:#a9b7bd;font-size:12px;line-height:1.45}
        .sources{padding:5px 20px 20px}.heading{display:flex;justify-content:space-between;align-items:baseline;gap:10px}.heading h3{margin:12px 0 8px;font-size:16px;letter-spacing:-.03em}.heading span{color:#7a898f;font-size:11px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.source{padding:10px;border:1px solid #ddd2c1;border-radius:12px;background:#fffdf8;min-width:0}.source b{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px}.source span{display:block;margin-top:4px;color:#8c744b;font-size:10px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.source small{display:block;margin-top:5px;color:#71808a;font-size:9px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        details{margin:0 20px 20px;border:1px solid #ddd2c1;border-radius:12px;background:#fffdf8;overflow:hidden}summary{cursor:pointer;padding:12px;font-size:13px;font-weight:800}.catalog{padding:0 12px 12px}.catalog h4{margin:14px 0 7px;color:#8c7040;font-size:10px;letter-spacing:.12em;text-transform:uppercase}.catalog .grid{grid-template-columns:repeat(3,minmax(0,1fr))}.note{padding:0 20px 18px;color:#74838a;font-size:10px;line-height:1.45}@media(max-width:420px){.tab{font-size:10px}.grid,.catalog .grid{grid-template-columns:1fr}.week{grid-template-columns:65px 1fr 70px}}
      </style>
      <article class="card">
        <header><div><div class="brand">Oriel</div><div class="sub">Aldworth · Home Assistant card</div></div><div class="state"><i class="dot"></i>read only</div></header>
        <nav class="tabs" aria-label="Oriel systems">${systems.map((item) => `<button class="tab" data-system="${item.id}" aria-selected="${item.id === system.id}">${item.icon} ${item.label}</button>`).join("")}</nav>
        <section class="main"><div class="hero"><div><p class="eyebrow">Current system</p><h2>${esc(system.label)}</h2></div><div class="metric"><span>${cost ? "Published cost" : "Live source"}</span><strong>${esc(cost ? display(cost) : display(primary))}</strong></div></div>${weekly.length ? `<div class="timeline"><p class="eyebrow">Recorded weeks</p>${weekly.map((raw, index) => { const number = Number(raw); const ratio = Number.isFinite(number) ? Math.max(3, Math.round(number / max * 100)) : 0; return `<div class="week"><span>${index === 0 ? "Latest" : `${index} wk ago`}</span><span class="track"><i class="bar" style="width:${ratio}%"></i></span><strong>${esc(format(number, system.unit))}${Number.isFinite(Number(weeklyCosts[index])) ? `<small class="cost">${esc(format(Number(weeklyCosts[index]), "GBP", true))}</small>` : ""}</strong></div>`; }).join("")}</div>` : `<div class="empty">No imported weekly record is configured for this system. Live source states remain visible below.</div>`}</section>
        <section class="sources"><div class="heading"><h3>Current sources</h3><span>${sources.filter(available).length}/${sources.length} available</span></div><div class="grid">${sources.length ? sources.map((entity) => `<div class="source"><b title="${esc(name(entity))}">${esc(name(entity))}</b><span>${esc(display(entity))}</span><small>${esc(entity.entity_id)}</small></div>`).join("") : `<div class="empty">No approved source in this system.</div>`}</div></section>
        ${allSensors.length ? `<details ${this._expanded ? "open" : ""}><summary>All approved Aldworth sensors · ${allSensors.filter(available).length}/${allSensors.length} available</summary><div class="catalog">${Object.entries(groups).sort(([a],[b]) => a.localeCompare(b)).map(([label, entries]) => `<h4>${esc(label)} · ${entries.length}</h4><div class="grid">${entries.sort((a,b) => name(a).localeCompare(name(b))).map((entity) => `<div class="source"><b title="${esc(name(entity))}">${esc(name(entity))}</b><span>${esc(display(entity))}</span><small>${esc(entity.entity_id)}</small></div>`).join("")}</div>`).join("")}</div></details>` : ""}
        <div class="note">Oriel reads Home Assistant states already present in this signed-in dashboard. It has no control buttons, external requests, tokens or service calls.</div>
      </article>`;
    this.shadowRoot.querySelectorAll("[data-system]").forEach((button) => button.addEventListener("click", () => { this._selected = button.dataset.system; this.render(); }));
    const details = this.shadowRoot.querySelector("details");
    if (details) details.addEventListener("toggle", () => { this._expanded = details.open; });
  }
}

if (!customElements.get("oriel-card")) customElements.define("oriel-card", OrielCard);

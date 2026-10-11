/*
 * Oriel local Home Assistant panel.
 *
 * The panel is intentionally read-only. It renders approved current states from
 * hass.states and, where the signed-in Home Assistant session exposes it,
 * requests a six-week Recorder history for one already-approved entity through
 * the Home Assistant websocket. It never fetches an external URL, stores a
 * token, calls a Home Assistant service, or loads the public investor site.
 */

const ORIEL_SYSTEMS = [
  {
    id: "electricity",
    label: "Electricity",
    icon: "ϟ",
    description: "Metered electrical load, energy and published cost states.",
    primary: /^sensor\.total_power$/i,
    historyLabel: "Recorded use",
  },
  {
    id: "water",
    label: "Water",
    icon: "≈",
    description: "Approved house, main and lodge water flow and volume states.",
    primary: /^sensor\.main_water_total_l$/i,
    historyLabel: "Recorded use",
  },
  {
    id: "fuel",
    label: "Fuel",
    icon: "◒",
    description: "Approved fuel-tank level and volume states.",
    primary: /^sensor\.house_fuel_tank_\d+_volume$/i,
    historyLabel: "Recorded level",
  },
  {
    id: "power",
    label: "Power",
    icon: "⚡",
    description: "Approved UPS and backup-power states.",
    primary: /battery/i,
    historyLabel: "Recorded state",
  },
];

/*
 * These are the only Aldworth source patterns included by default. For a
 * production deployment, replace each group with exact entity IDs in
 * panel_custom.config.entity_ids.
 */
const DEFAULT_ENTITY_RULES = {
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
  power: [
    /^sensor\.(?:office|lodge|basement|loft).*ups.*$/i,
    /^sensor\.(?:office|lodge|basement|loft).*battery.*$/i,
  ],
};

const HISTORY_WEEKS = 6;

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function attributes(entity) {
  return entity && entity.attributes && typeof entity.attributes === "object" ? entity.attributes : {};
}

function friendlyName(entity) {
  const name = attributes(entity).friendly_name;
  return name || entity.entity_id.replace(/^[^.]+\./, "").replace(/_/g, " ");
}

function isAvailable(entity) {
  const state = String(entity && entity.state != null ? entity.state : "").toLowerCase();
  return !["", "unknown", "unavailable", "none"].includes(state);
}

function numericState(entity) {
  const parsed = Number.parseFloat(String(entity && entity.state != null ? entity.state : ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function isMonetary(entity) {
  const unit = String(attributes(entity).unit_of_measurement || "").toUpperCase();
  return attributes(entity).device_class === "monetary" || unit === "GBP" || unit === "£";
}

function displayNumber(value, unit, monetary) {
  if (value == null || !Number.isFinite(value)) return "No recorded data";
  if (monetary) {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: 2,
    }).format(value);
  }
  const decimals = Math.abs(value) >= 100 ? 1 : 2;
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: decimals }).format(value) + (unit ? " " + unit : "");
}

function displayValue(entity) {
  if (!entity) return "No approved source";
  if (!isAvailable(entity)) return "Unavailable";
  return displayNumber(
    numericState(entity),
    String(attributes(entity).unit_of_measurement || "").trim(),
    isMonetary(entity),
  );
}

function updatedAt(entity) {
  const value = Date.parse((entity && (entity.last_updated || entity.last_changed)) || "");
  return Number.isFinite(value) ? value : null;
}

function formattedUpdatedAt(entities) {
  const timestamps = entities.map(updatedAt).filter((value) => value !== null);
  if (!timestamps.length) return "No timestamp published";
  const newest = Math.max(...timestamps);
  return "Latest approved source update - " + new Intl.DateTimeFormat("en-GB", {
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
  const candidate = panel && panel.config && panel.config.entity_ids && panel.config.entity_ids[systemId];
  if (!Array.isArray(candidate)) return null;
  return candidate.filter(validEntityId);
}

function configuredArchiveHistory(panel, entityId) {
  const candidate = panel && panel.config && panel.config.archive_history && panel.config.archive_history[entityId];
  if (!Array.isArray(candidate)) return null;
  return candidate
    .filter((point) => point && Number.isFinite(Number.parseFloat(point.state)) && timestampOfHistoryState(point) !== null)
    .map((point) => ({ state: String(point.state), last_updated: point.last_updated }));
}

function configuredArchiveWeeklyValues(panel, systemId) {
  const candidate = panel && panel.config && panel.config.archive_weekly_values && panel.config.archive_weekly_values[systemId];
  if (!Array.isArray(candidate)) return null;
  return candidate.map((value) => Number.parseFloat(value));
}

function configuredArchiveWeeklyCosts(panel, systemId) {
  const candidate = panel && panel.config && panel.config.archive_weekly_costs && panel.config.archive_weekly_costs[systemId];
  if (!Array.isArray(candidate)) return null;
  return candidate.map((value) => Number.parseFloat(value));
}

function configuredSourceDetails(panel, systemId) {
  const candidate = panel && panel.config && panel.config.source_details && panel.config.source_details[systemId];
  return Array.isArray(candidate) ? candidate.filter((item) => item && typeof item === "object") : [];
}

function inventoryMode(panel) {
  return panel && panel.config && panel.config.inventory_mode === "all_sensors";
}

/*
 * Aldworth deliberately keeps the Revolut-style weekly navigation focused on
 * the four utility systems.  The full estate catalogue remains available on
 * the same screen below it.  This classifier is only a presentation aid: it
 * never creates entities or values, and an administrator can still use an
 * exact entity_ids allow-list instead.
 */
function aldworthCategory(entityId) {
  const id = String(entityId || "").toLowerCase();
  if (/(?:water|irrigation|outdoor_pool|tank)/.test(id)) return "water";
  if (/(?:fuel|genset)/.test(id)) return "fuel";
  if (/(?:battery|ups|input_voltage|output_voltage|(?:^|_)load$|total_l[123]_power|total_power)/.test(id)) return "power";
  if (/(?:shelly|plug_1_(?:energy|power)|energy_cost)/.test(id)) return "electricity";
  if (/(?:temperature|humidity|illuminance|pressure|rain|wind|uv|solar|dewpoint)/.test(id)) return "climate";
  if (/(?:nvr|camera|cam_|disk_write|storage_|recording|intercom|gates_)/.test(id)) return "security";
  if (/(?:cpu_usage|memory_usage|device_status|poe_power|starlink|wifi|switch|gateway|_ap_)/.test(id)) return "network";
  return "other";
}

function categoryLabel(category) {
  return ({
    electricity: "Electricity", water: "Water", fuel: "Fuel", power: "Backup power",
    climate: "Climate & weather", security: "Security & video", network: "Network & PoE", other: "Other estate sensors",
  })[category] || "Other estate sensors";
}

function belongsToSystem(system, entity, panel) {
  if (inventoryMode(panel)) return aldworthCategory(entity.entity_id) === system.id;
  const configured = configuredEntityIds(panel, system.id);
  if (configured) return configured.includes(entity.entity_id);
  return (DEFAULT_ENTITY_RULES[system.id] || []).some((rule) => rule.test(entity.entity_id));
}

function approvedInventoryEntities(states, panel) {
  if (inventoryMode(panel)) return states.filter((entity) => /^sensor\./i.test(entity.entity_id));
  const explicit = ORIEL_SYSTEMS.flatMap((system) => configuredEntityIds(panel, system.id) || []);
  if (explicit.length) return states.filter((entity) => explicit.includes(entity.entity_id));
  return states.filter((entity) => ORIEL_SYSTEMS.some((system) => belongsToSystem(system, entity, panel)));
}

function inventoryGroups(entities) {
  const groups = new Map();
  entities.forEach((entity) => {
    const category = aldworthCategory(entity.entity_id);
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(entity);
  });
  return [...groups.entries()]
    .sort(([a], [b]) => categoryLabel(a).localeCompare(categoryLabel(b)))
    .map(([category, entries]) => ({
      category,
      label: categoryLabel(category),
      entries: entries.slice().sort((a, b) => friendlyName(a).localeCompare(friendlyName(b))),
    }));
}

function entityPriority(system, entity) {
  let priority = isAvailable(entity) ? 100 : 0;
  const source = entity.entity_id + " " + friendlyName(entity);
  if (system.primary.test(entity.entity_id) || system.primary.test(source)) priority += 100;
  if (system.id === "electricity" && attributes(entity).device_class === "energy") priority += 60;
  if (system.id === "water" && /(?:total_l|total|volume)/i.test(entity.entity_id)) priority += 60;
  if (system.id === "fuel" && /_volume$/i.test(entity.entity_id)) priority += 60;
  if (system.id === "power" && /battery/i.test(source)) priority += 40;
  if (isMonetary(entity)) priority -= 25;
  if (/total/i.test(source)) priority += 8;
  if (/main/i.test(source)) priority += 5;
  return priority;
}

function historySource(system, entities) {
  return entities
    .filter((entity) => !isMonetary(entity))
    .slice()
    .sort((a, b) => entityPriority(system, b) - entityPriority(system, a))[0] || null;
}

function costState(entities) {
  return entities.find(isMonetary) || entities.find((entity) => /(?:energy_)?cost/i.test(entity.entity_id)) || null;
}

function mondayAtStart(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  const day = value.getDay();
  value.setDate(value.getDate() - (day === 0 ? 6 : day - 1));
  return value;
}

function historyAnchor(panel) {
  const configured = panel && panel.config && panel.config.history_anchor;
  const parsed = configured ? new Date(configured) : null;
  return parsed && Number.isFinite(parsed.getTime()) ? parsed : new Date();
}

function weekRange(index, anchor = new Date()) {
  const endOfCurrentWeek = new Date(mondayAtStart(anchor));
  endOfCurrentWeek.setDate(endOfCurrentWeek.getDate() + 7);
  const start = new Date(endOfCurrentWeek);
  start.setDate(start.getDate() - (index + 1) * 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return { start, end, isCurrent: index === 0 };
}

function dateLabel(range) {
  const format = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
  const end = new Date(range.end);
  end.setDate(end.getDate() - 1);
  return format.format(range.start) + " - " + format.format(end);
}

function timestampOfHistoryState(state) {
  const value = Date.parse(state && (state.last_updated || state.last_changed || state.lu || ""));
  return Number.isFinite(value) ? value : null;
}

function normaliseHistoryResponse(response, entityId) {
  if (!response) return [];
  if (Array.isArray(response)) return Array.isArray(response[0]) ? response[0] : response;
  return Array.isArray(response[entityId]) ? response[entityId] : [];
}

function isCumulative(entity) {
  const deviceClass = String(attributes(entity).device_class || "").toLowerCase();
  return deviceClass === "energy" || /(?:total_l|_energy$|_energy_)/i.test(entity.entity_id);
}

function weeklyRecord(range, history, source) {
  const points = history
    .map((state) => ({ timestamp: timestampOfHistoryState(state), value: Number.parseFloat(state && state.state) }))
    .filter((point) => point.timestamp !== null && Number.isFinite(point.value))
    .filter((point) => point.timestamp >= range.start.getTime() && point.timestamp < range.end.getTime())
    .sort((a, b) => a.timestamp - b.timestamp);
  if (!points.length) return { ...range, value: null, points: 0 };
  const value = isCumulative(source) && points.length > 1
    ? Math.max(0, points[points.length - 1].value - points[0].value)
    : points[points.length - 1].value;
  return { ...range, value, points: points.length };
}

class OrielPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._selectedSystem = "electricity";
    this._selectedWeek = 0;
    this._hass = null;
    this._panel = null;
    this._renderQueued = false;
    this._history = new Map();
    this._historyLoading = new Set();
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

  requestApprovedHistory(entity) {
    if (!entity || !this._hass) return;
    const key = entity.entity_id;
    if (this._history.has(key) || this._historyLoading.has(key)) return;
    const importedHistory = configuredArchiveHistory(this._panel, key);
    if (importedHistory) {
      this._history.set(key, importedHistory);
      this.render();
      return;
    }
    if (typeof this._hass.callWS !== "function") return;
    const anchor = historyAnchor(this._panel);
    const oldest = weekRange(HISTORY_WEEKS - 1, anchor).start;
    this._historyLoading.add(key);
    this._hass.callWS({
      type: "history/history_during_period",
      start_time: oldest.toISOString(),
      end_time: anchor.toISOString(),
      entity_ids: [key],
      minimal_response: true,
      no_attributes: true,
    }).then((response) => {
      this._history.set(key, normaliseHistoryResponse(response, key));
    }).catch(() => {
      this._history.set(key, []);
    }).finally(() => {
      this._historyLoading.delete(key);
      this.render();
    });
  }

  render() {
    const stateMap = this._hass && this._hass.states ? this._hass.states : {};
    const states = Object.keys(stateMap).map((key) => stateMap[key]);
    const selected = ORIEL_SYSTEMS.find((system) => system.id === this._selectedSystem) || ORIEL_SYSTEMS[0];
    const archiveMode = Boolean(this._panel && this._panel.config && this._panel.config.history_anchor);
    const selectedStates = states
      .filter((entity) => belongsToSystem(selected, entity, this._panel))
      .sort((a, b) => entityPriority(selected, b) - entityPriority(selected, a) || friendlyName(a).localeCompare(friendlyName(b)));
    const approvedInventory = approvedInventoryEntities(states, this._panel);
    const approvedGroups = inventoryGroups(approvedInventory);
    const primary = selectedStates.find(isAvailable) || selectedStates[0] || null;
    const source = historySource(selected, selectedStates);
    const cost = costState(selectedStates);
    const availableCount = selectedStates.filter(isAvailable).length;
    const history = source ? this._history.get(source.entity_id) || [] : [];
    const historyLoading = source ? this._historyLoading.has(source.entity_id) : false;
    const anchor = historyAnchor(this._panel);
    const archiveWeeklyValues = configuredArchiveWeeklyValues(this._panel, selected.id);
    const archiveWeeklyCosts = configuredArchiveWeeklyCosts(this._panel, selected.id);
    const weeks = Array.from({ length: HISTORY_WEEKS }, (_, index) => {
      const record = weeklyRecord(weekRange(index, anchor), history, source);
      const configuredValue = archiveWeeklyValues && archiveWeeklyValues[index];
      const configuredCost = archiveWeeklyCosts && archiveWeeklyCosts[index];
      const withCost = Number.isFinite(configuredCost) ? { ...record, cost: configuredCost } : record;
      return Number.isFinite(configuredValue) ? { ...withCost, value: configuredValue, points: 2, imported: true } : withCost;
    });
    const selectedWeek = weeks[Math.min(this._selectedWeek, weeks.length - 1)] || weeks[0];
    const weeklyValues = weeks.map((week) => week.value).filter((value) => value !== null && value > 0);
    const maximum = weeklyValues.length ? Math.max(...weeklyValues) : 1;
    const sourceUnit = source ? String(attributes(source).unit_of_measurement || "").trim() : "";
    const sourceDetails = configuredSourceDetails(this._panel, selected.id);
    const currentWeekValue = selectedWeek && selectedWeek.value !== null
      ? displayNumber(selectedWeek.value, sourceUnit, false)
      : historyLoading ? "Loading" : "No recorded data";
    const coverage = ORIEL_SYSTEMS.map((system) => ({
      system,
      count: states.filter((entity) => belongsToSystem(system, entity, this._panel) && isAvailable(entity)).length,
    }));
    const inventoryDescription = inventoryMode(this._panel)
      ? `${approvedInventory.length} approved Aldworth sensor${approvedInventory.length === 1 ? "" : "s"} are organised below by source system.`
      : "The administrator has restricted this view to an explicit approved entity allow-list.";

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; min-height: 100%; color: #16344a; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        * { box-sizing: border-box; }
        .page { min-height: 100vh; padding: 30px clamp(18px, 4vw, 66px) 54px; background: #e8e2d8; }
        .shell { max-width: 1120px; margin: 0 auto; border: 1px solid #d4cabb; border-radius: 34px; padding: clamp(22px, 4vw, 50px); background: #f8f4ec; box-shadow: 0 18px 50px rgba(48, 37, 19, .08); }
        header { display: flex; align-items: flex-start; justify-content: space-between; gap: 18px; padding-bottom: 24px; border-bottom: 1px solid #d7cdbc; }
        .brand { color: #16344a; font-size: 24px; font-weight: 760; letter-spacing: -.04em; }
        .eyebrow, .metric-label, .timeline-label, .source-label { margin: 0; color: #947343; font-size: 12px; font-weight: 800; letter-spacing: .16em; text-transform: uppercase; }
        h1 { margin: 12px 0 0; max-width: 680px; font-family: Georgia, "Times New Roman", serif; font-size: clamp(33px, 5vw, 62px); line-height: .98; letter-spacing: -.055em; }
        .intro { max-width: 700px; margin: 17px 0 0; color: #5a6c77; font-size: 17px; line-height: 1.55; }
        .live { flex: 0 0 auto; display: inline-flex; align-items: center; gap: 9px; padding: 10px 13px; border-radius: 999px; background: #e8efe5; color: #315039; font-size: 12px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
        .dot { width: 8px; height: 8px; border-radius: 50%; background: #5a8a5d; box-shadow: 0 0 0 4px rgba(90,138,93,.13); }
        .tabs { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; padding: 24px 0 8px; }
        button { appearance: none; cursor: pointer; font: inherit; }
        .tab { min-width: 0; border: 1px solid #d8cdbd; border-radius: 15px; padding: 13px 11px; color: #425664; background: #fcf9f3; font-size: 14px; font-weight: 760; }
        .tab[aria-selected="true"] { border-color: #153447; background: #153447; color: #fffdf8; }
        .timeline-shell { margin-top: 17px; overflow: hidden; border-radius: 28px; background: #102737; color: #f8f3e9; }
        .hero { display: grid; grid-template-columns: minmax(0, 1.04fr) minmax(250px, .96fr); gap: 22px; padding: clamp(23px, 4vw, 42px); border-bottom: 1px solid rgba(222,197,150,.75); }
        .hero h2 { margin: 7px 0 0; font-size: clamp(38px, 6vw, 66px); line-height: .95; letter-spacing: -.06em; }
        .system-copy { margin: 10px 0 0; color: #adbbc1; font-size: 16px; line-height: 1.45; }
        .summary { align-self: end; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .metric { min-height: 132px; padding: 16px; border: 1px solid rgba(222,197,150,.24); border-radius: 17px; background: rgba(255,255,255,.055); }
        .metric-label { color: #d9b46e; font-size: 10px; }
        .metric-value { display: block; overflow-wrap: anywhere; margin-top: 12px; color: #fffdf8; font-size: clamp(22px, 3vw, 34px); font-weight: 780; letter-spacing: -.045em; }
        .metric-meta { display: block; margin-top: 8px; color: #96a9b3; font-size: 12px; line-height: 1.35; }
        .record { padding: clamp(24px, 4vw, 42px); }
        .record-heading { display: flex; align-items: end; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
        .record-heading h3 { margin: 7px 0 0; color: #fffdf8; font-size: 25px; letter-spacing: -.035em; }
        .freshness { max-width: 300px; color: #98aab4; font-size: 12px; line-height: 1.45; text-align: right; }
        .week-list { position: relative; display: grid; gap: 3px; padding: 3px 0 4px; }
        .week-list::before { content: ""; position: absolute; top: 17px; bottom: 17px; left: 13px; width: 1px; background: rgba(220,193,142,.48); }
        .week { position: relative; display: grid; grid-template-columns: 148px minmax(76px, 1fr) 118px; gap: 16px; align-items: center; width: 100%; min-height: 60px; padding: 10px 12px 10px 0; border: 0; border-radius: 13px; color: #d5dfe2; background: transparent; text-align: left; }
        .week:hover, .week[aria-current="true"] { background: rgba(255,255,255,.09); }
        .week[aria-current="true"] { box-shadow: inset 3px 0 0 #ddb66c; }
        .week-date { display: grid; grid-template-columns: 28px 1fr; align-items: center; min-width: 0; font-size: 15px; font-weight: 700; }
        .node { position: relative; z-index: 1; width: 9px; height: 9px; margin-left: 9px; border: 2px solid #d9b46e; border-radius: 50%; background: #102737; }
        .week[aria-current="true"] .node { background: #d9b46e; box-shadow: 0 0 0 4px rgba(217,180,110,.15); }
        .week-caption { display: block; margin-top: 2px; color: #80939d; font-size: 11px; font-weight: 500; }
        .bar-track { height: 18px; overflow: hidden; border-radius: 999px; background: #20394a; }
        .bar { height: 100%; min-width: 0; border-radius: inherit; background: linear-gradient(90deg, #819c9f, #bfcebd); }
        .bar-empty { width: 0 !important; min-width: 0; background: transparent; }
        .week-value { overflow-wrap: anywhere; color: #fffdf8; font-size: 16px; font-weight: 750; text-align: right; }
        .week-cost { display: block; margin-top: 3px; color: #d9b46e; font-size: 11px; font-weight: 750; }
        .focus { display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(190px, .9fr); gap: 20px; margin-top: 22px; padding: 22px; border-top: 1px solid rgba(222,197,150,.7); background: rgba(255,255,255,.035); }
        .focus-value { margin: 7px 0 0; color: #fffdf8; font-size: clamp(30px, 4vw, 48px); font-weight: 790; letter-spacing: -.06em; }
        .focus-meta { align-self: end; color: #a5b4bb; font-size: 14px; line-height: 1.5; text-align: right; }
        .focus-cost { display: inline-block; margin-top: 4px; color: #fffdf8; font-size: 28px; letter-spacing: -.04em; }
        .sources { margin-top: 24px; }
        .sources-head { display: flex; justify-content: space-between; gap: 14px; align-items: baseline; }
        .sources-head h3 { margin: 6px 0 0; font-size: 22px; letter-spacing: -.035em; }
        .source-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; margin-top: 15px; }
        .source { min-height: 102px; padding: 15px; border: 1px solid #d5cbbb; border-radius: 15px; background: #fcf9f3; color: #18364b; }
        .source-name { color: #5d6d76; font-size: 13px; line-height: 1.35; }
        .source-value { margin-top: 13px; font-size: 22px; font-weight: 760; letter-spacing: -.04em; overflow-wrap: anywhere; }
        .source-meta { display: block; margin-top: 7px; color: #8a744e; font-size: 10px; overflow-wrap: anywhere; }
        .source-details { margin-top: 16px; }
        details { margin-top: 14px; border: 1px solid #d5cbbb; border-radius: 15px; background: #fcf9f3; overflow: hidden; }
        summary { cursor: pointer; padding: 15px; color: #18364b; font-weight: 760; }
        details .source-grid { margin: 0; padding: 0 15px 15px; }
        .empty { margin-top: 14px; padding: 19px; border: 1px dashed #b9a989; border-radius: 15px; color: #6c7b84; line-height: 1.55; }
        footer { margin-top: 22px; color: #6f7e87; font-size: 12px; line-height: 1.55; }
        @media (max-width: 760px) { .page { padding: 0; } .shell { min-height: 100vh; border: 0; border-radius: 0; padding: 25px 16px 36px; } header { display: block; } .live { margin-top: 18px; } .tabs { overflow-x: auto; display: flex; } .tab { flex: 0 0 132px; } .hero, .focus { grid-template-columns: 1fr; } .freshness, .focus-meta { text-align: left; } .week { grid-template-columns: 126px minmax(58px, 1fr) 88px; gap: 9px; } .week-value { font-size: 13px; } .source-grid { grid-template-columns: 1fr; } }
      </style>
      <main class="page">
        <section class="shell">
          <header>
            <div>
              <div class="brand">Oriel</div>
              <p class="eyebrow">Aldworth · weekly estate record</p>
              <h1>A calm weekly record of the estate.</h1>
              <p class="intro">A Home Assistant-native, read-only view of approved electricity, water, fuel and backup-power data. ${archiveMode ? "This local view is anchored to an imported Recorder archive; it does not represent a current live reading." : "Every live value remains tied to its Home Assistant source."} ${inventoryDescription}</p>
            </div>
            <div class="live"><span class="dot"></span>${archiveMode ? "Recorded archive · local" : "Live Home Assistant state"}</div>
          </header>
          <nav class="tabs" role="tablist" aria-label="Oriel estate systems">
            ${ORIEL_SYSTEMS.map((system) => `<button class="tab" data-system="${system.id}" role="tab" aria-selected="${system.id === selected.id}" aria-controls="oriel-weekly-record">${system.icon} ${system.label}</button>`).join("")}
          </nav>
          <section class="timeline-shell" id="oriel-weekly-record" role="tabpanel" aria-live="polite">
            <div class="hero">
              <div>
                <p class="timeline-label">Selected system · ${archiveMode ? "imported record" : "live now"}</p>
                <h2>${escapeHtml(selected.label)}</h2>
                <p class="system-copy">${escapeHtml(selected.description)}</p>
              </div>
              <div class="summary">
                <div class="metric"><span class="metric-label">${archiveMode ? "Last imported state" : "Live now"}</span><strong class="metric-value">${escapeHtml(displayValue(primary))}</strong><span class="metric-meta">${primary ? escapeHtml(friendlyName(primary)) : "No approved source"}</span></div>
                <div class="metric"><span class="metric-label">${cost ? "HA cost state" : "Approved sources"}</span><strong class="metric-value">${cost ? escapeHtml(displayValue(cost)) : escapeHtml(String(availableCount))}</strong><span class="metric-meta">${cost ? escapeHtml(friendlyName(cost)) : `${selectedStates.length} approved source${selectedStates.length === 1 ? "" : "s"}`}</span></div>
              </div>
            </div>
            <div class="record">
              <div class="record-heading"><div><p class="timeline-label">${escapeHtml(selected.historyLabel)} · six recent weeks</p><h3>Choose a weekly period</h3></div><div class="freshness">${source ? `History source - ${escapeHtml(friendlyName(source))}` : "No approved history source"}<br/>${escapeHtml(formattedUpdatedAt(selectedStates))}</div></div>
              ${source ? `<div class="week-list">${weeks.map((week, index) => {
                const width = week.value !== null && week.value > 0 ? Math.max(4, Math.round((week.value / maximum) * 100)) : 0;
                const value = week.value !== null ? displayNumber(week.value, sourceUnit, false) : historyLoading ? "Loading" : "No record";
                const weekCost = Number.isFinite(week.cost) ? `<small class="week-cost">${escapeHtml(displayNumber(week.cost, "GBP", true))}</small>` : "";
                return `<button class="week" data-week="${index}" aria-current="${index === this._selectedWeek}"><span class="week-date"><i class="node"></i><span>${escapeHtml(dateLabel(week))}<small class="week-caption">${week.isCurrent ? "Current week" : week.points ? `${week.points} recorded state${week.points === 1 ? "" : "s"}` : "No approved record"}</small></span></span><span class="bar-track"><span class="bar ${width ? "" : "bar-empty"}" style="width:${width}%"></span></span><strong class="week-value">${escapeHtml(value)}${weekCost}</strong></button>`;
              }).join("")}</div>` : `<div class="empty">No approved source is available for ${escapeHtml(selected.label.toLowerCase())}. Oriel does not substitute another entity or invent a weekly value.</div>`}
              <div class="focus"><div><p class="timeline-label">Selected period</p><div class="focus-value">${escapeHtml(currentWeekValue)}</div><p class="system-copy">${selectedWeek ? escapeHtml(dateLabel(selectedWeek)) : "No weekly period"}</p></div><div class="focus-meta">${selectedWeek && selectedWeek.points ? `${selectedWeek.points} Home Assistant state${selectedWeek.points === 1 ? "" : "s"} recorded in this period.` : "The panel shows no estimated history. A blank period remains blank until Home Assistant Recorder provides approved states."}${selectedWeek && Number.isFinite(selectedWeek.cost) ? `<br/><br/><span class="metric-label">Recorded cost</span><br/><strong class="focus-cost">${escapeHtml(displayNumber(selectedWeek.cost, "GBP", true))}</strong>` : ""}<br/><br/>${source ? escapeHtml(source.entity_id) : ""}</div></div>
            </div>
          </section>
          <section class="sources" aria-label="Approved sources"><div class="sources-head"><div><p class="source-label">${archiveMode ? "Imported sources" : "Live sources"}</p><h3>${archiveMode ? "Recorded Home Assistant states" : "Current Home Assistant states"}</h3></div><span class="freshness">${availableCount} available</span></div>${selectedStates.length ? `<div class="source-grid">${selectedStates.map((entity) => `<article class="source"><div class="source-name">${escapeHtml(friendlyName(entity))}</div><div class="source-value">${escapeHtml(displayValue(entity))}</div><span class="source-meta">${escapeHtml(entity.entity_id)} - ${isAvailable(entity) ? (archiveMode ? "imported from Recorder" : "published by Home Assistant") : "currently unavailable"}</span></article>`).join("")}</div>` : ""}</section>
          ${sourceDetails.length ? `<section class="sources source-details" aria-label="Source detail"><div class="sources-head"><div><p class="source-label">Sources</p><h3>Recorded source breakdown</h3></div></div><details><summary>Show ${sourceDetails.length} approved source${sourceDetails.length === 1 ? "" : "s"}</summary><div class="source-grid">${sourceDetails.map((item) => `<article class="source"><div class="source-name">${escapeHtml(item.label || item.entity_id || "Approved source")}</div><div class="source-value">${escapeHtml(item.value || "Recorded")}</div><span class="source-meta">${escapeHtml(item.entity_id || "")}${item.note ? ` - ${escapeHtml(item.note)}` : ""}</span></article>`).join("")}</div></details></section>` : ""}
          ${inventoryMode(this._panel) ? `<section class="sources source-details" aria-label="Full Aldworth sensor catalogue"><div class="sources-head"><div><p class="source-label">Estate inventory</p><h3>All approved Aldworth sensors</h3></div><span class="freshness">${approvedInventory.filter(isAvailable).length} available · ${approvedInventory.length} total</span></div><p class="empty">Every entry below comes directly from Home Assistant state. Categories are for navigation only; “Unavailable” is kept visible rather than being replaced with an estimate.</p>${approvedGroups.map((group) => `<details><summary>${escapeHtml(group.label)} · ${group.entries.filter(isAvailable).length}/${group.entries.length} available</summary><div class="source-grid">${group.entries.map((entity) => `<article class="source"><div class="source-name">${escapeHtml(friendlyName(entity))}</div><div class="source-value">${escapeHtml(displayValue(entity))}</div><span class="source-meta">${escapeHtml(entity.entity_id)} · ${isAvailable(entity) ? "published by Home Assistant" : "currently unavailable"}</span></article>`).join("")}</div></details>`).join("")}</section>` : ""}
          <footer>Boundary: Oriel reads only approved Home Assistant entities shown here. Weekly history is requested only from the signed-in Home Assistant Recorder for the selected approved source. ${archiveMode ? "This local test is fixed to the archive anchor configured by the administrator." : ""} No device control, external token, public investor link or external API is present.</footer>
        </section>
      </main>
    `;

    this.shadowRoot.querySelectorAll("[data-system]").forEach((button) => {
      button.addEventListener("click", () => { this._selectedSystem = button.dataset.system; this._selectedWeek = 0; this.render(); });
    });
    this.shadowRoot.querySelectorAll("[data-week]").forEach((button) => {
      button.addEventListener("click", () => { this._selectedWeek = Number(button.dataset.week); this.render(); });
    });
    this.requestApprovedHistory(source);
  }
}

if (!customElements.get("oriel-panel")) customElements.define("oriel-panel", OrielPanel);

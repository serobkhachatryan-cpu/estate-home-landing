/*
 * Oriel Lovelace card — a read-only companion to the full Oriel panel.
 * Add as `type: custom:oriel-card` to any Home Assistant dashboard.
 *
 * It deliberately uses only states already provided to the signed-in Home
 * Assistant user and (when expressly enabled) a read-only Recorder query for
 * an approved consumption source. No external request, token, storage or HA
 * service call is made here.
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
  electricity: /^sensor\.(?:total(?:_l[123])?_power|shellypro3em_[a-z0-9]+_(?:power|energy|energy_cost))$/i,
  water: /^sensor\.(?:house_water_1_(?:flow|total_l)|main_water_(?:flow|total_l)|lodge_water_(?:flow|total_l|tank_volume))$/i,
  fuel: /^sensor\.(?:house_fuel_tank_\d+(?:_volume)?|.*(?:fuel|genset).*(?:volume|level))$/i,
  power: /^sensor\.(?:(?:office|lodge|basement|loft).*?(?:ups|battery)|.*(?:input_voltage|output_voltage))$/i,
  climate: /(?:temperature|humidity|illuminance|pressure|rain|wind|uv|solar|dewpoint)/i,
  security: /(?:nvr|camera|cam_|disk_write|storage_|recording|intercom|gates_)/i,
  network: /(?:cpu_usage|memory_usage|device_status|poe_power|starlink|wifi|switch|gateway|_ap_)/i,
};

const DEFAULT_HISTORY_WEEKS = 6;
const DAY_MS = 86400000;
const esc = (value) => String(value == null ? "" : value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
const attrs = (entity) => entity && entity.attributes && typeof entity.attributes === "object" ? entity.attributes : {};
const name = (entity) => attrs(entity).friendly_name || entity.entity_id.replace(/^.*?\./, "").replace(/_/g, " ");
const available = (entity) => !["", "unknown", "unavailable", "none"].includes(String(entity && entity.state || "").toLowerCase());
const value = (entity) => Number.parseFloat(String(entity && entity.state || ""));
const finite = (raw) => typeof raw === "number" && Number.isFinite(raw);
const numeric = (raw) => {
  const parsed = typeof raw === "number" ? raw : Number.parseFloat(String(raw));
  return Number.isFinite(parsed) ? parsed : null;
};
const sum = (items) => items.reduce((total, item) => total + (finite(item) ? item : 0), 0);
const count = (items) => items.filter(finite).length;
const money = (entity) => attrs(entity).device_class === "monetary" || /^(GBP|£)$/i.test(String(attrs(entity).unit_of_measurement || ""));
const format = (raw, unit = "", isMoney = false) => {
  if (!Number.isFinite(raw)) return "—";
  if (isMoney) return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 }).format(raw);
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: Math.abs(raw) >= 100 ? 1 : 2 }).format(raw) + (unit ? ` ${unit}` : "");
};
const display = (entity) => !entity ? "No source" : !available(entity) ? "Unavailable" : format(value(entity), attrs(entity).unit_of_measurement || "", money(entity));
const explicitIds = (config, key, system) => Array.isArray(config[key] && config[key][system]) ? config[key][system] : null;
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
const timestamp = (state) => {
  const parsed = Date.parse(state && (state.last_updated || state.last_changed || state.lu || ""));
  return Number.isFinite(parsed) ? parsed : null;
};
const cumulative = (entity) => String(attrs(entity).device_class || "").toLowerCase() === "energy" || /(?:total_l|_energy$|_energy_)/i.test(entity.entity_id);
const monday = (date) => {
  const result = new Date(date); result.setHours(0, 0, 0, 0);
  result.setDate(result.getDate() - (result.getDay() === 0 ? 6 : result.getDay() - 1));
  return result;
};
const zonedParts = (date, timeZone) => Object.fromEntries(new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
const zonedMidnight = (year, month, day, timeZone) => {
  // Convert a calendar date to midnight in the selected timezone. A raw UTC
  // midnight is 01:00 in London during BST, which would make Recorder
  // statistics silently span the wrong UK calendar week.
  const localMidnight = Date.UTC(year, month - 1, day);
  let epoch = localMidnight;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const parts = zonedParts(new Date(epoch), timeZone);
    const utcOffset = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute) - epoch;
    epoch = localMidnight - utcOffset;
  }
  return new Date(epoch);
};
const zonedMonday = (date, timeZone) => {
  const parts = zonedParts(date, timeZone);
  const utcDate = new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
  utcDate.setUTCDate(utcDate.getUTCDate() - (utcDate.getUTCDay() === 0 ? 6 : utcDate.getUTCDay() - 1));
  return zonedMidnight(utcDate.getUTCFullYear(), utcDate.getUTCMonth() + 1, utcDate.getUTCDate(), timeZone);
};
const weekRange = (index, anchor = new Date(), timeZone = null) => {
  if (timeZone) {
    const endDate = zonedMonday(anchor, timeZone); endDate.setUTCDate(endDate.getUTCDate() + 7 - index * 7);
    const start = new Date(endDate); start.setUTCDate(start.getUTCDate() - 7);
    return { start, end: endDate };
  }
  const end = new Date(monday(anchor)); end.setDate(end.getDate() + 7 - index * 7);
  const start = new Date(end); start.setDate(start.getDate() - 7);
  return { start, end };
};
const calendarParts = (date) => Object.fromEntries(new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric", weekday: "short" }).formatToParts(date).filter((part) => part.type !== "literal").map((part) => [part.type, part.value]));
const isoDate = (date) => date.toISOString().slice(0, 10);
const isoWeekNumber = (mondayDate) => {
  const thursday = new Date(mondayDate); thursday.setUTCDate(thursday.getUTCDate() + 3);
  const firstThursday = new Date(Date.UTC(thursday.getUTCFullYear(), 0, 4));
  firstThursday.setUTCDate(firstThursday.getUTCDate() + 3 - ((firstThursday.getUTCDay() + 6) % 7));
  return 1 + Math.round((thursday - firstThursday) / (7 * DAY_MS));
};
const describeWeek = (start, index) => {
  const end = new Date(start); end.setUTCDate(end.getUTCDate() + 6);
  const first = calendarParts(start); const last = calendarParts(end);
  const range = first.year === last.year && first.month === last.month
    ? `${first.day}–${last.day} ${last.month} ${last.year}`
    : first.year === last.year
      ? `${first.day} ${first.month}–${last.day} ${last.month} ${last.year}`
      : `${first.day} ${first.month} ${first.year}–${last.day} ${last.month} ${last.year}`;
  return {
    index,
    start,
    end,
    startIso: isoDate(start),
    endIso: isoDate(end),
    isoWeek: isoWeekNumber(start),
    range,
    calendar: `Mon ${first.day} ${first.month} – Sun ${last.day} ${last.month} ${last.year}`,
  };
};
const weekDetails = (index, anchor, timeZone) => {
  const local = zonedParts(anchor, timeZone || "Europe/London");
  const start = new Date(Date.UTC(local.year, local.month - 1, local.day));
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7) - index * 7);
  return describeWeek(start, index);
};
const configuredWeekDetails = (startIso, index) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(startIso || ""))) return null;
  const start = new Date(`${startIso}T00:00:00.000Z`);
  if (!Number.isFinite(start.getTime()) || start.getUTCDay() !== 1) return null;
  return describeWeek(start, index);
};
const historyPoints = (response, entityId) => Array.isArray(response) ? (Array.isArray(response[0]) ? response[0] : response) : Array.isArray(response && response[entityId]) ? response[entityId] : [];
const historyWeek = (range, history, entity) => {
  const points = history.map((item) => ({ at: timestamp(item), value: Number.parseFloat(item && item.state) }))
    .filter((item) => item.at !== null && Number.isFinite(item.value) && item.at >= range.start.getTime() && item.at < range.end.getTime())
    .sort((a, b) => a.at - b.at);
  if (!points.length) return null;
  return cumulative(entity) && points.length > 1 ? Math.max(0, points.at(-1).value - points[0].value) : points.at(-1).value;
};
const sourcePriority = (system, entity) => {
  let score = available(entity) ? 100 : 0;
  if (system.id === "electricity" && attrs(entity).device_class === "energy") score += 80;
  if (system.id === "water" && /(?:total_l|total|volume)/i.test(entity.entity_id)) score += 80;
  if (system.id === "fuel" && /(?:volume|level)/i.test(entity.entity_id)) score += 60;
  if (system.id === "power" && /battery/i.test(entity.entity_id)) score += 60;
  if (money(entity)) score -= 30;
  return score;
};
const safeWeekCount = (raw) => {
  const parsed = Number.parseInt(String(raw), 10);
  return Number.isFinite(parsed) ? Math.max(1, Math.min(parsed, 104)) : DEFAULT_HISTORY_WEEKS;
};
const daysFor = (raw) => {
  const parsed = Number.parseInt(String(raw), 10);
  return Number.isFinite(parsed) ? Math.max(0, Math.min(parsed, 7)) : null;
};
const differenceTone = (fact, plan) => {
  if (!finite(fact) || !finite(plan)) return "recorded";
  const difference = fact - plan;
  const tolerance = Math.max(Math.abs(plan) * .02, .01);
  if (difference > tolerance) return "over";
  if (difference < -tolerance) return "under";
  return "on-plan";
};
const differenceLabel = (tone) => ({ over: "Over plan", under: "Under plan", "on-plan": "On plan", recorded: "Recorded" })[tone] || "Recorded";

class OrielCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._selected = "electricity";
    this._selectedWeek = 0;
    this._expanded = false;
    this._hass = null;
    this._config = {};
    this._history = new Map();
    this._historyLoading = new Set();
    this._renderQueued = false;
  }

  setConfig(config) {
    if (!config || typeof config !== "object") throw new Error("Oriel card requires a configuration object");
    this._config = config;
    // A card editor can replace an archive anchor or timezone for the same
    // entity. Recorder samples from the preceding configuration must not be
    // reused for that new time range.
    this._history.clear();
    this._historyLoading.clear();
    this.queueRender();
  }

  set hass(hass) { this._hass = hass; this.queueRender(); }
  connectedCallback() { this.render(); }

  queueRender() {
    if (this._renderQueued) return;
    this._renderQueued = true;
    Promise.resolve().then(() => { this._renderQueued = false; this.render(); });
  }

  getCardSize() { return this._expanded ? 24 : 15; }

  systems() {
    const custom = Array.isArray(this._config.sensor_groups) ? this._config.sensor_groups
      .filter((group) => group && typeof group.id === "string" && typeof group.label === "string")
      .map((group) => ({ id: group.id, label: group.label, icon: group.icon || "·", unit: group.unit || "", entity_ids: Array.isArray(group.entity_ids) ? group.entity_ids : [] })) : [];
    return custom.length ? custom : UTILITY_SYSTEMS;
  }

  sourceList(system, key = "entity_ids") {
    const stateMap = this._hass && this._hass.states || {};
    const explicit = key === "entity_ids" && Array.isArray(system.entity_ids) ? system.entity_ids : explicitIds(this._config, key, system.id);
    // This card is intentionally allowlist-only. Regex discovery belongs only
    // in the administrator catalogue (`show_catalog: true`), never in a
    // viewer-facing weekly ribbon.
    if (!Array.isArray(explicit)) return [];
    return Object.values(stateMap).filter((entity) => {
      if (!/^sensor\./i.test(entity.entity_id)) return false;
      return explicit.includes(entity.entity_id);
    }).sort((a, b) => sourcePriority(system, b) - sourcePriority(system, a) || name(a).localeCompare(name(b)));
  }

  statisticsEnabled() {
    const setting = this._config.statistics;
    return setting === true || Boolean(setting && typeof setting === "object" && setting.history === true);
  }

  statisticsAnchor() {
    const configured = this._config.statistics && typeof this._config.statistics === "object" ? this._config.statistics.anchor : null;
    const parsed = configured ? new Date(configured) : null;
    return parsed && Number.isFinite(parsed.getTime()) ? parsed : new Date();
  }

  statisticsTimeZone() {
    const configured = this._config.statistics && typeof this._config.statistics === "object" ? this._config.statistics.timezone : null;
    try { if (configured) new Intl.DateTimeFormat("en-GB", { timeZone: configured }); } catch { return null; }
    return configured || null;
  }

  archiveAnchor() {
    const parsed = this._config.archive_anchor ? new Date(this._config.archive_anchor) : null;
    return parsed && Number.isFinite(parsed.getTime()) ? parsed : this.statisticsAnchor();
  }

  archiveTimeZone() {
    const configured = this._config.archive_timezone;
    try { if (configured) new Intl.DateTimeFormat("en-GB", { timeZone: configured }); } catch { return this.statisticsTimeZone() || "Europe/London"; }
    return configured || this.statisticsTimeZone() || "Europe/London";
  }

  requestHistory(entity, weeks) {
    if (!this.statisticsEnabled() || !entity || !this._hass || this._history.has(entity.entity_id) || this._historyLoading.has(entity.entity_id) || typeof this._hass.callWS !== "function") return;
    const anchor = this.statisticsAnchor();
    const oldest = weekRange(weeks - 1, anchor, this.statisticsTimeZone()).start;
    this._historyLoading.add(entity.entity_id);
    this._hass.callWS({ type: "history/history_during_period", start_time: oldest.toISOString(), end_time: anchor.toISOString(), entity_ids: [entity.entity_id], minimal_response: true, no_attributes: true })
      .then((response) => this._history.set(entity.entity_id, historyPoints(response, entity.entity_id)))
      .catch(() => this._history.set(entity.entity_id, []))
      .finally(() => { this._historyLoading.delete(entity.entity_id); this.render(); });
  }

  archiveValues(key, systemId) {
    const candidate = this._config[key] && this._config[key][systemId];
    return Array.isArray(candidate) ? candidate.map(numeric) : [];
  }

  afterRender() {
    this.shadowRoot.querySelectorAll("[data-system]").forEach((button) => button.addEventListener("click", () => {
      this._selected = button.dataset.system;
      this._selectedWeek = 0;
      this.render();
    }));
    this.shadowRoot.querySelectorAll("[data-week]").forEach((button) => button.addEventListener("click", () => {
      this._selectedWeek = Number.parseInt(button.dataset.week, 10) || 0;
      this.render();
    }));
    this.shadowRoot.querySelectorAll("[data-jump]").forEach((button) => button.addEventListener("click", () => {
      this._selectedWeek = button.dataset.jump === "oldest" ? Number.parseInt(button.dataset.oldest, 10) || 0 : 0;
      this.render();
    }));
    const details = this.shadowRoot.querySelector("details");
    if (details) details.addEventListener("toggle", () => { this._expanded = details.open; });
    const focused = this.shadowRoot.querySelector("[data-focus-week]");
    if (focused && typeof focused.scrollIntoView === "function") Promise.resolve().then(() => focused.scrollIntoView({ block: "center", behavior: "auto" }));
  }

  render() {
    const systems = this.systems();
    const system = systems.find((item) => item.id === this._selected) || systems[0];
    if (!system) return;
    this._selected = system.id;
    const sources = this.sourceList(system);
    const costSources = this.sourceList(system, "cost_entity_ids");
    const historySource = sources.filter((entity) => !money(entity)).sort((a, b) => sourcePriority(system, b) - sourcePriority(system, a))[0];
    const sourceUnit = historySource ? (attrs(historySource).unit_of_measurement || system.unit) : system.unit;
    const configuredValues = this.archiveValues("archive_weekly_values", system.id);
    const configuredCosts = this.archiveValues("archive_weekly_costs", system.id);
    const configuredPlans = this.archiveValues("archive_weekly_plan_costs", system.id);
    const configuredDays = this.archiveValues("archive_weekly_recorded_days", system.id).length
      ? this.archiveValues("archive_weekly_recorded_days", system.id)
      : this.archiveValues("archive_weekly_day_counts", system.id);
    const configuredCostDays = this.archiveValues("archive_weekly_cost_matching_days", system.id);
    const configuredStarts = this._config.archive_week_starts && Array.isArray(this._config.archive_week_starts[system.id])
      ? this._config.archive_week_starts[system.id] : [];
    const explicitCostIds = explicitIds(this._config, "cost_entity_ids", system.id) || [];
    const configuredCostLabel = this._config.archive_cost_source_labels && this._config.archive_cost_source_labels[system.id]
      ? String(this._config.archive_cost_source_labels[system.id]).trim() : "";
    const hasConfiguredValues = configuredValues.length > 0;
    const startsAligned = !configuredStarts.length || (configuredStarts.length === configuredValues.length && configuredStarts.every((start, index) => configuredWeekDetails(start, index)));
    const daysAligned = configuredDays.length === configuredValues.length;
    const costsAligned = hasConfiguredValues && configuredCosts.length === configuredValues.length && configuredCostDays.length === configuredValues.length;
    const plansAligned = hasConfiguredValues && configuredPlans.length === configuredValues.length;
    const verifiedCostConfigured = costsAligned && explicitCostIds.length > 0 && Boolean(configuredCostLabel);
    const archiveWarnings = [];
    if (hasConfiguredValues && !startsAligned) archiveWarnings.push("archive dates are not aligned to the weekly records");
    if (hasConfiguredValues && !daysAligned) archiveWarnings.push("usage-day coverage is unknown");
    if (configuredCosts.length && !verifiedCostConfigured) archiveWarnings.push("tariff estimate withheld: approve aligned cost sources, matching days and a source label");
    if (configuredPlans.length && !plansAligned) archiveWarnings.push("plan values withheld: they are not aligned to the weekly records");
    const requestedWeeks = safeWeekCount(this._config.history_weeks);
    const liveHistory = historySource ? this._history.get(historySource.entity_id) || [] : [];
    const dynamicValues = historySource && this.statisticsEnabled()
      ? Array.from({ length: requestedWeeks }, (_, index) => historyWeek(weekRange(index, this.statisticsAnchor(), this.statisticsTimeZone()), liveHistory, historySource)) : [];
    const valueSeries = hasConfiguredValues ? configuredValues : dynamicValues;
    const seriesLength = valueSeries.length;
    const hasArchive = hasConfiguredValues;
    const weekAnchor = hasArchive ? this.archiveAnchor() : this.statisticsAnchor();
    const weekTimeZone = hasArchive ? this.archiveTimeZone() : this.statisticsTimeZone() || "Europe/London";
    const weeks = Array.from({ length: seriesLength }, (_, index) => {
      const recordedValue = valueSeries[index] ?? null;
      const costDays = daysFor(configuredCostDays[index]);
      const verifiedWeekCost = verifiedCostConfigured && finite(recordedValue) && finite(configuredCosts[index]) && costDays !== null && costDays > 0;
      return {
        ...(configuredWeekDetails(configuredStarts[index], index) || weekDetails(index, weekAnchor, weekTimeZone)),
        value: recordedValue,
        cost: verifiedWeekCost ? configuredCosts[index] : null,
        plan: plansAligned && finite(configuredPlans[index]) ? configuredPlans[index] : null,
        days: hasConfiguredValues ? daysFor(configuredDays[index]) : null,
        costDays: verifiedWeekCost ? costDays : null,
      };
    });
    const safeWeek = Math.max(0, Math.min(this._selectedWeek, Math.max(weeks.length - 1, 0)));
    this._selectedWeek = safeWeek;
    const selectedWeek = weeks[safeWeek] || null;
    const timelineWeeks = [...weeks].reverse();
    const actualCostTotal = sum(weeks.map((week) => week.cost));
    const planTotal = sum(weeks.map((week) => week.plan));
    const recordedUseTotal = sum(weeks.map((week) => week.value));
    const costCount = count(weeks.map((week) => week.cost));
    const planCount = count(weeks.map((week) => week.plan));
    const hasCompleteCostSeries = weeks.length > 0 && costCount === weeks.length;
    const hasPlan = hasCompleteCostSeries && planCount === weeks.length;
    const fact = hasCompleteCostSeries ? actualCostTotal : recordedUseTotal;
    const factMoney = hasCompleteCostSeries;
    const comparisonTone = hasCompleteCostSeries && hasPlan ? differenceTone(actualCostTotal, planTotal) : "recorded";
    const totalDifference = hasCompleteCostSeries && hasPlan ? actualCostTotal - planTotal : null;
    const selectedFact = selectedWeek && hasCompleteCostSeries && finite(selectedWeek.cost) ? selectedWeek.cost : selectedWeek && finite(selectedWeek.value) ? selectedWeek.value : null;
    const selectedFactMoney = Boolean(selectedWeek && hasCompleteCostSeries && finite(selectedWeek.cost));
    const selectedDifference = selectedWeek && hasCompleteCostSeries && finite(selectedWeek.cost) && finite(selectedWeek.plan) ? selectedWeek.cost - selectedWeek.plan : null;
    const selectedTone = selectedDifference !== null && selectedWeek ? differenceTone(selectedWeek.cost, selectedWeek.plan) : "recorded";
    const barValues = weeks.flatMap((week) => [hasCompleteCostSeries ? week.cost : week.value, hasCompleteCostSeries ? week.plan : null]).filter(finite);
    const barMax = Math.max(1, ...barValues.map((item) => Math.abs(item)));
    const costLabel = configuredCostLabel || "No approved tariff source label";
    const liveSourceCards = [...sources.map((entity) => ({ entityId: entity.entity_id, label: name(entity), value: display(entity), role: "Approved measurement", live: available(entity) })), ...costSources.filter((entity) => !sources.some((source) => source.entity_id === entity.entity_id)).map((entity) => ({ entityId: entity.entity_id, label: name(entity), value: display(entity), role: "Approved cost source", live: available(entity) }))];
    const archiveSourceDetails = this._config.archive_source_details && Array.isArray(this._config.archive_source_details[system.id])
      ? this._config.archive_source_details[system.id] : [];
    const sourceCards = [...liveSourceCards];
    archiveSourceDetails.forEach((detail) => {
      const entityId = typeof detail?.entity_id === "string" ? detail.entity_id : "";
      const label = typeof detail?.label === "string" ? detail.label : entityId;
      if (!entityId || !label || sourceCards.some((source) => source.entityId === entityId)) return;
      sourceCards.push({ entityId, label, value: "Archive source", role: typeof detail.role === "string" ? detail.role : "Approved archive source", live: false });
    });
    const historyLoading = historySource && this._historyLoading.has(historySource.entity_id);
    const allSensors = this._config.show_catalog === true
      ? Object.values(this._hass && this._hass.states || {}).filter((entity) => /^sensor\./i.test(entity.entity_id)) : [];
    const groups = allSensors.reduce((result, entity) => { const key = category(entity.entity_id); (result[key] ||= []).push(entity); return result; }, {});
    this.requestHistory(historySource, requestedWeeks);

    const oldest = timelineWeeks[0];
    const newest = timelineWeeks.at(-1);
    const focusMeta = selectedWeek
      ? `${selectedWeek.days === null ? "Coverage unknown" : `${selectedWeek.days} recorded day${selectedWeek.days === 1 ? "" : "s"}`} · W${selectedWeek.isoWeek}`
      : "No recorded week";
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; color:#173448; font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif; }
        * { box-sizing:border-box; } button { font:inherit; } .card { overflow:hidden; border-radius:22px; background:#102030; color:#f8f3e9; box-shadow:0 8px 24px rgba(19,30,39,.2); }
        header { display:flex; justify-content:space-between; gap:12px; padding:16px 18px 13px; border-bottom:1px solid rgba(255,255,255,.1); }.brand{font-weight:800;font-size:18px;letter-spacing:-.04em}.sub{margin-top:3px;color:#9babb3;font-size:10px}.state{align-self:start;padding:6px 8px;border-radius:99px;background:rgba(123,170,125,.17);color:#c3d9c4;font-size:9px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}.dot{display:inline-block;width:6px;height:6px;margin-right:5px;border-radius:50%;background:#8dc493}
        .tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:5px;padding:11px 12px 0}.tab{min-width:0;border:1px solid rgba(222,197,150,.25);border-radius:9px;background:rgba(255,255,255,.04);color:#d6e0df;padding:8px 3px;font-size:11px;font-weight:700;cursor:pointer}.tab[aria-selected="true"]{border-color:#f7f3e9;background:#f7f3e9;color:#102030}
        .overview{padding:16px 18px 14px;border-bottom:1px solid rgba(222,197,150,.7)}.eyebrow{margin:0;color:#d9b779;font-size:10px;font-weight:800;letter-spacing:.15em;text-transform:uppercase}.summary-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;margin-top:12px}.summary{min-height:72px;padding:11px;border:1px solid rgba(222,197,150,.25);border-radius:12px;background:rgba(255,255,255,.09)}.summary span,.context-label{display:block;color:rgba(248,243,233,.52);font-size:9px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}.summary strong{display:block;margin-top:5px;font-size:21px;line-height:1.05;letter-spacing:-.05em;overflow-wrap:anywhere}.comparison{min-height:16px;margin:10px 1px 0;color:#cad6d5;font-size:11px}.comparison b{color:#d9b779}.comparison.over b{color:#e4b6a1}.comparison.under b{color:#b8d2bc}
        .focus{padding:16px 18px 12px}.focus-head{display:flex;justify-content:space-between;gap:12px}.focus-left{min-width:0}.focus-title{margin:0;color:rgba(248,243,233,.52);font-size:10px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.focus-value{margin:6px 0 0;font-size:31px;font-weight:800;letter-spacing:-.06em;line-height:1}.focus-use{margin:6px 0 0;color:#ccd7d8;font-size:11px}.focus-date{margin:8px 0 0;color:#e7e2d8;font-size:13px;line-height:1.25}.focus-code{margin:3px 0 0;color:rgba(248,243,233,.46);font-size:9px;letter-spacing:.03em}.status{text-align:right;white-space:nowrap}.status b{display:block;color:#d9b779;font-size:12px}.status.over b{color:#e4b6a1}.status.under b{color:#b8d2bc}.status span{display:block;margin-top:6px;color:rgba(248,243,233,.5);font-size:10px}.focus-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:14px}.mini{min-width:0;padding:9px;border-radius:10px;background:rgba(255,255,255,.06)}.mini span{display:block;color:rgba(248,243,233,.45);font-size:8px;font-weight:800;letter-spacing:.11em;text-transform:uppercase}.mini strong{display:block;margin-top:4px;font-size:13px;letter-spacing:-.03em;overflow-wrap:anywhere}.mini small{display:block;margin-top:3px;color:rgba(248,243,233,.45);font-size:8px;line-height:1.25}
        .timeline-wrap{padding:0 12px 0}.timeline-label{margin:2px 6px 7px;color:rgba(248,243,233,.38);font-size:9px;font-weight:700;letter-spacing:.12em;text-transform:uppercase}.timeline-frame{position:relative}.focus-line{pointer-events:none;position:absolute;z-index:2;left:0;right:0;top:50%;height:1px;background:#d9b779}.timeline{height:268px;overflow-y:auto;overscroll-behavior:contain;scroll-snap-type:y mandatory;padding:112px 2px;scroll-behavior:smooth}.week{display:grid;grid-template-columns:86px minmax(46px,1fr) 72px;align-items:center;gap:8px;width:100%;height:38px;padding:0 5px;border:0;background:rgba(255,255,255,.02);color:#e7ece9;text-align:left;cursor:pointer;scroll-snap-align:center}.week:hover,.week[aria-current="true"]{background:rgba(255,255,255,.09)}.week[aria-current="true"] .week-date{color:#e4c27b;font-weight:800}.week-date{font-size:10px;line-height:1.15}.week-date small{display:block;margin-top:2px;color:rgba(248,243,233,.38);font-size:8px}.track{position:relative;height:13px}.track::before{content:"";position:absolute;inset:2px 0;border-radius:5px;background:#203847}.bar{position:absolute;left:0;bottom:3px;height:7px;border-radius:5px;background:#f7f3e9}.bar.under{background:#c5d6c4}.bar.over{background:#e4b6a1}.bar.recorded{background:#9db3b4}.plan-tick{position:absolute;z-index:1;top:0;bottom:0;width:1px;border-left:1px dashed rgba(248,243,233,.64)}.week-value{text-align:right;font-size:10px;line-height:1.1}.week-value strong{display:block;font-size:10px}.week-value small{display:block;margin-top:2px;color:#d9b779;font-size:8px}.week-value .no-record{color:rgba(248,243,233,.42)}.controls{display:flex;gap:6px;padding:10px 14px;border-top:1px solid rgba(255,255,255,.1)}.controls button{border:0;border-radius:99px;background:rgba(255,255,255,.1);color:#e9edeb;padding:6px 11px;font-size:11px;font-weight:700;cursor:pointer}
        .sources{background:#f8f4ec;color:#173448;padding:15px 18px 18px}.sources-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px}.sources h3{margin:0;font-size:15px;letter-spacing:-.03em}.sources-head span{color:#78868d;font-size:10px}.source-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}.source{min-width:0;padding:10px;border:1px solid #ded4c4;border-radius:10px;background:#fffdf8}.source .role{display:block;color:#8c7040;font-size:8px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.source b{display:block;overflow:hidden;margin-top:4px;text-overflow:ellipsis;white-space:nowrap;font-size:11px}.source .source-value{display:block;margin-top:5px;color:#8c7040;font-size:11px}.source small{display:block;overflow:hidden;margin-top:4px;color:#71808a;font-size:8px;text-overflow:ellipsis;white-space:nowrap}.source-note{margin:10px 0 0;color:#667780;font-size:10px;line-height:1.4}.empty{padding:14px;color:#a8b7bc;font-size:11px;line-height:1.45}.sources .empty{border:1px dashed #d6c9b8;border-radius:10px;color:#61717a}
        details{margin:0 18px 18px;border:1px solid #ddd2c1;border-radius:12px;background:#fffdf8;overflow:hidden}summary{cursor:pointer;padding:12px;color:#173448;font-size:12px;font-weight:800}.catalog{padding:0 12px 12px}.catalog h4{margin:14px 0 7px;color:#8c7040;font-size:9px;letter-spacing:.12em;text-transform:uppercase}.catalog .source-grid{grid-template-columns:repeat(3,minmax(0,1fr));margin-top:0}.footnote{background:#f8f4ec;color:#74838a;padding:0 18px 17px;font-size:9px;line-height:1.45}@media(max-width:420px){.tab{font-size:9px}.week{grid-template-columns:80px minmax(40px,1fr) 67px}.focus-value{font-size:28px}.source-grid,.catalog .source-grid{grid-template-columns:1fr}.timeline{height:250px}.timeline-wrap{padding:0 9px}.overview,.focus{padding-left:14px;padding-right:14px}}
      </style>
      <article class="card">
        <header><div><div class="brand">Oriel</div><div class="sub">Aldworth · recorded Home Assistant history</div></div><div class="state"><i class="dot"></i>read only</div></header>
        <nav class="tabs" aria-label="Oriel systems">${systems.map((item) => `<button class="tab" data-system="${esc(item.id)}" aria-selected="${item.id === system.id}">${esc(item.icon)} ${esc(item.label)}</button>`).join("")}</nav>
        ${weeks.length ? `
          <section class="overview">
            <p class="eyebrow">${weeks.length} week${weeks.length === 1 ? "" : "s"} to focus · ${esc(oldest.range)} → ${esc(newest.range)}</p>
            <div class="summary-grid">
              <div class="summary"><span>Plan · ${weeks.length}W</span><strong>${hasPlan ? esc(format(planTotal, "", true)) : "—"}</strong></div>
              <div class="summary"><span>${hasCompleteCostSeries ? `Tariff estimate · ${costCount}W` : `Recorded use · ${count(weeks.map((week) => week.value))}W`}</span><strong>${esc(format(fact, sourceUnit, factMoney))}</strong></div>
            </div>
            <p class="comparison ${comparisonTone}">${hasPlan && hasCompleteCostSeries ? `<b>${differenceLabel(comparisonTone)}</b> ${totalDifference >= 0 ? "+" : ""}${esc(format(totalDifference, "", true))} vs plan` : hasCompleteCostSeries ? `<b>Tariff estimate</b> · ${esc(costLabel)} · no approved plan` : archiveWarnings.length ? `<b>Coverage note</b> · ${esc(archiveWarnings.join(" · "))}` : "No approved recorded cost or plan for this system."}</p>
          </section>
          <section class="focus">
            <div class="focus-head">
              <div class="focus-left"><p class="focus-title">Focus week · ${esc(focusMeta)}</p><p class="focus-value">${selectedFact === null ? "No record" : esc(format(selectedFact, sourceUnit, selectedFactMoney))}</p>${selectedWeek && selectedFactMoney && finite(selectedWeek.value) ? `<p class="focus-use">Recorded use · ${esc(format(selectedWeek.value, sourceUnit))}</p>` : ""}${selectedWeek ? `<p class="focus-date">${esc(selectedWeek.calendar)}</p><p class="focus-code">UK Mon–Sun · ${esc(selectedWeek.startIso)} → ${esc(selectedWeek.endIso)}</p>` : ""}</div>
              <div class="status ${selectedTone}"><b>${differenceLabel(selectedTone)}</b><span>${selectedDifference === null ? "No approved plan" : `${selectedDifference >= 0 ? "+" : ""}${format(selectedDifference, "", true)}`}</span></div>
            </div>
            <div class="focus-metrics">
              <div class="mini"><span>Week plan</span><strong>${selectedWeek && finite(selectedWeek.plan) ? esc(format(selectedWeek.plan, "", true)) : "—"}</strong><small>${selectedWeek && finite(selectedWeek.plan) ? "Approved plan" : "Not configured"}</small></div>
              <div class="mini"><span>${selectedFactMoney ? "Tariff estimate" : "Recorded use"}</span><strong>${selectedFact === null ? "—" : esc(format(selectedFact, sourceUnit, selectedFactMoney))}</strong><small>${selectedFactMoney && selectedWeek && selectedWeek.costDays !== null ? `${selectedWeek.costDays} matching day${selectedWeek.costDays === 1 ? "" : "s"}` : selectedWeek && selectedWeek.days !== null ? `${selectedWeek.days} recorded day${selectedWeek.days === 1 ? "" : "s"}` : "Recorded source"}</small></div>
              <div class="mini"><span>Cash</span><strong>—</strong><small>No verified cash source</small></div>
            </div>
          </section>
          <section class="timeline-wrap"><p class="timeline-label">Recorded weeks · select a period · yellow line is focus</p><div class="timeline-frame"><i class="focus-line" aria-hidden="true"></i><div class="timeline" role="listbox" aria-label="${esc(system.label)} weekly record">${timelineWeeks.map((week) => { const primary = hasCompleteCostSeries ? week.cost : week.value; const plan = hasCompleteCostSeries ? week.plan : null; const ratio = finite(primary) ? Math.max(3, Math.round(Math.abs(primary) / barMax * 100)) : 0; const planRatio = finite(plan) ? Math.max(0, Math.min(100, Math.round(Math.abs(plan) / barMax * 100))) : null; const tone = finite(primary) && finite(plan) ? differenceTone(primary, plan) : "recorded"; const focused = week.index === safeWeek; const supporting = hasCompleteCostSeries && finite(week.value) ? `Recorded use · ${format(week.value, sourceUnit)}${week.costDays !== null ? ` · ${week.costDays}d matched` : ""}` : !hasCompleteCostSeries && finite(week.cost) ? `${format(week.cost, "", true)} tariff estimate${week.costDays !== null ? ` · ${week.costDays}d matched` : ""}` : ""; return `<button class="week" type="button" role="option" data-week="${week.index}" ${focused ? "data-focus-week aria-current=\"true\" aria-selected=\"true\"" : "aria-selected=\"false\""} aria-label="${esc(`${week.calendar}: ${primary === null ? "no record" : format(primary, sourceUnit, hasCompleteCostSeries)}`)}"><span class="week-date">${esc(week.range)}<small>Mon–Sun · W${week.isoWeek}${week.days !== null ? ` · ${week.days}d` : ""}</small></span><span class="track"><i class="bar ${tone}" style="width:${ratio}%"></i>${planRatio === null ? "" : `<i class="plan-tick" style="left:${planRatio}%"></i>`}</span><span class="week-value">${finite(primary) ? `<strong>${esc(format(primary, sourceUnit, hasCompleteCostSeries))}</strong>${supporting ? `<small>${esc(supporting)}</small>` : ""}` : `<strong class="no-record">No record</strong>`}</span></button>`; }).join("")}</div></div></section>
          <div class="controls"><button type="button" data-jump="oldest" data-oldest="${weeks.length - 1}">Oldest</button><button type="button" data-jump="latest">Latest</button></div>
        ` : `<section class="empty">${historyLoading ? "Loading Recorder statistics for the approved source…" : this.statisticsEnabled() ? "No recorded statistics are available for the approved source yet." : "Weekly statistics are disabled. Add statistics: true to this card configuration."}</section>`}
        <section class="sources"><div class="sources-head"><h3>Sources used</h3><span>${sourceCards.filter((source) => source.live).length} live · ${sourceCards.length} approved</span></div>${sourceCards.length ? `<div class="source-grid">${sourceCards.map((source) => `<div class="source"><span class="role">${esc(source.role)}</span><b title="${esc(source.label)}">${esc(source.label)}</b><span class="source-value">${esc(source.value)}</span><small>${esc(source.entityId)}</small></div>`).join("")}</div>` : `<div class="empty">No approved source in this system.</div>`}<p class="source-note">${hasCompleteCostSeries ? `${esc(costLabel)} is shown only for the matching archived weeks; it is not an invoice or cash-spend ledger.` : archiveWarnings.length ? esc(archiveWarnings.join(" · ")) : "Add approved cost sources and matching archived weekly costs only when their source and coverage have been validated."}</p></section>
        ${allSensors.length ? `<details ${this._expanded ? "open" : ""}><summary>Full administrator sensor catalogue · ${allSensors.filter(available).length}/${allSensors.length} available</summary><div class="catalog">${Object.entries(groups).sort(([a,], [b,]) => a.localeCompare(b)).map(([label, entries]) => `<h4>${esc(label)} · ${entries.length}</h4><div class="source-grid">${entries.sort((a, b) => name(a).localeCompare(name(b))).map((entity) => `<div class="source"><b title="${esc(name(entity))}">${esc(name(entity))}</b><span class="source-value">${esc(display(entity))}</span><small>${esc(entity.entity_id)}</small></div>`).join("")}</div>`).join("")}</div></details>` : ""}
        <div class="footnote">Oriel reads approved Home Assistant states already present in this signed-in dashboard. ${this.statisticsEnabled() ? "Weekly consumption statistics use a read-only Recorder query for the selected approved source only." : "No Recorder history is requested."} It has no control buttons, external requests, tokens or service calls.</div>
      </article>`;
    this.afterRender();
  }
}

if (!customElements.get("oriel-card")) customElements.define("oriel-card", OrielCard);

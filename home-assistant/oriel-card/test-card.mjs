import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('./oriel-card.js', import.meta.url), 'utf8');

function card() {
  const registered = new Map();
  class Element {
    constructor() { this.emittedEvents = []; }
    dispatchEvent(event) { this.emittedEvents.push(event); return true; }
    attachShadow() {
      const systemButtons = [];
      const entityButtons = [];
      const archiveButtons = [];
      const archiveCloseButtons = [];
      let breakdownDetails = null;
      const shadow = {
        _innerHTML: '',
        get innerHTML() { return this._innerHTML; },
        set innerHTML(value) {
          this._innerHTML = value;
          systemButtons.length = 0;
          entityButtons.length = 0;
          archiveButtons.length = 0;
          archiveCloseButtons.length = 0;
          for (const match of String(value).matchAll(/data-system="([^"]+)"/g)) {
            const listeners = {};
            systemButtons.push({
              dataset: { system: match[1] },
              addEventListener: (type, listener) => { listeners[type] = listener; },
              listeners,
            });
          }
          for (const match of String(value).matchAll(/<button\b[^>]*data-entity="([^"]+)"[^>]*>/g)) {
            const listeners = {};
            entityButtons.push({
              dataset: { entity: match[1] },
              addEventListener: (type, listener) => { listeners[type] = listener; },
              listeners,
            });
          }
          for (const match of String(value).matchAll(/<button\b[^>]*data-archive-entity="([^"]+)"[^>]*>/g)) {
            const listeners = {};
            archiveButtons.push({
              dataset: { archiveEntity: match[1] },
              addEventListener: (type, listener) => { listeners[type] = listener; },
              listeners,
            });
          }
          for (const _match of String(value).matchAll(/<button\b[^>]*data-close-archive[^>]*>/g)) {
            const listeners = {};
            archiveCloseButtons.push({
              dataset: {},
              addEventListener: (type, listener) => { listeners[type] = listener; },
              listeners,
            });
          }
          const breakdown = String(value).match(/<details class="breakdown" data-breakdown="([^"]+)"( open)?/);
          breakdownDetails = breakdown ? (() => {
            const listeners = {};
            return {
              dataset: { breakdown: breakdown[1] },
              open: Boolean(breakdown[2]),
              addEventListener: (type, listener) => { listeners[type] = listener; },
              listeners,
            };
          })() : null;
        },
        querySelectorAll: (selector) => selector === '[data-system]' ? systemButtons : selector === '[data-entity]' ? entityButtons : selector === '[data-archive-entity]' ? archiveButtons : selector === '[data-close-archive]' ? archiveCloseButtons : [],
        querySelector: (selector) => selector === '[data-breakdown]' ? breakdownDetails : null,
        systemButtons,
        entityButtons,
        archiveButtons,
        archiveCloseButtons,
        get breakdownDetails() { return breakdownDetails; },
      };
      this.shadowRoot = shadow;
      return shadow;
    }
  }
  class TestCustomEvent {
    constructor(type, init = {}) { this.type = type; Object.assign(this, init); }
  }
  const context = vm.createContext({ Array, CustomEvent: TestCustomEvent, Date, HTMLElement: Element, Intl, Math, Number, Object, Promise, RegExp, String, customElements: { define: (name, ctor) => registered.set(name, ctor), get: (name) => registered.get(name) } });
  vm.runInContext(`${source}\nglobalThis.Card = OrielCard;`, context);
  return new context.Card();
}

const state = (entity_id, value, friendly_name, unit, device_class) => ({ entity_id, state: String(value), attributes: { friendly_name, unit_of_measurement: unit, device_class }, last_updated: new Date().toISOString() });
const flush = async () => {
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
};

test('uses only explicitly approved sources and requests Recorder statistics only for the selected source', async () => {
  const subject = card();
  let request;
  subject.setConfig({ type: 'custom:oriel-card', statistics: true, entity_ids: { electricity: ['sensor.fixture_energy'], water: [], fuel: [], power: [] } });
  subject.hass = {
    states: {
      'sensor.fixture_energy': state('sensor.fixture_energy', 4200, 'Approved meter', 'kWh', 'energy'),
      'sensor.irrelevant_diagnostic': state('sensor.irrelevant_diagnostic', 99, 'Irrelevant diagnostic', '%', 'battery'),
    },
    callWS: async (payload) => { request = payload; return { 'sensor.fixture_energy': [] }; },
  };
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  assert.equal(request.type, 'history/history_during_period');
  assert.deepEqual(Array.from(request.entity_ids), ['sensor.fixture_energy']);
  assert.equal(request.minimal_response, true);
  assert.equal(request.no_attributes, true);
  assert.match(subject.shadowRoot.innerHTML, /Approved meter/);
  assert.doesNotMatch(subject.shadowRoot.innerHTML, /Irrelevant diagnostic/);
});

test('does not query Recorder unless statistics are explicitly enabled', async () => {
  const subject = card();
  let calls = 0;
  subject.setConfig({ type: 'custom:oriel-card', entity_ids: { electricity: ['sensor.fixture_energy'], water: [], fuel: [], power: [] } });
  subject.hass = { states: { 'sensor.fixture_energy': state('sensor.fixture_energy', 4200, 'Approved meter', 'kWh', 'energy') }, callWS: async () => { calls += 1; return {}; } };
  await Promise.resolve(); await Promise.resolve();
  assert.equal(calls, 0);
  assert.match(subject.shadowRoot.innerHTML, /Weekly statistics are disabled/);
});

test('does not infer an approved source from the complete sensor state map', async () => {
  const subject = card();
  let calls = 0;
  subject.setConfig({ type: 'custom:oriel-card', statistics: true });
  subject.hass = {
    states: { 'sensor.shellypro3em_fixture_energy': state('sensor.shellypro3em_fixture_energy', 4200, 'Unapproved meter', 'kWh', 'energy') },
    callWS: async () => { calls += 1; return {}; },
  };
  await Promise.resolve(); await Promise.resolve();
  assert.equal(calls, 0);
  assert.match(subject.shadowRoot.innerHTML, /No approved source/);
  assert.doesNotMatch(subject.shadowRoot.innerHTML, /Unapproved meter/);
});

test('renders each system selector as a non-submitting navigation button', async () => {
  const subject = card();
  subject.setConfig({ type: 'custom:oriel-card', entity_ids: { electricity: ['sensor.fixture_energy'], water: [], fuel: [], power: [] } });
  subject.hass = { states: { 'sensor.fixture_energy': state('sensor.fixture_energy', 4200, 'Approved meter', 'kWh', 'energy') } };
  await Promise.resolve(); await Promise.resolve();
  for (const system of ['electricity', 'water', 'fuel', 'power']) {
    assert.match(subject.shadowRoot.innerHTML, new RegExp(`<button class="tab" type="button" data-system="${system}"`));
  }
});

test('switches systems from the tab button after its native click finishes', async () => {
  const subject = card();
  subject.setConfig({
    type: 'custom:oriel-card',
    entity_ids: { electricity: ['sensor.fixture_energy'], water: ['sensor.fixture_water'], fuel: [], power: [] },
    archive_weekly_values: { electricity: [100], water: [24] },
    archive_weekly_recorded_days: { electricity: [7], water: [7] },
  });
  subject.hass = {
    states: {
      'sensor.fixture_energy': state('sensor.fixture_energy', 4200, 'Approved meter', 'kWh', 'energy'),
      'sensor.fixture_water': state('sensor.fixture_water', 240, 'Approved water meter', 'L', 'water'),
    },
  };
  await Promise.resolve(); await Promise.resolve();
  const water = subject.shadowRoot.systemButtons.find((button) => button.dataset.system === 'water');
  assert.ok(water);
  let prevented = false;
  let stopped = false;
  water.listeners.click({
    preventDefault: () => { prevented = true; },
    stopPropagation: () => { stopped = true; },
  });
  await Promise.resolve();
  assert.equal(subject._selected, 'water');
  assert.equal(prevented, true);
  assert.equal(stopped, true);
  assert.match(subject.shadowRoot.innerHTML, /Water weekly record/);
});

test('opens an approved live source in the native Home Assistant more-info dialog', async () => {
  const subject = card();
  subject.setConfig({ type: 'custom:oriel-card', entity_ids: { electricity: ['sensor.fixture_energy'], water: [], fuel: [], power: [] } });
  subject.hass = { states: { 'sensor.fixture_energy': state('sensor.fixture_energy', 4200, 'Approved meter', 'kWh', 'energy') } };
  await Promise.resolve(); await Promise.resolve();
  const sourceButton = subject.shadowRoot.entityButtons.find((button) => button.dataset.entity === 'sensor.fixture_energy');
  assert.ok(sourceButton);
  let prevented = false;
  let stopped = false;
  sourceButton.listeners.click({ preventDefault: () => { prevented = true; }, stopPropagation: () => { stopped = true; } });
  assert.equal(prevented, true);
  assert.equal(stopped, true);
  assert.equal(subject.emittedEvents.length, 1);
  assert.equal(subject.emittedEvents[0].type, 'hass-more-info');
  assert.equal(subject.emittedEvents[0].detail.entityId, 'sensor.fixture_energy');
  assert.equal(subject.emittedEvents[0].bubbles, true);
  assert.equal(subject.emittedEvents[0].composed, true);
});

test('opens an archive-only tariff component as a transparent in-card archive record', async () => {
  const subject = card();
  subject.setConfig({
    type: 'custom:oriel-card',
    entity_ids: { electricity: ['sensor.fixture_energy'], water: [], fuel: [], power: [] },
    archive_cost_source_labels: { electricity: 'Tariff estimate · imported Home Assistant record · 38.4p/kWh' },
    archive_source_details: { electricity: [{ entity_id: 'sensor.archive_only_cost', label: 'Archived cost source', role: 'Tariff component' }] },
  });
  subject.hass = { states: { 'sensor.fixture_energy': state('sensor.fixture_energy', 4200, 'Approved meter', 'kWh', 'energy') } };
  await Promise.resolve(); await Promise.resolve();
  assert.equal(subject.shadowRoot.entityButtons.some((button) => button.dataset.entity === 'sensor.archive_only_cost'), false);
  const archiveButton = subject.shadowRoot.archiveButtons.find((button) => button.dataset.archiveEntity === 'sensor.archive_only_cost');
  assert.ok(archiveButton);
  let prevented = false;
  let stopped = false;
  archiveButton.listeners.click({ preventDefault: () => { prevented = true; }, stopPropagation: () => { stopped = true; } });
  await Promise.resolve();
  assert.equal(prevented, true);
  assert.equal(stopped, true);
  assert.equal(subject._selectedArchiveSource, 'sensor.archive_only_cost');
  assert.equal(subject.emittedEvents.length, 0);
  assert.match(subject.shadowRoot.innerHTML, /class="archive-modal"/);
  assert.match(subject.shadowRoot.innerHTML, /role="dialog" aria-modal="true"/);
  assert.match(subject.shadowRoot.innerHTML, /Archive source record/);
  assert.match(subject.shadowRoot.innerHTML, /sensor\.archive_only_cost/);
  assert.match(subject.shadowRoot.innerHTML, /Tariff component/);
  assert.match(subject.shadowRoot.innerHTML, /Archive-only source — no current state is available/);
  assert.match(subject.shadowRoot.innerHTML, /Tariff estimate · imported Home Assistant record · 38\.4p\/kWh/);
  assert.doesNotMatch(subject.shadowRoot.innerHTML, /href="\/history/);
  const close = subject.shadowRoot.archiveCloseButtons[0];
  assert.ok(close);
  close.listeners.click();
  await Promise.resolve();
  assert.equal(subject._selectedArchiveSource, null);
  assert.doesNotMatch(subject.shadowRoot.innerHTML, /Archive source record/);
});

test('clears an archive inspector when a system is changed or the configuration is replaced', async () => {
  const subject = card();
  subject.setConfig({
    type: 'custom:oriel-card',
    entity_ids: { electricity: ['sensor.fixture_energy'], water: ['sensor.fixture_water'], fuel: [], power: [] },
    archive_source_details: { electricity: [{ entity_id: 'sensor.archive_only_cost', label: 'Archived cost source' }] },
  });
  subject.hass = {
    states: {
      'sensor.fixture_energy': state('sensor.fixture_energy', 4200, 'Approved meter', 'kWh', 'energy'),
      'sensor.fixture_water': state('sensor.fixture_water', 240, 'Approved water meter', 'L', 'water'),
    },
  };
  await Promise.resolve(); await Promise.resolve();
  subject.openArchiveSource('sensor.archive_only_cost');
  await Promise.resolve();
  assert.equal(subject._selectedArchiveSource, 'sensor.archive_only_cost');
  subject.selectSystem('water');
  await Promise.resolve();
  assert.equal(subject._selectedArchiveSource, null);
  subject.openArchiveSource('sensor.archive_only_cost');
  subject.setConfig({ type: 'custom:oriel-card', entity_ids: { electricity: ['sensor.fixture_energy'], water: [], fuel: [], power: [] } });
  assert.equal(subject._selectedArchiveSource, null);
});

test('uses native Home Assistant details when a configured archive id has a current state', async () => {
  const subject = card();
  subject.setConfig({
    type: 'custom:oriel-card',
    entity_ids: { electricity: ['sensor.fixture_energy'], water: [], fuel: [], power: [] },
    archive_source_details: { electricity: [{ entity_id: 'sensor.fixture_live_cost', label: 'Published cost source' }] },
  });
  subject.hass = {
    states: {
      'sensor.fixture_energy': state('sensor.fixture_energy', 4200, 'Approved meter', 'kWh', 'energy'),
      'sensor.fixture_live_cost': state('sensor.fixture_live_cost', 10, 'Published cost source', 'GBP', 'monetary'),
    },
  };
  await Promise.resolve(); await Promise.resolve();
  assert.equal(subject.shadowRoot.archiveButtons.some((button) => button.dataset.archiveEntity === 'sensor.fixture_live_cost'), false);
  const source = subject.shadowRoot.entityButtons.find((button) => button.dataset.entity === 'sensor.fixture_live_cost');
  assert.ok(source);
  source.listeners.click({ preventDefault() {}, stopPropagation() {} });
  assert.equal(subject.emittedEvents.at(-1).detail.entityId, 'sensor.fixture_live_cost');
});

test('does not recursively render an initially-open source breakdown', async () => {
  const subject = card();
  subject.setConfig({
    type: 'custom:oriel-card',
    entity_ids: { electricity: ['sensor.fixture_energy'], water: [], fuel: [], power: [] },
    archive_weekly_values: { electricity: [100] },
    archive_weekly_recorded_days: { electricity: [7] },
    source_breakdowns: {
      electricity: {
        open: true,
        sources: [{ entity_id: 'sensor.fixture_feeder', archive_weekly_values: [50], archive_weekly_recorded_days: [7] }],
      },
    },
  });
  subject.hass = {
    states: {
      'sensor.fixture_energy': state('sensor.fixture_energy', 4200, 'Approved meter', 'kWh', 'energy'),
      'sensor.fixture_feeder': state('sensor.fixture_feeder', 42, 'Approved feeder', 'kWh', 'energy'),
    },
  };
  await Promise.resolve(); await Promise.resolve();
  const breakdown = subject.shadowRoot.breakdownDetails;
  assert.ok(breakdown);
  assert.equal(subject._breakdownOpen.get('electricity'), true);
  breakdown.listeners.toggle();
  assert.equal(subject._renderQueued, false);
  breakdown.open = false;
  breakdown.listeners.toggle();
  assert.equal(subject._breakdownOpen.get('electricity'), false);
  assert.equal(subject._renderQueued, false);
  breakdown.open = true;
  breakdown.listeners.toggle();
  assert.equal(subject._renderQueued, true);
});

test('does not request another ribbon-centre animation for an ordinary Home Assistant state refresh', async () => {
  const subject = card();
  subject.setConfig({ type: 'custom:oriel-card', entity_ids: { electricity: ['sensor.fixture_energy'], water: [], fuel: [], power: [] } });
  subject._pendingTimelineCenter = false;
  subject.hass = { states: { 'sensor.fixture_energy': state('sensor.fixture_energy', 4200, 'Approved meter', 'kWh', 'energy') } };
  await Promise.resolve(); await Promise.resolve();
  assert.equal(subject._pendingTimelineCenter, false);
  assert.doesNotMatch(source, /scroll-behavior:smooth/);
  assert.doesNotMatch(source, /scroll-snap-type:y mandatory/);
});

test('requests Recorder data from UK midnight instead of 01:00 during BST and includes a baseline week', async () => {
  const subject = card();
  let request;
  subject.setConfig({
    type: 'custom:oriel-card',
    history_weeks: 1,
    statistics: { history: true, anchor: '2026-09-19T12:00:00.000Z', timezone: 'Europe/London' },
    entity_ids: { electricity: ['sensor.fixture_energy'], water: [], fuel: [], power: [] },
  });
  subject.hass = {
    states: { 'sensor.fixture_energy': state('sensor.fixture_energy', 4200, 'Approved meter', 'kWh', 'energy') },
    callWS: async (payload) => { request = payload; return { 'sensor.fixture_energy': [] }; },
  };
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  assert.equal(request.start_time, '2026-09-06T23:00:00.000Z');
});

test('uses Home Assistant minimal Recorder payload fields and does not treat a total counter as weekly use', async () => {
  const subject = card();
  const baseline = Math.floor(Date.parse('2026-09-13T23:00:00.000Z') / 1000);
  const terminal = Math.floor(Date.parse('2026-09-17T12:00:00.000Z') / 1000);
  subject.setConfig({
    type: 'custom:oriel-card',
    history_weeks: 1,
    statistics: { history: true, anchor: '2026-09-19T12:00:00.000Z', timezone: 'Europe/London' },
    entity_ids: { electricity: ['sensor.fixture_energy'], water: [], fuel: [], power: [] },
  });
  subject.hass = {
    states: { 'sensor.fixture_energy': { ...state('sensor.fixture_energy', 4200, 'Approved meter', 'kWh', 'energy'), attributes: { friendly_name: 'Approved meter', unit_of_measurement: 'kWh', device_class: 'energy', state_class: 'total_increasing' } } },
    callWS: async () => ({ 'sensor.fixture_energy': [{ s: '100', lu: baseline }, { s: '150', lu: terminal }] }),
  };
  await flush();
  assert.match(subject.shadowRoot.innerHTML, /50 kWh/);
  assert.doesNotMatch(subject.shadowRoot.innerHTML, /150 kWh/);
});

test('withholds a Recorder week with only one cumulative point or a counter reset', async () => {
  for (const samples of [
    [{ s: '4200', lu: Math.floor(Date.parse('2026-09-17T12:00:00.000Z') / 1000) }],
    [{ s: '100', lu: Math.floor(Date.parse('2026-09-13T23:00:00.000Z') / 1000) }, { s: '10', lu: Math.floor(Date.parse('2026-09-17T12:00:00.000Z') / 1000) }],
  ]) {
    const subject = card();
    subject.setConfig({
      type: 'custom:oriel-card', history_weeks: 1,
      statistics: { history: true, anchor: '2026-09-19T12:00:00.000Z', timezone: 'Europe/London' },
      entity_ids: { electricity: ['sensor.fixture_energy'], water: [], fuel: [], power: [] },
    });
    subject.hass = {
      states: { 'sensor.fixture_energy': { ...state('sensor.fixture_energy', 4200, 'Approved meter', 'kWh', 'energy'), attributes: { friendly_name: 'Approved meter', unit_of_measurement: 'kWh', device_class: 'energy', state_class: 'total_increasing' } } },
      callWS: async () => ({ 'sensor.fixture_energy': samples }),
    };
    await flush();
    assert.match(subject.shadowRoot.innerHTML, /No verified use/);
    assert.match(subject.shadowRoot.innerHTML, /No record/);
  }
});

test('uses calendar-correct UK week boundaries across both daylight-saving changes', async () => {
  const subject = card();
  const requests = [];
  subject.setConfig({
    type: 'custom:oriel-card', history_weeks: 2,
    statistics: { history: true, anchor: '2026-11-04T12:00:00.000Z' },
    entity_ids: { electricity: ['sensor.fixture_energy'], water: [], fuel: [], power: [] },
  });
  subject.hass = {
    states: { 'sensor.fixture_energy': state('sensor.fixture_energy', 4200, 'Approved meter', 'kWh', 'energy') },
    callWS: async (payload) => { requests.push(payload); return { 'sensor.fixture_energy': [] }; },
  };
  await flush();
  assert.equal(requests[0].start_time, '2026-10-18T23:00:00.000Z');

  const march = card();
  march.setConfig({
    type: 'custom:oriel-card', history_weeks: 2,
    statistics: { history: true, anchor: '2026-04-01T12:00:00.000Z' },
    entity_ids: { electricity: ['sensor.fixture_energy'], water: [], fuel: [], power: [] },
  });
  march.hass = {
    states: { 'sensor.fixture_energy': state('sensor.fixture_energy', 4200, 'Approved meter', 'kWh', 'energy') },
    callWS: async () => ({ 'sensor.fixture_energy': [
      { s: '100', lu: Math.floor(Date.parse('2026-03-23T00:00:00.000Z') / 1000) },
      { s: '130', lu: Math.floor(Date.parse('2026-03-28T12:00:00.000Z') / 1000) },
      // Monday 30 March 00:30 UK is part of the next week, not W13.
      { s: '999', lu: Math.floor(Date.parse('2026-03-29T23:30:00.000Z') / 1000) },
    ] }),
  };
  await flush();
  march._selectedWeek = 1;
  march.render();
  assert.match(march.shadowRoot.innerHTML, /class="focus-value">30 kWh/);
});

test('surfaces Recorder access errors and ignores a late response from a replaced configuration', async () => {
  const subject = card();
  let resolveOld;
  let calls = 0;
  subject.setConfig({
    type: 'custom:oriel-card', history_weeks: 1,
    statistics: { history: true, anchor: '2026-09-19T12:00:00.000Z' },
    entity_ids: { electricity: ['sensor.fixture_energy'], water: [], fuel: [], power: [] },
  });
  subject.hass = {
    states: { 'sensor.fixture_energy': state('sensor.fixture_energy', 4200, 'Approved meter', 'kWh', 'energy') },
    callWS: () => {
      calls += 1;
      return calls === 1 ? new Promise((resolve) => { resolveOld = resolve; }) : Promise.reject(new Error('denied'));
    },
  };
  await flush();
  subject.setConfig({
    type: 'custom:oriel-card', history_weeks: 1,
    statistics: { history: true, anchor: '2026-08-19T12:00:00.000Z' },
    entity_ids: { electricity: ['sensor.fixture_energy'], water: [], fuel: [], power: [] },
  });
  await flush();
  resolveOld({ 'sensor.fixture_energy': [{ s: '100', lu: 0 }, { s: '999', lu: 1 }] });
  await flush();
  assert.equal(calls, 2);
  assert.match(subject.shadowRoot.innerHTML, /Recorder history is unavailable to this signed-in user/);
  assert.doesNotMatch(subject.shadowRoot.innerHTML, /999 kWh/);
});

test('does not silently substitute a secondary source or render malformed archive dates', async () => {
  const subject = card();
  let calls = 0;
  subject.setConfig({
    type: 'custom:oriel-card', statistics: true,
    archive_anchor: 'not-a-date',
    entity_ids: { electricity: ['sensor.primary_missing', 'sensor.fixture_secondary'], water: [], fuel: [], power: [] },
    archive_weekly_values: { electricity: [999] },
    archive_week_starts: { electricity: ['2026-09-15'] },
  });
  subject.hass = {
    states: { 'sensor.fixture_secondary': state('sensor.fixture_secondary', 4200, 'Secondary feeder', 'kWh', 'energy') },
    callWS: async () => { calls += 1; return {}; },
  };
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  assert.equal(calls, 0);
  assert.match(subject.shadowRoot.innerHTML, /Primary source sensor\.primary_missing is not present/);
  assert.match(subject.shadowRoot.innerHTML, /archive_anchor is invalid; imported history is withheld/);
  assert.doesNotMatch(subject.shadowRoot.innerHTML, /999 kWh/);
});

test('keeps imported closed weeks and current Recorder use visibly separate in hybrid mode', async () => {
  const subject = card();
  subject.setConfig({
    type: 'custom:oriel-card', history_weeks: 1,
    archive_anchor: '2026-09-19T12:00:00.000Z',
    archive_week_starts: { electricity: ['2026-09-14'] },
    archive_weekly_values: { electricity: [312.9] },
    statistics: { history: true, anchor: '2026-09-19T12:00:00.000Z' },
    entity_ids: { electricity: ['sensor.fixture_energy'], water: [], fuel: [], power: [] },
  });
  subject.hass = {
    states: { 'sensor.fixture_energy': state('sensor.fixture_energy', 4200, 'Approved meter', 'kWh', 'energy') },
    callWS: async () => ({ 'sensor.fixture_energy': [
      { s: '100', lu: Math.floor(Date.parse('2026-09-13T23:00:00.000Z') / 1000) },
      { s: '150', lu: Math.floor(Date.parse('2026-09-17T12:00:00.000Z') / 1000) },
    ] }),
  };
  await flush();
  assert.match(subject.shadowRoot.innerHTML, /312\.9 kWh/);
  assert.match(subject.shadowRoot.innerHTML, /This UK week · Recorder/);
  assert.match(subject.shadowRoot.innerHTML, /50 kWh/);
  assert.match(subject.shadowRoot.innerHTML, /intentionally separate from the imported closed-week record/);
});

test('updates the live snapshot from Home Assistant state pushes without a hard reload', async () => {
  const subject = card();
  subject.setConfig({ type: 'custom:oriel-card', entity_ids: { electricity: ['sensor.fixture_energy'], water: [], fuel: [], power: [] } });
  subject.hass = { states: { 'sensor.fixture_energy': state('sensor.fixture_energy', 4200, 'Approved meter', 'kWh', 'energy') } };
  await flush();
  assert.match(subject.shadowRoot.innerHTML, /4,200 kWh/);
  subject.hass = { states: { 'sensor.fixture_energy': state('sensor.fixture_energy', 4212.3, 'Approved meter', 'kWh', 'energy') } };
  await flush();
  assert.match(subject.shadowRoot.innerHTML, /4,212\.3 kWh/);
});

test('renders imported records as a UK Monday–Sunday focus ribbon', async () => {
  const subject = card();
  subject.setConfig({
    type: 'custom:oriel-card',
    archive_anchor: '2026-09-19T12:00:00.000Z',
    archive_timezone: 'Europe/London',
    entity_ids: { electricity: ['sensor.fixture_energy'], water: [], fuel: [], power: [] },
    archive_weekly_values: { electricity: [312.9, 824.5] },
  });
  subject.hass = { states: { 'sensor.fixture_energy': state('sensor.fixture_energy', 4200, 'Approved meter', 'kWh', 'energy') } };
  await Promise.resolve(); await Promise.resolve();
  assert.match(subject.shadowRoot.innerHTML, /2 weeks to focus/);
  assert.match(subject.shadowRoot.innerHTML, /UK Mon–Sun · 2026-09-14 → 2026-09-20/);
  assert.match(subject.shadowRoot.innerHTML, /14–20 Sept 2026/);
  assert.match(subject.shadowRoot.innerHTML, /7–13 Sept 2026/);
});

test('shows approved archived tariff cost without inventing a plan or cash spend', async () => {
  const subject = card();
  subject.setConfig({
    type: 'custom:oriel-card',
    archive_anchor: '2026-09-19T12:00:00.000Z',
    archive_timezone: 'Europe/London',
    entity_ids: { electricity: ['sensor.fixture_energy'], water: [], fuel: [], power: [] },
    cost_entity_ids: { electricity: ['sensor.fixture_cost_a', 'sensor.fixture_cost_b', 'sensor.fixture_cost_c'] },
    archive_weekly_values: { electricity: [290] },
    archive_weekly_costs: { electricity: [74.2038] },
    archive_weekly_day_counts: { electricity: [5] },
    archive_weekly_cost_matching_days: { electricity: [4] },
    archive_cost_source_labels: { electricity: 'Tariff estimate · Home Assistant published · 38.4p/kWh' },
  });
  subject.hass = {
    states: {
      'sensor.fixture_energy': state('sensor.fixture_energy', 4200, 'House Input', 'kWh', 'energy'),
      'sensor.fixture_cost_a': state('sensor.fixture_cost_a', 10, 'Energy cost · phase A', 'GBP', 'monetary'),
      'sensor.fixture_cost_b': state('sensor.fixture_cost_b', 10, 'Energy cost · phase B', 'GBP', 'monetary'),
      'sensor.fixture_cost_c': state('sensor.fixture_cost_c', 10, 'Energy cost · phase C', 'GBP', 'monetary'),
    },
  };
  await Promise.resolve(); await Promise.resolve();
  assert.match(subject.shadowRoot.innerHTML, /£74\.20/);
  assert.match(subject.shadowRoot.innerHTML, /4 matching days/);
  assert.match(subject.shadowRoot.innerHTML, /Tariff estimate · Home Assistant published · 38\.4p\/kWh/);
  assert.match(subject.shadowRoot.innerHTML, /No approved plan/);
  assert.doesNotMatch(subject.shadowRoot.innerHTML, /Invoice actual/);
});

test('shows a verified current UK-week tariff estimate only from approved reset-free Recorder counters', async () => {
  const subject = card();
  const calls = [];
  const baseline = Math.floor(Date.parse('2026-09-13T23:00:00.000Z') / 1000);
  const terminal = Math.floor(Date.parse('2026-09-17T12:00:00.000Z') / 1000);
  const totalIncreasingEnergy = (id, amount, label) => ({
    ...state(id, amount, label, 'kWh', 'energy'),
    attributes: { friendly_name: label, unit_of_measurement: 'kWh', device_class: 'energy', state_class: 'total_increasing' },
  });
  const totalIncreasingMoney = (id, amount, label) => ({
    ...state(id, amount, label, 'GBP', 'monetary'),
    attributes: { friendly_name: label, unit_of_measurement: 'GBP', device_class: 'monetary', state_class: 'total_increasing' },
  });
  const histories = {
    'sensor.fixture_energy': [{ s: '1000', lu: baseline }, { s: '1050', lu: terminal }],
    'sensor.fixture_cost_a': [{ s: '100', lu: baseline }, { s: '110', lu: terminal }],
    'sensor.fixture_cost_b': [{ s: '200', lu: baseline }, { s: '204.5', lu: terminal }],
    'sensor.fixture_cost_c': [{ s: '300', lu: baseline }, { s: '301', lu: terminal }],
  };
  subject.setConfig({
    type: 'custom:oriel-card', history_weeks: 1,
    statistics: { history: true, cost_history: true, anchor: '2026-09-19T12:00:00.000Z', timezone: 'Europe/London' },
    entity_ids: { electricity: ['sensor.fixture_energy'], water: [], fuel: [], power: [] },
    cost_entity_ids: { electricity: ['sensor.fixture_cost_a', 'sensor.fixture_cost_b', 'sensor.fixture_cost_c'] },
  });
  subject.hass = {
    states: {
      'sensor.fixture_energy': totalIncreasingEnergy('sensor.fixture_energy', 9999, 'House Input'),
      // These current totals are intentionally unlike the weekly deltas below.
      // Their values must never be added to form the tariff estimate.
      'sensor.fixture_cost_a': totalIncreasingMoney('sensor.fixture_cost_a', 900, 'Phase A cost'),
      'sensor.fixture_cost_b': totalIncreasingMoney('sensor.fixture_cost_b', 700, 'Phase B cost'),
      'sensor.fixture_cost_c': totalIncreasingMoney('sensor.fixture_cost_c', 500, 'Phase C cost'),
    },
    callWS: async (payload) => {
      calls.push(payload);
      const id = payload.entity_ids[0];
      return { [id]: histories[id] || [] };
    },
  };
  await flush();
  assert.equal(calls.length, 4);
  assert.ok(calls.every((payload) => payload.type === 'history/history_during_period'));
  assert.ok(calls.every((payload) => payload.minimal_response === true && payload.no_attributes === true));
  const costCalls = calls.filter((payload) => payload.entity_ids[0].startsWith('sensor.fixture_cost_'));
  assert.deepEqual(costCalls.map((payload) => payload.entity_ids[0]).sort((a, b) => a.localeCompare(b)), ['sensor.fixture_cost_a', 'sensor.fixture_cost_b', 'sensor.fixture_cost_c']);
  assert.ok(costCalls.every((payload) => payload.start_time === '2026-09-06T23:00:00.000Z'));
  assert.match(subject.shadowRoot.innerHTML, /This UK week · tariff estimate/);
  assert.match(subject.shadowRoot.innerHTML, /£15\.50/);
  assert.match(subject.shadowRoot.innerHTML, /Recorder through/);
  assert.match(subject.shadowRoot.innerHTML, /not an invoice, cash-spend ledger or sum of current monetary states/);
  assert.doesNotMatch(subject.shadowRoot.innerHTML, /£2,100\.00/);
});

test('withholds a current tariff estimate if any approved monetary counter has a reset', async () => {
  const subject = card();
  const baseline = Math.floor(Date.parse('2026-09-13T23:00:00.000Z') / 1000);
  const reset = Math.floor(Date.parse('2026-09-15T12:00:00.000Z') / 1000);
  const terminal = Math.floor(Date.parse('2026-09-17T12:00:00.000Z') / 1000);
  const moneyCounter = (id, amount, label) => ({
    ...state(id, amount, label, 'GBP', 'monetary'),
    attributes: { friendly_name: label, unit_of_measurement: 'GBP', device_class: 'monetary', state_class: 'total_increasing' },
  });
  subject.setConfig({
    type: 'custom:oriel-card', history_weeks: 1,
    statistics: { history: true, cost_history: true, anchor: '2026-09-19T12:00:00.000Z', timezone: 'Europe/London' },
    entity_ids: { electricity: ['sensor.fixture_energy'], water: [], fuel: [], power: [] },
    cost_entity_ids: { electricity: ['sensor.fixture_cost_a', 'sensor.fixture_cost_b'] },
  });
  subject.hass = {
    states: {
      'sensor.fixture_energy': { ...state('sensor.fixture_energy', 4200, 'House Input', 'kWh', 'energy'), attributes: { friendly_name: 'House Input', unit_of_measurement: 'kWh', device_class: 'energy', state_class: 'total_increasing' } },
      'sensor.fixture_cost_a': moneyCounter('sensor.fixture_cost_a', 125, 'Phase A cost'),
      'sensor.fixture_cost_b': moneyCounter('sensor.fixture_cost_b', 205, 'Phase B cost'),
    },
    callWS: async (payload) => {
      const id = payload.entity_ids[0];
      const histories = {
        'sensor.fixture_energy': [{ s: '100', lu: baseline }, { s: '150', lu: terminal }],
        // The final value rises above the baseline, but the observed reset
        // makes the whole weekly cost mathematically ambiguous.
        'sensor.fixture_cost_a': [{ s: '100', lu: baseline }, { s: '10', lu: reset }, { s: '125', lu: terminal }],
        'sensor.fixture_cost_b': [{ s: '200', lu: baseline }, { s: '205', lu: terminal }],
      };
      return { [id]: histories[id] };
    },
  };
  await flush();
  assert.match(subject.shadowRoot.innerHTML, /No verified estimate/);
  assert.match(subject.shadowRoot.innerHTML, /Needs a cumulative, reset-free Recorder history for every approved tariff component/);
  assert.doesNotMatch(subject.shadowRoot.innerHTML, /£30\.00/);
});

test('does not read monetary Recorder history unless cost_history is explicitly enabled', async () => {
  const subject = card();
  const calls = [];
  subject.setConfig({
    type: 'custom:oriel-card', statistics: { history: true, anchor: '2026-09-19T12:00:00.000Z' },
    entity_ids: { electricity: ['sensor.fixture_energy'], water: [], fuel: [], power: [] },
    cost_entity_ids: { electricity: ['sensor.fixture_cost'] },
  });
  subject.hass = {
    states: {
      'sensor.fixture_energy': state('sensor.fixture_energy', 4200, 'House Input', 'kWh', 'energy'),
      'sensor.fixture_cost': { ...state('sensor.fixture_cost', 10, 'Phase cost', 'GBP', 'monetary'), attributes: { friendly_name: 'Phase cost', unit_of_measurement: 'GBP', device_class: 'monetary', state_class: 'total_increasing' } },
    },
    callWS: async (payload) => { calls.push(payload); return { [payload.entity_ids[0]]: [] }; },
  };
  await flush();
  assert.deepEqual(calls.map((payload) => payload.entity_ids[0]), ['sensor.fixture_energy']);
  assert.doesNotMatch(subject.shadowRoot.innerHTML, /This UK week · tariff estimate/);
});

test('withholds tariff pounds when matching coverage and approved cost metadata are incomplete', async () => {
  const subject = card();
  subject.setConfig({
    type: 'custom:oriel-card',
    entity_ids: { electricity: ['sensor.fixture_energy'], water: [], fuel: [], power: [] },
    archive_weekly_values: { electricity: [290] },
    archive_weekly_costs: { electricity: [74.2038] },
    archive_weekly_recorded_days: { electricity: [5] },
  });
  subject.hass = { states: { 'sensor.fixture_energy': state('sensor.fixture_energy', 4200, 'House Input', 'kWh', 'energy') } };
  await Promise.resolve(); await Promise.resolve();
  assert.doesNotMatch(subject.shadowRoot.innerHTML, /£74\.20/);
  assert.match(subject.shadowRoot.innerHTML, /tariff estimate withheld/);
  assert.match(subject.shadowRoot.innerHTML, /290 kWh/);
});

test('renders an explicitly approved, reconciled feeder breakdown without allocating tariff money', async () => {
  const subject = card();
  subject.setConfig({
    type: 'custom:oriel-card',
    archive_anchor: '2026-09-19T12:00:00.000Z',
    archive_timezone: 'Europe/London',
    entity_ids: { electricity: ['sensor.fixture_total'], water: [], fuel: [], power: [] },
    archive_weekly_values: { electricity: [100, 50] },
    archive_week_starts: { electricity: ['2026-09-14', '2026-09-07'] },
    archive_weekly_recorded_days: { electricity: [5, 7] },
    source_breakdowns: {
      electricity: {
        open: true,
        title: 'Metered House Input feeders',
        sources: [
          { entity_id: 'sensor.fixture_house', label: 'House', relation: 'part_of_total', archive_weekly_values: [55, 20], archive_weekly_recorded_days: [5, 7] },
          { entity_id: 'sensor.fixture_pool', label: 'Pool', relation: 'part_of_total', archive_weekly_values: [30, 20], archive_weekly_recorded_days: [5, 7] },
          { entity_id: 'sensor.fixture_garage', label: 'Garage', relation: 'part_of_total', archive_weekly_values: [15, 10], archive_weekly_recorded_days: [5, 7] },
        ],
      },
    },
  });
  subject.hass = {
    states: {
      'sensor.fixture_total': state('sensor.fixture_total', 4200, 'House Input', 'kWh', 'energy'),
      'sensor.fixture_house': state('sensor.fixture_house', 2200, 'House', 'kWh', 'energy'),
      'sensor.fixture_pool': state('sensor.fixture_pool', 1400, 'Pool', 'kWh', 'energy'),
      'sensor.fixture_garage': state('sensor.fixture_garage', 600, 'Garage', 'kWh', 'energy'),
    },
  };
  await Promise.resolve(); await Promise.resolve();
  assert.match(subject.shadowRoot.innerHTML, /Metered House Input feeders/);
  assert.match(subject.shadowRoot.innerHTML, /House/);
  assert.match(subject.shadowRoot.innerHTML, /Pool/);
  assert.match(subject.shadowRoot.innerHTML, /Garage/);
  assert.match(subject.shadowRoot.innerHTML, /55% of total/);
  assert.match(subject.shadowRoot.innerHTML, /30 kWh/);
  assert.match(subject.shadowRoot.innerHTML, /Approved component meters reconcile/);
  assert.doesNotMatch(subject.shadowRoot.innerHTML, /£30/);
  const house = subject.shadowRoot.entityButtons.find((button) => button.dataset.entity === 'sensor.fixture_house');
  assert.ok(house);
  house.listeners.click({ preventDefault() {}, stopPropagation() {} });
  assert.equal(subject.emittedEvents.at(-1).detail.entityId, 'sensor.fixture_house');
});

test('opens an archive-only room as a selected-week source detail without inventing a live state', async () => {
  const subject = card();
  subject.setConfig({
    type: 'custom:oriel-card',
    archive_anchor: '2026-09-19T12:00:00.000Z',
    archive_timezone: 'Europe/London',
    entity_ids: { electricity: ['sensor.fixture_total'], water: [], fuel: [], power: [] },
    archive_weekly_values: { electricity: [100] },
    archive_weekly_recorded_days: { electricity: [5] },
    source_breakdowns: {
      electricity: {
        open: true,
        sources: [{ entity_id: 'sensor.fixture_lodge', label: 'Lodge', relation: 'independent', archive_weekly_values: [42], archive_weekly_recorded_days: [5] }],
      },
    },
  });
  subject.hass = { states: { 'sensor.fixture_total': state('sensor.fixture_total', 4200, 'House Input', 'kWh', 'energy') } };
  await Promise.resolve(); await Promise.resolve();
  const lodge = subject.shadowRoot.archiveButtons.find((button) => button.dataset.archiveEntity === 'sensor.fixture_lodge');
  assert.ok(lodge);
  lodge.listeners.click({ preventDefault() {}, stopPropagation() {} });
  await Promise.resolve();
  assert.equal(subject.emittedEvents.length, 0);
  assert.match(subject.shadowRoot.innerHTML, /class="archive-modal"/);
  assert.match(subject.shadowRoot.innerHTML, /role="dialog" aria-modal="true"/);
  assert.match(subject.shadowRoot.innerHTML, /Recorded source detail/);
  assert.match(subject.shadowRoot.innerHTML, /Lodge/);
  assert.match(subject.shadowRoot.innerHTML, /Independent meter/);
  assert.match(subject.shadowRoot.innerHTML, /Mon 14 Sept – Sun 20 Sept 2026/);
  assert.match(subject.shadowRoot.innerHTML, /42 kWh/);
  assert.match(subject.shadowRoot.innerHTML, /5 recorded days/);
  assert.match(subject.shadowRoot.innerHTML, /Archive-only source — no current state is available/);
  assert.doesNotMatch(subject.shadowRoot.innerHTML, /£42/);
});

test('withholds an archive-only room detail when its weekly records do not align', async () => {
  const subject = card();
  subject.setConfig({
    type: 'custom:oriel-card',
    entity_ids: { electricity: ['sensor.fixture_total'], water: [], fuel: [], power: [] },
    archive_weekly_values: { electricity: [100, 50] },
    archive_weekly_recorded_days: { electricity: [5, 7] },
    source_breakdowns: {
      electricity: {
        open: true,
        sources: [{ entity_id: 'sensor.fixture_pool', label: 'Pool', relation: 'part_of_total', archive_weekly_values: [30] }],
      },
    },
  });
  subject.hass = { states: { 'sensor.fixture_total': state('sensor.fixture_total', 4200, 'House Input', 'kWh', 'energy') } };
  await Promise.resolve(); await Promise.resolve();
  const pool = subject.shadowRoot.archiveButtons.find((button) => button.dataset.archiveEntity === 'sensor.fixture_pool');
  assert.ok(pool);
  pool.listeners.click({ preventDefault() {}, stopPropagation() {} });
  await Promise.resolve();
  assert.match(subject.shadowRoot.innerHTML, /Recorded use/);
  assert.match(subject.shadowRoot.innerHTML, /Withheld/);
  assert.match(subject.shadowRoot.innerHTML, /No aligned archive history/);
  assert.doesNotMatch(subject.shadowRoot.innerHTML, />30 kWh</);
  assert.doesNotMatch(subject.shadowRoot.innerHTML, /£30/);
});

test('withholds a misaligned breakdown series instead of showing a synthetic zero or percentage', async () => {
  const subject = card();
  subject.setConfig({
    type: 'custom:oriel-card',
    entity_ids: { electricity: ['sensor.fixture_total'], water: [], fuel: [], power: [] },
    archive_weekly_values: { electricity: [100, 50] },
    archive_weekly_recorded_days: { electricity: [5, 7] },
    source_breakdowns: {
      electricity: {
        open: true,
        sources: [
          { entity_id: 'sensor.fixture_pool', label: 'Pool', relation: 'part_of_total', archive_weekly_values: [30] },
        ],
      },
    },
  });
  subject.hass = {
    states: {
      'sensor.fixture_total': state('sensor.fixture_total', 4200, 'House Input', 'kWh', 'energy'),
      'sensor.fixture_pool': state('sensor.fixture_pool', 1400, 'Pool', 'kWh', 'energy'),
    },
  };
  await Promise.resolve(); await Promise.resolve();
  assert.match(subject.shadowRoot.innerHTML, /No aligned archive history/);
  assert.doesNotMatch(subject.shadowRoot.innerHTML, /30% of total/);
  assert.doesNotMatch(subject.shadowRoot.innerHTML, />30 kWh</);
});

test('keeps independent feeders out of the selected total and percentage split', async () => {
  const subject = card();
  subject.setConfig({
    type: 'custom:oriel-card',
    entity_ids: { electricity: ['sensor.fixture_total'], water: [], fuel: [], power: [] },
    archive_weekly_values: { electricity: [100] },
    archive_weekly_recorded_days: { electricity: [7] },
    source_breakdowns: {
      electricity: {
        open: true,
        sources: [
          { entity_id: 'sensor.fixture_house', label: 'House', relation: 'part_of_total', archive_weekly_values: [100], archive_weekly_recorded_days: [7] },
          { entity_id: 'sensor.fixture_lodge', label: 'Lodge', relation: 'independent', archive_weekly_values: [200], archive_weekly_recorded_days: [7] },
        ],
      },
    },
  });
  subject.hass = {
    states: {
      'sensor.fixture_total': state('sensor.fixture_total', 4200, 'House Input', 'kWh', 'energy'),
      'sensor.fixture_house': state('sensor.fixture_house', 2200, 'House', 'kWh', 'energy'),
      'sensor.fixture_lodge': state('sensor.fixture_lodge', 900, 'Lodge', 'kWh', 'energy'),
    },
  };
  await Promise.resolve(); await Promise.resolve();
  assert.match(subject.shadowRoot.innerHTML, /100% of total/);
  assert.match(subject.shadowRoot.innerHTML, /Independent meter/);
  assert.match(subject.shadowRoot.innerHTML, /200 kWh/);
  assert.doesNotMatch(subject.shadowRoot.innerHTML, /200% of total/);
});

test('queries a configured dynamic breakdown source only after its dropdown is opened', async () => {
  const subject = card();
  const calls = [];
  subject.setConfig({
    type: 'custom:oriel-card',
    history_weeks: 1,
    statistics: { history: true, anchor: '2026-09-19T12:00:00.000Z', timezone: 'Europe/London' },
    entity_ids: { electricity: ['sensor.fixture_total'], water: [], fuel: [], power: [] },
    source_breakdowns: {
      electricity: [
        { entity_id: 'sensor.fixture_pool', label: 'Pool', relation: 'part_of_total' },
      ],
    },
  });
  subject.hass = {
    states: {
      'sensor.fixture_total': state('sensor.fixture_total', 4200, 'House Input', 'kWh', 'energy'),
      'sensor.fixture_pool': state('sensor.fixture_pool', 1400, 'Pool', 'kWh', 'energy'),
      'sensor.unapproved': state('sensor.unapproved', 999, 'Unapproved', 'kWh', 'energy'),
    },
    callWS: async (payload) => { calls.push(payload.entity_ids[0]); return { [payload.entity_ids[0]]: [] }; },
  };
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  assert.deepEqual(calls, ['sensor.fixture_total']);
  subject._breakdownOpen.set('electricity', true);
  subject.render();
  await Promise.resolve(); await Promise.resolve(); await Promise.resolve();
  assert.deepEqual(calls.sort((a, b) => a.localeCompare(b)), ['sensor.fixture_pool', 'sensor.fixture_total']);
  assert.doesNotMatch(subject.shadowRoot.innerHTML, /Unapproved/);
});

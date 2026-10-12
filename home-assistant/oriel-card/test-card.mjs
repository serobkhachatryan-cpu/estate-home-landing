import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const source = await readFile(new URL('./oriel-card.js', import.meta.url), 'utf8');

function card() {
  const registered = new Map();
  class Element {
    attachShadow() {
      const shadow = { innerHTML: '', querySelectorAll: () => [], querySelector: () => null };
      this.shadowRoot = shadow;
      return shadow;
    }
  }
  const context = vm.createContext({ Array, Date, HTMLElement: Element, Intl, Math, Number, Object, Promise, RegExp, String, customElements: { define: (name, ctor) => registered.set(name, ctor), get: (name) => registered.get(name) } });
  vm.runInContext(`${source}\nglobalThis.Card = OrielCard;`, context);
  return new context.Card();
}

const state = (entity_id, value, friendly_name, unit, device_class) => ({ entity_id, state: String(value), attributes: { friendly_name, unit_of_measurement: unit, device_class }, last_updated: new Date().toISOString() });

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

test('requests Recorder data from UK midnight instead of 01:00 during BST', async () => {
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
  assert.equal(request.start_time, '2026-09-13T23:00:00.000Z');
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

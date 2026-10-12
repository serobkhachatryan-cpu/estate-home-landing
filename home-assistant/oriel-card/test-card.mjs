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

test('labels imported records as UK Monday–Sunday calendar weeks', async () => {
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
  assert.match(subject.shadowRoot.innerHTML, /Imported weekly record · Mon–Sun/);
  assert.match(subject.shadowRoot.innerHTML, /14–20 Sept 2026/);
  assert.match(subject.shadowRoot.innerHTML, /7–13 Sept 2026/);
});

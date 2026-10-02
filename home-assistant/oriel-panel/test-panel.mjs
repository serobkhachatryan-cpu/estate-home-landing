import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import vm from 'node:vm';

const panelPath = new URL('./oriel-panel.js', import.meta.url);
const panelSource = await readFile(panelPath, 'utf8');

function createPanel() {
  const registered = new Map();
  class FakeElement {
    attachShadow() {
      const shadow = {
        innerHTML: '',
        querySelectorAll() {
          return [];
        },
      };
      this.shadowRoot = shadow;
      return shadow;
    }
  }

  const context = vm.createContext({
    Array,
    Date,
    HTMLElement: FakeElement,
    Intl,
    Math,
    Number,
    Object,
    Promise,
    RegExp,
    String,
    customElements: {
      define(name, constructor) {
        registered.set(name, constructor);
      },
      get(name) {
        return registered.get(name);
      },
    },
  });
  vm.runInContext(`${panelSource}\nglobalThis.__OrielPanel = OrielPanel;`, context);
  return new context.__OrielPanel();
}

function fixtureState(entityId, value, name, unit, deviceClass) {
  return {
    entity_id: entityId,
    state: String(value),
    attributes: {
      friendly_name: name,
      ...(unit ? { unit_of_measurement: unit } : {}),
      ...(deviceClass ? { device_class: deviceClass } : {}),
    },
    last_changed: '2026-10-02T09:00:00.000Z',
    last_updated: '2026-10-02T09:00:00.000Z',
  };
}

async function setStates(panel, states, config = {}) {
  panel.panel = { config };
  panel.hass = { states };
  await Promise.resolve();
  await Promise.resolve();
}

test('renders only approved Home Assistant sources and formats HA cost values', async () => {
  const panel = createPanel();
  await setStates(panel, {
    'sensor.total_power': fixtureState(
      'sensor.total_power',
      482.6,
      'Total power',
      'W',
      'power',
    ),
    'sensor.shellypro3em_test_energy_cost': fixtureState(
      'sensor.shellypro3em_test_energy_cost',
      28.73,
      'Metered energy cost',
      'GBP',
      'monetary',
    ),
    'sensor.personal_iphone_battery': fixtureState(
      'sensor.personal_iphone_battery',
      87,
      'Personal iPhone battery',
      '%',
      'battery',
    ),
  });

  const html = panel.shadowRoot.innerHTML;
  assert.match(html, /Total power/);
  assert.match(html, /482\.6 W/);
  assert.match(html, /Metered energy cost/);
  assert.match(html, /£28\.73/);
  assert.doesNotMatch(html, /Personal iPhone battery/);
  assert.doesNotMatch(panelSource, /\bfetch\s*\(/);
});

test('renders unavailable sources faithfully rather than inventing a numeric value', async () => {
  const panel = createPanel();
  await setStates(panel, {
    'sensor.total_power': fixtureState(
      'sensor.total_power',
      'unavailable',
      'Total power',
      'W',
      'power',
    ),
  });
  assert.match(panel.shadowRoot.innerHTML, /Unavailable/);
  assert.doesNotMatch(panel.shadowRoot.innerHTML, />0 W</);
});

test('honours an exact configured allowlist and does not hide sources after 18 entries', async () => {
  const panel = createPanel();
  const states = {};
  const waterIds = [];
  for (let index = 1; index <= 20; index += 1) {
    const id = `sensor.fixture_water_${index}`;
    waterIds.push(id);
    states[id] = fixtureState(id, index, `Fixture water ${index}`, 'L', 'volume');
  }
  states['sensor.house_water_1_flow'] = fixtureState(
    'sensor.house_water_1_flow',
    4.2,
    'Unapproved house flow',
    'L/min',
    'volume_flow_rate',
  );

  await setStates(panel, states, { entity_ids: { water: waterIds } });
  panel._selectedSystem = 'water';
  panel.render();

  const html = panel.shadowRoot.innerHTML;
  assert.match(html, /Fixture water 1/);
  assert.match(html, /Fixture water 20/);
  assert.doesNotMatch(html, /Unapproved house flow/);
});

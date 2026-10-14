(() => {
  'use strict';

  const topbar = document.querySelector('[data-topbar]');
  const menuButton = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');

  const setTopbarState = () => {
    if (!topbar) return;
    topbar.classList.toggle('is-scrolled', window.scrollY > 16);
  };

  setTopbarState();
  window.addEventListener('scroll', setTopbarState, { passive: true });

  if (menuButton && menu) {
    menuButton.addEventListener('click', () => {
      const next = !menu.classList.contains('is-open');
      menu.classList.toggle('is-open', next);
      menuButton.classList.toggle('is-open', next);
      menuButton.setAttribute('aria-expanded', String(next));
    });

    menu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        menu.classList.remove('is-open');
        menuButton.classList.remove('is-open');
        menuButton.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const demo = document.querySelector('[data-oriel-demo]');
  if (!demo) return;

  const systems = {
    electricity: {
      name: 'Electricity',
      subline: 'Approved main and feeder meters',
      current: '—',
      unit: 'kWh',
      cost: 'Available when configured',
      sourcesTitle: 'Approved electricity sources',
      sources: [
        ['Estate total meter', 'primary total'],
        ['House input feeder', 'part of total'],
        ['Independent outbuilding feeder', 'independent'],
      ],
      detail: 'The production card can show cumulative energy from the explicitly approved total and feeder meters. It does not publish values to this website.',
    },
    water: {
      name: 'Water',
      subline: 'Primary and independent water meters',
      current: '—',
      unit: 'L',
      cost: 'Shown only when approved',
      sourcesTitle: 'Approved water sources',
      sources: [
        ['House water total', 'primary total'],
        ['Lodge water meter', 'independent'],
        ['Main water meter', 'independent'],
      ],
      detail: 'Independent water supplies stay visibly independent. A production configuration must describe the actual plumbing relationship before any total is presented.',
    },
    fuel: {
      name: 'Fuel',
      subline: 'Approved cumulative consumption sources',
      current: '—',
      unit: 'L',
      cost: 'Not configured in this demo',
      sourcesTitle: 'Fuel source policy',
      sources: [
        ['Cumulative fuel-used meter', 'eligible for history'],
        ['Tank-level sensor', 'state only — not a usage total'],
      ],
      detail: 'A tank percentage is useful as a current state, but is not treated as weekly fuel use. Oriel only derives a weekly series from a correctly configured cumulative usage source.',
    },
    power: {
      name: 'Backup power',
      subline: 'Approved energy-throughput sources',
      current: '—',
      unit: 'kWh',
      cost: 'Available when configured',
      sourcesTitle: 'Approved backup-power sources',
      sources: [
        ['Battery energy-throughput total', 'eligible for history'],
        ['Generator energy-used total', 'eligible if cumulative'],
        ['Battery state of charge', 'state only'],
      ],
      detail: 'Backup power is a distinct operating lens. It can share the weekly rhythm without being silently combined with grid electricity.',
    },
  };

  const get = (selector) => demo.querySelector(selector);
  const tabs = [...demo.querySelectorAll('[role="tab"]')];
  const panel = get('[role="tabpanel"]');
  const name = get('[data-demo-name]');
  const subline = get('[data-demo-subline]');
  const current = get('[data-demo-current]');
  const unit = get('[data-demo-unit]');
  const cost = get('[data-demo-cost]');
  const sourcesTitle = get('[data-demo-sources-title]');
  const sourcesCount = get('[data-demo-sources-count]');
  const sourceList = get('[data-source-list]');
  const detailTitle = get('[data-detail-title]');
  const detailCopy = get('[data-detail-copy]');
  const rowButtons = [...demo.querySelectorAll('[data-week]')];

  let selectedSystem = 'electricity';
  let selectedWeek = 3;

  const selectedWeekName = () => {
    const row = rowButtons[selectedWeek];
    return row ? row.querySelector('.demo-row__date')?.textContent || 'Selected week' : 'Selected week';
  };

  const renderSources = (sources) => {
    if (!sourceList) return;
    sourceList.replaceChildren(
      ...sources.map(([title, relationship]) => {
        const item = document.createElement('div');
        item.className = 'source-item';
        const sourceName = document.createElement('strong');
        sourceName.textContent = title;
        const sourceType = document.createElement('span');
        sourceType.textContent = relationship;
        item.append(sourceName, sourceType);
        return item;
      }),
    );
  };

  const render = () => {
    const system = systems[selectedSystem];
    if (!system) return;

    tabs.forEach((tab) => {
      const active = tab.dataset.system === selectedSystem;
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
    });

    if (panel) panel.setAttribute('aria-labelledby', `tab-${selectedSystem}`);
    if (name) name.textContent = system.name;
    if (subline) subline.textContent = system.subline;
    if (current) current.textContent = system.current;
    if (unit) unit.textContent = system.unit;
    if (cost) cost.textContent = system.cost;
    if (sourcesTitle) sourcesTitle.textContent = system.sourcesTitle;
    if (sourcesCount) sourcesCount.textContent = `${system.sources.length} listed`;
    if (detailTitle) detailTitle.textContent = `${selectedWeekName()} · UK week`;
    if (detailCopy) detailCopy.textContent = system.detail;
    renderSources(system.sources);
  };

  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      selectedSystem = tab.dataset.system || selectedSystem;
      render();
    });

    tab.addEventListener('keydown', (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let nextIndex = index;
      if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = tabs.length - 1;
      tabs[nextIndex].focus();
      tabs[nextIndex].click();
    });
  });

  rowButtons.forEach((row, index) => {
    row.addEventListener('click', () => {
      selectedWeek = index;
      rowButtons.forEach((item, itemIndex) => item.classList.toggle('is-selected', itemIndex === index));
      render();
    });
  });

  render();
})();

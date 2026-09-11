/**
 * Native weekly spend tape — ~2 years back and ~2 years forward.
 * UK weeks Mon→Sun (ISO 8601).
 *
 * Rolling 52-week Plan / Fact stay near annual pace but move with
 * winter outdoor-temperature load, calendar events, and emergencies.
 */

export type WeekEfficiency = 'efficient' | 'on-plan' | 'inefficient';

/** Weeks each side of “now” (~2 years). */
export const TAPE_SPAN_WEEKS = 104;

export type SpendTapeWeek = {
  id: string;
  offset: number;
  label: string;
  shortLabel: string;
  rangeLabel: string;
  calendarLabel: string;
  weekStart: string;
  weekEnd: string;
  isoWeek: number;
  plan: number;
  fact?: number;
  forecast?: number;
  cashflow?: number;
  efficiency: WeekEfficiency;
  note?: string;
};

export type SpendTapeSubject = {
  id: string;
  name: string;
  plan: number;
  fact: number;
  forecast: number;
};

type HomeEvent = {
  id: string;
  match: (monday: Date) => boolean;
  /** Absolute £ bumps by subject id (exact, then parent, then headline scale). */
  bumps: Record<string, number>;
  notes: Record<string, string>;
};

function inDayRange(
  monday: Date,
  month: number,
  dayFrom: number,
  dayTo: number,
  year?: number,
) {
  if (year != null && monday.getFullYear() !== year) return false;
  if (monday.getMonth() !== month) return false;
  const d = monday.getDate();
  return d >= dayFrom && d <= dayTo;
}

/**
 * Calendar-driven estate events across the tape.
 * Christmas / winter cold, leaks, birthdays, emergencies, capital works, hires…
 */
const HOME_EVENTS: HomeEvent[] = [
  // —— Recurring every year ——
  {
    id: 'christmas-new-year',
    match: (d) =>
      (d.getMonth() === 11 && d.getDate() >= 22) ||
      (d.getMonth() === 0 && d.getDate() <= 5),
    bumps: {
      'headline-total': 9200,
      occupancy: 1400,
      staff: 2200,
      utilities: 1800,
      'utilities:energy': 980,
      'utilities:fuel': 520,
      'utilities:water': 90,
      transportation: 640,
      inventory: 720,
      livestock: 380,
    },
    notes: {
      'headline-total':
        'Christmas & New Year — guests, kitchen, lights, staff overtime.',
      occupancy: 'Festive occupancy — house full across Christmas week.',
      staff: 'Christmas cover and overtime for housekeeping / grounds.',
      utilities: 'Holiday utilities load — heat, lights, kitchen, AV.',
      'utilities:energy':
        'Christmas & New Year power — kitchen, lights and AV ran hard.',
      'utilities:fuel': 'Festive heating held warmer while guests were in.',
      'utilities:water': 'Guest load raised water use over the holidays.',
      transportation: 'Airport runs and festive transfers.',
      inventory: 'Festive consumables and replacements restock.',
      livestock: 'Extra feed / care while the house was full.',
    },
  },
  {
    id: 'deep-winter-cold',
    match: (d) =>
      (d.getMonth() === 0 && d.getDate() >= 6 && d.getDate() <= 20) ||
      (d.getMonth() === 1 && d.getDate() <= 14),
    bumps: {
      'headline-total': 2400,
      utilities: 1600,
      'utilities:energy': 1100,
      'utilities:fuel': 860,
      staff: 280,
    },
    notes: {
      'headline-total': 'Deep winter cold — outdoor temp pulled heat plant up.',
      utilities: 'Cold spell · heat and power overlap above quiet plan.',
      'utilities:energy':
        'Outdoor temperature low · underfloor and plant above plan.',
      'utilities:fuel':
        'Cold snap · heating fuel burn well above the quiet-week plan.',
      staff: 'Extra plant checks during the cold snap.',
    },
  },
  {
    id: 'spring-planting',
    match: (d) => d.getMonth() === 3 && d.getDate() >= 7 && d.getDate() <= 27,
    bumps: {
      'headline-total': 2100,
      livestock: 1600,
      staff: 400,
      'utilities:water': 70,
    },
    notes: {
      'headline-total': 'Spring planting window under livestock / garden.',
      livestock: 'Planting & beds — seasonal garden push.',
      staff: 'Grounds hours up for spring planting.',
      'utilities:water': 'Irrigation for new planting.',
    },
  },
  {
    id: 'summer-irrigation',
    match: (d) =>
      (d.getMonth() === 6 || d.getMonth() === 7) &&
      d.getDate() >= 8 &&
      d.getDate() <= 21,
    bumps: {
      'headline-total': 900,
      livestock: 520,
      utilities: 280,
      'utilities:water': 120,
      'utilities:energy': 90,
    },
    notes: {
      'headline-total': 'Warm spell — irrigation and fountain pumps busy.',
      livestock: 'Summer irrigation cycle longer than quiet plan.',
      utilities: 'Pumps and AC overlapped in the warm fortnight.',
      'utilities:water': 'Garden irrigation pulled water above plan.',
      'utilities:energy': 'Fountain / pump and light AC load.',
    },
  },
  {
    id: 'insurance-renewal',
    match: (d) => d.getMonth() === 2 && d.getDate() >= 1 && d.getDate() <= 14,
    bumps: {
      'headline-total': 22000,
      insurance: 21000,
      inventory: 900,
    },
    notes: {
      'headline-total': 'Annual buildings / contents premium week.',
      insurance: 'Buildings & contents renewal — large cash leave.',
      inventory: 'Compliance filings with the insurance renewal.',
    },
  },
  {
    id: 'school-holiday-summer',
    match: (d) => d.getMonth() === 7 && d.getDate() >= 22,
    bumps: {
      'headline-total': 1600,
      occupancy: 700,
      staff: 450,
      'utilities:energy': 180,
      transportation: 220,
    },
    notes: {
      'headline-total': 'Late-summer school holidays — house busier.',
      occupancy: 'School holiday occupancy up.',
      staff: 'Extra housekeeping for holiday guests.',
      'utilities:energy': 'Evening use up with holiday occupancy.',
      transportation: 'Family transfers during holidays.',
    },
  },

  // —— 2024 (further past) ——
  {
    id: 'boiler-emergency-2024',
    match: (d) => inDayRange(d, 10, 4, 17, 2024),
    bumps: {
      'headline-total': 6800,
      renovation: 4200,
      utilities: 900,
      'utilities:energy': 420,
      staff: 600,
    },
    notes: {
      'headline-total': 'Emergency boiler call-out — heat lost mid-week.',
      renovation: 'Emergency boiler repair — unplanned but necessary.',
      utilities: 'Temporary heaters while boiler was down.',
      'utilities:energy': 'Electric heaters covered the outage.',
      staff: 'Engineer escort and overtime.',
    },
  },
  {
    id: 'pipe-leak-2024',
    match: (d) => inDayRange(d, 1, 11, 24, 2024),
    bumps: {
      'headline-total': 4100,
      utilities: 800,
      'utilities:water': 340,
      renovation: 2600,
      inventory: 280,
    },
    notes: {
      'headline-total': 'Pipe leak in guest wing — water damage contained.',
      utilities: 'Leak event · water + dry-out plant.',
      'utilities:water': 'Overnight leak — metered loss before isolation.',
      renovation: 'Make-good after guest-wing pipe leak.',
      inventory: 'Soft furnishings replaced after the leak.',
    },
  },
  {
    id: 'car-breakdown-2024',
    match: (d) => inDayRange(d, 5, 10, 23, 2024),
    bumps: {
      'headline-total': 3200,
      transportation: 2900,
      staff: 200,
    },
    notes: {
      'headline-total': 'Estate car breakdown — recovery and hire car.',
      transportation: 'Vehicle recovery + hire while the estate car was in shop.',
      staff: 'Driver cover while the car was off the road.',
    },
  },
  {
    id: 'birthday-party-2024',
    match: (d) => inDayRange(d, 8, 9, 22, 2024),
    bumps: {
      'headline-total': 2800,
      occupancy: 900,
      staff: 700,
      'utilities:energy': 260,
      inventory: 420,
      transportation: 180,
    },
    notes: {
      'headline-total': 'Birthday weekend at home — catering and AV.',
      occupancy: 'Birthday guest nights.',
      staff: 'Extra service staff for the birthday.',
      'utilities:energy': 'Party lighting, kitchen and AV.',
      inventory: 'Party consumables and hired glassware.',
      transportation: 'Guest transfers for the birthday.',
    },
  },

  // —— 2025 ——
  {
    id: 'driveway-concrete-2025',
    match: (d) => inDayRange(d, 8, 1, 28, 2025),
    bumps: {
      'headline-total': 28600,
      renovation: 26200,
      transportation: 900,
      staff: 700,
      livestock: 400,
    },
    notes: {
      'headline-total':
        'Driveway concreting — capital access works to the house.',
      renovation: 'Beton / concrete driveway — capital fabric works.',
      transportation: 'Plant deliveries and skip runs for the driveway.',
      staff: 'Site liaison while the driveway was poured.',
      livestock: 'Temporary garden protection during driveway works.',
    },
  },
  {
    id: 'new-housekeeper-hire-2025',
    match: (d) => inDayRange(d, 3, 7, 20, 2025),
    bumps: {
      'headline-total': 4200,
      staff: 3800,
      inventory: 280,
    },
    notes: {
      'headline-total': 'New housekeeper onboarded — first month overlap pay.',
      staff: 'New hire · overlap with outgoing cover + agency fee.',
      inventory: 'Uniforms and starter kit for the new hire.',
    },
  },
  {
    id: 'dishwasher-failure-2025',
    match: (d) => inDayRange(d, 5, 16, 29, 2025),
    bumps: {
      'headline-total': 1600,
      inventory: 1100,
      utilities: 200,
      'utilities:energy': 80,
      'utilities:water': 40,
    },
    notes: {
      'headline-total': 'Main kitchen dishwasher failed — replace not repair.',
      inventory: 'Appliance replacement — main dishwasher.',
      utilities: 'Temporary higher hand-wash / secondary unit use.',
      'utilities:energy': 'Secondary dishwasher ran harder for a week.',
      'utilities:water': 'Extra rinse cycles while waiting for the new unit.',
    },
  },
  {
    id: 'roof-slate-emergency-2025',
    match: (d) => inDayRange(d, 10, 10, 23, 2025),
    bumps: {
      'headline-total': 7400,
      renovation: 6800,
      staff: 300,
      insurance: 0,
    },
    notes: {
      'headline-total': 'Storm slate loss — emergency roof make-safe.',
      renovation: 'Emergency roof slates after storm — capital-ish repair.',
      staff: 'Access and contractor escort.',
    },
  },
  {
    id: 'children-party-2025',
    match: (d) => inDayRange(d, 7, 4, 17, 2025),
    bumps: {
      'headline-total': 1900,
      occupancy: 400,
      staff: 350,
      'utilities:energy': 210,
      inventory: 380,
      livestock: 120,
    },
    notes: {
      'headline-total': 'Children’s party at home — kitchen, lights, garden.',
      occupancy: 'Party day · house in “full” mode.',
      staff: 'Extra hands for the children’s party.',
      'utilities:energy':
        'Children’s party — kitchen, lights and AV for one evening.',
      inventory: 'Party supplies and soft-goods top-up.',
      livestock: 'Garden tidy before / after the party.',
    },
  },
  {
    id: 'gate-motor-2025',
    match: (d) => inDayRange(d, 1, 17, 28, 2025),
    bumps: {
      'headline-total': 2100,
      utilities: 400,
      renovation: 1500,
      transportation: 120,
    },
    notes: {
      'headline-total': 'Main gate motor failed — access emergency.',
      utilities: 'Temporary security cover while the gate was open-cycle.',
      renovation: 'Gate motor replacement — access system.',
      transportation: 'Courier for the motor unit.',
    },
  },

  // —— 2026 (near now / recent) ——
  {
    id: 'children-party-recent',
    match: (d) => inDayRange(d, 7, 25, 31, 2026) || inDayRange(d, 8, 1, 7, 2026),
    bumps: {
      'headline-total': 2100,
      occupancy: 450,
      staff: 380,
      utilities: 280,
      'utilities:energy': 220,
      inventory: 400,
      renovation: 4800,
    },
    notes: {
      'headline-total':
        'Children’s party + snagging landed in the same fortnight.',
      occupancy: 'Party occupancy spike.',
      staff: 'Party cover.',
      utilities: 'Party utilities pull.',
      'utilities:energy':
        'Children’s party — kitchen, lights and AV ran hard (~+£220).',
      inventory: 'Party consumables.',
      renovation: 'Snagging push the same week as the party.',
    },
  },
  {
    id: 'vet-emergency-2026',
    match: (d) => inDayRange(d, 2, 9, 22, 2026),
    bumps: {
      'headline-total': 980,
      livestock: 820,
      transportation: 90,
    },
    notes: {
      'headline-total': 'Overnight vet emergency for livestock.',
      livestock: 'Vet call — unplanned but necessary.',
      transportation: 'Late run to the clinic.',
    },
  },
  {
    id: 'av-rack-failure-2026',
    match: (d) => inDayRange(d, 4, 12, 25, 2026),
    bumps: {
      'headline-total': 3400,
      inventory: 2800,
      'utilities:energy': 120,
      staff: 200,
    },
    notes: {
      'headline-total': 'AV rack PSU failure — replace + overnight engineer.',
      inventory: 'AV inventory replacement after PSU failure.',
      'utilities:energy': 'Rack reboot and soak-test overnight.',
      staff: 'Specialist AV engineer visit.',
    },
  },
  {
    id: 'bathroom-refit-phase-2026',
    match: (d) => inDayRange(d, 5, 1, 28, 2026),
    bumps: {
      'headline-total': 12400,
      renovation: 11200,
      inventory: 600,
      staff: 350,
    },
    notes: {
      'headline-total': 'Guest bathroom refit — planned capital works.',
      renovation: 'Guest bathroom refit phase — materials + labour.',
      inventory: 'Fixtures and fittings for the bathroom refit.',
      staff: 'Cleaning overlap around the wet works.',
    },
  },
  {
    id: 'slow-leak-watch-2026',
    match: (d) => inDayRange(d, 7, 18, 31, 2026),
    bumps: {
      'headline-total': 420,
      utilities: 180,
      'utilities:water': 95,
      renovation: 160,
    },
    notes: {
      'headline-total': 'Overnight flow rise — leak watch opened.',
      utilities: 'Water exception week — leak watch.',
      'utilities:water':
        'Overnight flow rise — may be nothing, or a slow leak start.',
      renovation: 'Plumber trace for the overnight rise.',
    },
  },
  {
    id: 'filter-service-2026',
    match: (d) => inDayRange(d, 6, 6, 19, 2026),
    bumps: {
      'headline-total': 780,
      utilities: 320,
      'utilities:energy': 90,
      staff: 280,
      inventory: 90,
    },
    notes: {
      'headline-total': 'Plant-room filter service — planned care.',
      utilities: 'Filter service · plant ran longer while balancing.',
      'utilities:energy': 'Plant room soak after filter change.',
      staff: 'Specialist filter / airflow visit.',
      inventory: 'Filter media replacement.',
    },
  },

  // —— Near future 2026–2027 ——
  {
    id: 'finish-phase-soon',
    match: (d) => inDayRange(d, 9, 21, 30, 2026) || inDayRange(d, 10, 1, 11, 2026),
    bumps: {
      'headline-total': 8600,
      renovation: 7800,
      staff: 400,
      inventory: 350,
    },
    notes: {
      'headline-total': 'Next finish phase — forecast cash step.',
      renovation: 'Finish-phase materials and labour pencilled.',
      staff: 'Extra cleaning around finish works.',
      inventory: 'Finish consumables.',
    },
  },
  {
    id: 'winter-2026-approach',
    match: (d) => inDayRange(d, 10, 16, 30, 2026),
    bumps: {
      'headline-total': 1600,
      utilities: 1100,
      'utilities:energy': 720,
      'utilities:fuel': 480,
      livestock: 180,
    },
    notes: {
      'headline-total': 'Winter approach — outdoor temp forecast lifts spend.',
      utilities: 'Model steps utilities up as outdoor temps fall.',
      'utilities:energy':
        'Winter approach · power cashflow step-up is expected.',
      'utilities:fuel':
        'Winter approach · heating fuel forecast steps up with outdoor cold.',
      livestock: 'Winter bedding / feed prep.',
    },
  },
  {
    id: 'contents-renewal-2027',
    match: (d) => inDayRange(d, 2, 1, 14, 2027),
    bumps: {
      'headline-total': 7200,
      insurance: 6200,
      inventory: 480,
    },
    notes: {
      'headline-total': 'Contents renewal window 2027.',
      insurance: 'Contents renewal — cashflow step.',
      inventory: 'Policy paperwork inside inventory.',
    },
  },
  {
    id: 'grounds-hire-2027',
    match: (d) => inDayRange(d, 2, 15, 28, 2027),
    bumps: {
      'headline-total': 5100,
      staff: 4600,
      inventory: 250,
      livestock: 200,
    },
    notes: {
      'headline-total': 'Additional grounds person hired for the season.',
      staff: 'New grounds hire — first month + kit.',
      inventory: 'Tools / kit for the new grounds hire.',
      livestock: 'Handover week on beds and irrigation.',
    },
  },
  {
    id: 'pool-plant-2027',
    match: (d) => inDayRange(d, 4, 5, 25, 2027),
    bumps: {
      'headline-total': 9800,
      renovation: 8200,
      utilities: 700,
      'utilities:energy': 280,
      'utilities:water': 110,
    },
    notes: {
      'headline-total': 'Pool / spa plant overhaul — planned capital.',
      renovation: 'Pool plant overhaul — pumps and controls.',
      utilities: 'Commissioning load on water and power.',
      'utilities:energy': 'Plant soak-test after overhaul.',
      'utilities:water': 'Fill / balance after plant works.',
    },
  },
  {
    id: 'birthday-2027',
    match: (d) => inDayRange(d, 8, 6, 19, 2027),
    bumps: {
      'headline-total': 3100,
      occupancy: 1000,
      staff: 800,
      'utilities:energy': 280,
      inventory: 500,
      transportation: 220,
    },
    notes: {
      'headline-total': 'Birthday weekend 2027 — forecast guest load.',
      occupancy: 'Birthday occupancy expected up.',
      staff: 'Service cover for the birthday.',
      'utilities:energy': 'Party power forecast.',
      inventory: 'Event inventory.',
      transportation: 'Guest transfers pencilled.',
    },
  },
  {
    id: 'resurface-path-2027',
    match: (d) => inDayRange(d, 6, 5, 25, 2027),
    bumps: {
      'headline-total': 6400,
      renovation: 5200,
      livestock: 800,
      staff: 300,
    },
    notes: {
      'headline-total': 'Garden path resurfacing — summer works.',
      renovation: 'Hardscape path resurfacing.',
      livestock: 'Garden access works under livestock / garden.',
      staff: 'Grounds support during path works.',
    },
  },
  {
    id: 'freezer-failure-2027',
    match: (d) => inDayRange(d, 7, 9, 22, 2027),
    bumps: {
      'headline-total': 1900,
      inventory: 1400,
      'utilities:energy': 150,
      staff: 180,
    },
    notes: {
      'headline-total': 'Walk-in freezer failure — stock loss + replace.',
      inventory: 'Freezer replacement + lost stock write-off.',
      'utilities:energy': 'Temporary cold units while waiting for install.',
      staff: 'Clear-down and restock labour.',
    },
  },
  {
    id: 'christmas-prep-2027',
    match: (d) => inDayRange(d, 11, 6, 19, 2027),
    bumps: {
      'headline-total': 2400,
      staff: 700,
      inventory: 900,
      occupancy: 400,
      'utilities:energy': 200,
    },
    notes: {
      'headline-total': 'Christmas prep fortnight — stock and staffing.',
      staff: 'Pre-Christmas staffing uplift.',
      inventory: 'Festive inventory buy-ahead.',
      occupancy: 'Family arriving early for the holidays.',
      'utilities:energy': 'Decorations and kitchen prep load.',
    },
  },
  {
    id: 'flood-alert-drain-2028',
    match: (d) => inDayRange(d, 0, 10, 23, 2028),
    bumps: {
      'headline-total': 4500,
      renovation: 2800,
      utilities: 600,
      'utilities:water': 200,
      livestock: 500,
    },
    notes: {
      'headline-total': 'Surface-water alert — drains cleared, temporary pumps.',
      renovation: 'Drain clearance and temporary flood boards.',
      utilities: 'Pump hire during the wet week.',
      'utilities:water': 'Surface water / drain surge.',
      livestock: 'Garden drainage after the wet spell.',
    },
  },
  {
    id: 'ev-charger-2028',
    match: (d) => inDayRange(d, 3, 3, 23, 2028),
    bumps: {
      'headline-total': 5200,
      renovation: 3600,
      transportation: 900,
      'utilities:energy': 280,
    },
    notes: {
      'headline-total': 'Second EV charger install on the drive.',
      renovation: 'EV charger civil + electrical install.',
      transportation: 'Fleet charging upgrade.',
      'utilities:energy': 'Commissioning load on the new charger.',
    },
  },
];

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

function normalizeToSum(values: number[], target: number): number[] {
  const sum = values.reduce((a, b) => a + b, 0);
  if (sum <= 0) {
    const each = target / Math.max(values.length, 1);
    return values.map(() => round2(each));
  }
  const scaled = values.map((v) => v * (target / sum));
  const rounded = scaled.map((v) => round2(v));
  const drift = round2(target - rounded.reduce((a, b) => a + b, 0));
  if (rounded.length > 0) {
    const i = rounded.length - 1;
    rounded[i] = round2(rounded[i]! + drift);
  }
  return rounded;
}

export function efficiencyFor(value: number, plan: number): WeekEfficiency {
  const ratio = value / Math.max(plan, 1);
  if (ratio > 1.08) return 'inefficient';
  if (ratio < 0.95) return 'efficient';
  return 'on-plan';
}

function atLocalMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addLocalDays(date: Date, days: number): Date {
  const d = atLocalMidnight(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function startOfUkWeek(date: Date): Date {
  const d = atLocalMidnight(date);
  const day = d.getDay();
  const toMonday = day === 0 ? -6 : 1 - day;
  return addLocalDays(d, toMonday);
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isoWeekNumber(weekMonday: Date): number {
  const thursday = addLocalDays(weekMonday, 3);
  const yearStart = new Date(thursday.getFullYear(), 0, 1);
  const dayOfYear =
    Math.floor(
      (thursday.getTime() - yearStart.getTime()) / (24 * 60 * 60 * 1000),
    ) + 1;
  return Math.floor((dayOfYear - 1) / 7) + 1;
}

function formatDayMonth(date: Date): string {
  return date.toLocaleString('en-GB', { day: 'numeric', month: 'short' });
}

function formatWeekdayDayMonth(date: Date): string {
  return date.toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function ukWeekMeta(
  offset: number,
  now: Date,
): Pick<
  SpendTapeWeek,
  | 'label'
  | 'shortLabel'
  | 'rangeLabel'
  | 'calendarLabel'
  | 'weekStart'
  | 'weekEnd'
  | 'isoWeek'
> {
  const monday = addLocalDays(startOfUkWeek(now), offset * 7);
  const sunday = addLocalDays(monday, 6);
  const sameMonth = monday.getMonth() === sunday.getMonth();
  const sameYear = monday.getFullYear() === sunday.getFullYear();
  const rangeLabel = sameMonth
    ? `${monday.getDate()}–${sunday.getDate()} ${monday.toLocaleString('en-GB', { month: 'short' })}`
    : `${formatDayMonth(monday)}–${formatDayMonth(sunday)}`;
  const yearSuffix = sameYear
    ? ` ${monday.getFullYear()}`
    : ` ${monday.getFullYear()} / ${sunday.getFullYear()}`;
  const commencing = `w/c ${formatDayMonth(monday)}`;
  let label = commencing;
  const shortLabel =
    offset < 0 ? `${offset}` : offset === 0 ? 'Now' : `+${offset}`;
  if (offset === 0) label = `This week · ${commencing}`;
  else if (offset === -1) label = `Last week · ${commencing}`;
  else if (offset === 1) label = `Next week · ${commencing}`;

  return {
    label,
    shortLabel,
    rangeLabel,
    calendarLabel: `${formatWeekdayDayMonth(monday)} – ${formatWeekdayDayMonth(sunday)}${yearSuffix}`,
    weekStart: toIsoDate(monday),
    weekEnd: toIsoDate(sunday),
    isoWeek: isoWeekNumber(monday),
  };
}

function mondayForOffset(offset: number, now: Date): Date {
  return addLocalDays(startOfUkWeek(now), offset * 7);
}

/**
 * Outdoor-temperature style seasonality for London.
 * Index 0 = January … 11 = December.
 * Winter higher for heat/power; summer higher for garden/water.
 */
const OUTDOOR_HEAT = [
  1.32, 1.26, 1.14, 1.02, 0.9, 0.82, 0.78, 0.8, 0.88, 1.0, 1.14, 1.28,
];
const GARDEN_WATER = [
  0.86, 0.88, 0.96, 1.08, 1.16, 1.24, 1.28, 1.22, 1.1, 0.98, 0.9, 0.86,
];
const WORKS_SEASON = [
  0.82, 0.86, 1.02, 1.1, 1.16, 1.2, 1.18, 1.14, 1.08, 1.0, 0.9, 0.78,
];

function seasonalForSubject(subjectId: string, monday: Date): number {
  const m = monday.getMonth();
  const heat = OUTDOOR_HEAT[m]!;
  const garden = GARDEN_WATER[m]!;
  const works = WORKS_SEASON[m]!;
  const parent = subjectId.split(':')[0] ?? subjectId;

  if (
    subjectId === 'utilities:energy' ||
    subjectId === 'utilities:fuel' ||
    subjectId.includes('air-conditioning') ||
    subjectId.includes('back-ups')
  ) {
    return heat;
  }
  if (subjectId === 'utilities:water' || parent === 'livestock') {
    return garden;
  }
  if (parent === 'utilities' || subjectId === 'headline-total') {
    // Whole-home / utilities bag: winter heat dominates, mild summer pump lift.
    return heat * 0.72 + garden * 0.28;
  }
  if (parent === 'renovation') return works;
  if (parent === 'staff') return 0.94 + (heat - 1) * 0.2 + (works - 1) * 0.15;
  if (parent === 'occupancy') return 0.95 + (heat - 1) * 0.15;
  if (parent === 'transportation') return 0.96 + (heat - 1) * 0.12;
  if (parent === 'insurance') return 1;
  if (parent === 'inventory') return 0.97 + (heat - 1) * 0.1;
  return 0.96 + (heat - 1) * 0.25;
}

/** Forecast lean: winter weeks forecast higher than summer. */
function forecastLean(monday: Date, subjectId: string): number {
  const seasonal = seasonalForSubject(subjectId, monday);
  // Push forecast a touch above seasonal in winter, slightly below in summer.
  if (seasonal >= 1.12) return seasonal * 1.04;
  if (seasonal <= 0.88) return seasonal * 0.97;
  return seasonal;
}

function eventHitForSubject(
  monday: Date,
  subjectId: string,
): { bump: number; note?: string } {
  const parent = subjectId.split(':')[0] ?? subjectId;
  let bump = 0;
  let note: string | undefined;

  for (const event of HOME_EVENTS) {
    if (!event.match(monday)) continue;
    const exact = event.bumps[subjectId];
    const parentBump = event.bumps[parent];
    const add =
      exact ??
      (subjectId.includes(':') ? parentBump : undefined) ??
      0;
    if (add > 0) {
      bump += add;
      note =
        event.notes[subjectId] ??
        event.notes[parent] ??
        note;
    } else if (subjectId === 'headline-total' && event.bumps['headline-total']) {
      bump += event.bumps['headline-total']!;
      note = event.notes['headline-total'] ?? note;
    }
  }

  return { bump, note };
}

/**
 * Build ~209 weeks (−104…+104).
 * Past year-bands normalised near annual Fact; future near Forecast,
 * with winter load + calendar events so 52w windows oscillate sensibly.
 */
export function buildSpendWeeklyTape(
  subject: SpendTapeSubject,
  now = new Date(),
): SpendTapeWeek[] {
  const rand = mulberry32(hashSeed(`tape:${subject.id}:v4-2y`));
  const weeklyPlan = Math.max(subject.plan / 52, 5);
  const weeklyFact = Math.max(subject.fact / 52, 5);
  const weeklyForecast = Math.max(subject.forecast / 52, 5);
  const span = TAPE_SPAN_WEEKS;

  type Raw = { offset: number; monday: Date; raw: number; note?: string };

  const pastOlder: Raw[] = [];
  const pastRecent: Raw[] = [];
  const futureNear: Raw[] = [];
  const futureFar: Raw[] = [];

  for (let offset = -span; offset <= span; offset += 1) {
    if (offset === 0) continue;
    const monday = mondayForOffset(offset, now);
    const { bump, note } = eventHitForSubject(monday, subject.id);
    const noise = 0.96 + rand() * 0.08;

    if (offset < 0) {
      const seasonal = seasonalForSubject(subject.id, monday);
      const raw = Math.max(0, weeklyFact * seasonal * noise + bump);
      const row = { offset, monday, raw, note };
      if (offset <= -53) pastOlder.push(row);
      else pastRecent.push(row);
    } else {
      const lean = forecastLean(monday, subject.id);
      const raw = Math.max(0, weeklyForecast * lean * noise + bump);
      const row = { offset, monday, raw, note };
      if (offset <= 52) futureNear.push(row);
      else futureFar.push(row);
    }
  }

  const pastOlderVals = normalizeToSum(
    pastOlder.map((r) => r.raw),
    subject.fact * 0.96,
  );
  const pastRecentVals = normalizeToSum(
    pastRecent.map((r) => r.raw),
    subject.fact,
  );
  const futureNearVals = normalizeToSum(
    futureNear.map((r) => r.raw),
    subject.forecast,
  );
  const futureFarVals = normalizeToSum(
    futureFar.map((r) => r.raw),
    subject.forecast * 1.05,
  );

  const valueByOffset = new Map<number, number>();
  const noteByOffset = new Map<number, string>();
  pastOlder.forEach((r, i) => {
    valueByOffset.set(r.offset, pastOlderVals[i]!);
    if (r.note) noteByOffset.set(r.offset, r.note);
  });
  pastRecent.forEach((r, i) => {
    valueByOffset.set(r.offset, pastRecentVals[i]!);
    if (r.note) noteByOffset.set(r.offset, r.note);
  });
  futureNear.forEach((r, i) => {
    valueByOffset.set(r.offset, futureNearVals[i]!);
    if (r.note) noteByOffset.set(r.offset, r.note);
  });
  futureFar.forEach((r, i) => {
    valueByOffset.set(r.offset, futureFarVals[i]!);
    if (r.note) noteByOffset.set(r.offset, r.note);
  });

  const weeks: SpendTapeWeek[] = [];

  for (let offset = -span; offset <= span; offset += 1) {
    const monday = mondayForOffset(offset, now);
    const meta = ukWeekMeta(offset, now);
    const plan = round2(
      weeklyPlan * seasonalForSubject(subject.id, monday) * (0.98 + rand() * 0.04),
    );
    const note = noteByOffset.get(offset);

    if (offset < 0) {
      const fact = valueByOffset.get(offset) ?? round2(weeklyFact);
      weeks.push({
        id: `${subject.id}:w${offset}`,
        offset,
        ...meta,
        plan,
        fact,
        efficiency: efficiencyFor(fact, plan),
        note,
      });
      continue;
    }

    if (offset === 0) {
      const { bump, note: nowNote } = eventHitForSubject(monday, subject.id);
      const fact = round2(
        weeklyFact * seasonalForSubject(subject.id, monday) * 0.58 + bump * 0.3,
      );
      const forecast = round2(
        weeklyForecast * forecastLean(monday, subject.id),
      );
      weeks.push({
        id: `${subject.id}:w${offset}`,
        offset,
        ...meta,
        plan,
        fact,
        forecast,
        cashflow: round2(forecast * 0.9),
        efficiency: efficiencyFor(fact, plan * 0.58),
        note: nowNote,
      });
      continue;
    }

    const forecast = valueByOffset.get(offset) ?? round2(weeklyForecast);
    weeks.push({
      id: `${subject.id}:w${offset}`,
      offset,
      ...meta,
      plan,
      forecast,
      cashflow: round2(forecast * (0.86 + rand() * 0.08)),
      efficiency: efficiencyFor(forecast, plan),
      note,
    });
  }

  return weeks;
}

export function formatWeekMoney(value: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(value);
}

export function efficiencyLabel(efficiency: WeekEfficiency): string {
  if (efficiency === 'efficient') return 'Efficient';
  if (efficiency === 'inefficient') return 'Inefficient';
  return 'On plan';
}

/** Prefer a named story week in the last year, else “now”. */
export function defaultTapeFocusIndex(weeks: SpendTapeWeek[]): number {
  const noted = weeks.findIndex(
    (w) => w.offset < 0 && w.offset >= -52 && w.note,
  );
  if (noted >= 0) return noted;
  const now = weeks.findIndex((w) => w.offset === 0);
  return now >= 0 ? now : 0;
}

export type TapeWindow52 = {
  plan: number;
  fact: number;
  weekCount: number;
  includesForecast: boolean;
  from: SpendTapeWeek;
  to: SpendTapeWeek;
};

export function sumTrailing52(
  weeks: SpendTapeWeek[],
  focusIndex: number,
): TapeWindow52 | null {
  if (weeks.length === 0) return null;
  const end = Math.max(0, Math.min(weeks.length - 1, focusIndex));
  const start = Math.max(0, end - 51);
  const slice = weeks.slice(start, end + 1);
  const from = slice[0];
  const to = slice[slice.length - 1];
  if (!from || !to) return null;

  let plan = 0;
  let fact = 0;
  let includesForecast = false;

  for (const week of slice) {
    plan += week.plan;
    if (week.fact != null) {
      fact += week.fact;
    } else if (week.forecast != null) {
      fact += week.forecast;
      includesForecast = true;
    }
  }

  return {
    plan: Math.round(plan * 100) / 100,
    fact: Math.round(fact * 100) / 100,
    weekCount: slice.length,
    includesForecast,
    from,
    to,
  };
}

// =============================================================================
// PLACEHOLDER DATA — Helixona Operational Dashboard
// -----------------------------------------------------------------------------
// Everything here is synthetic/demo data. The structure mirrors what would come
// from:
//   - ECW (eClinicalWorks)  -> patients, appointments, procedures, vitals
//   - 8x8                   -> calls (answered / outbound)
//   - Billing               -> insurance vs cash collections
// To connect real data, replace these get* functions with calls to your API,
// keeping the same type signatures (see src/types.ts).
//
// Note: the get* functions take a numeric `scale` (1 == one month of volume)
// so they work the same for quick presets and for an exact date range.
// =============================================================================

import type {
  Alert,
  Employee,
  FunnelStage,
  Kpi,
  ModalityBreakdown,
  OccupancyUnit,
  PaymentType,
  Period,
  RoleMetric,
  Role,
  Timeframe,
  TimePoint,
  TodayEmployee,
} from '../types'

export const CLINIC_NAME = 'Helixona Wellness'

// Scale factors to simulate different time windows (1 == one month).
const TIMEFRAME_SCALE: Record<Timeframe, number> = {
  today: 1 / 30.42,
  week: 0.25,
  month: 1,
  quarter: 3,
  ytd: 5.4,
}

export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  today: 'Today',
  week: 'This week',
  month: 'This month',
  quarter: 'Quarter',
  ytd: 'Year (YTD)',
}

export const PAYMENT_LABELS: Record<PaymentType, string> = {
  all: 'Cash + Insurance',
  cash: 'Cash only',
  insurance: 'Insurance only',
}

const DAYS_PER_MONTH = 30.42

/** Inclusive day count between two ISO dates. */
export function rangeDays(from: string, to: string): number {
  const a = new Date(from + 'T00:00:00')
  const b = new Date(to + 'T00:00:00')
  const ms = b.getTime() - a.getTime()
  if (Number.isNaN(ms)) return 0
  return Math.max(1, Math.round(ms / 86_400_000) + 1)
}

/** Convert a selected period into a volume scale factor (1 == one month). */
export function getScale(period: Period): number {
  if (period.kind === 'preset') return TIMEFRAME_SCALE[period.preset]
  const days = rangeDays(period.range.from, period.range.to)
  return days / DAYS_PER_MONTH
}

/** Human label for the current period (shown in the header subtitle). */
export function formatPeriodLabel(period: Period): string {
  if (period.kind === 'preset') return TIMEFRAME_LABELS[period.preset]
  const { from, to } = period.range
  const fmt = (iso: string) =>
    new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  return `${fmt(from)} – ${fmt(to)} (${rangeDays(from, to)} days)`
}

// Small deterministic hash so the deltas look stable per filter.
function seeded(n: number, salt: number): number {
  const x = Math.sin((n + 1) * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}

function paymentMultiplier(payment: PaymentType): { cash: number; insurance: number } {
  if (payment === 'cash') return { cash: 1, insurance: 0 }
  if (payment === 'insurance') return { cash: 0, insurance: 1 }
  return { cash: 1, insurance: 1 }
}

// -----------------------------------------------------------------------------
// EXECUTIVE OVERVIEW
// -----------------------------------------------------------------------------
export function getExecutiveKpis(scale: number, payment: PaymentType): Kpi[] {
  const pm = paymentMultiplier(payment)
  const cashRev = 184_500 * scale * pm.cash
  const insRev = 142_300 * scale * pm.insurance
  const totalRev = cashRev + insRev
  const headcount = 24
  const activePatients = 1_280

  return [
    {
      id: 'revenue',
      label: 'Total revenue',
      value: Math.round(totalRev),
      format: 'currency',
      deltaPct: 8.4,
      trend: 'up',
      hint: 'Cash + Insurance collected in the period',
    },
    {
      id: 'rev-per-employee',
      label: 'Revenue / Employee',
      value: Math.round(totalRev / headcount),
      format: 'currency',
      deltaPct: 5.1,
      trend: 'up',
      hint: 'Productivity per team member',
    },
    {
      id: 'active-patients',
      label: 'Active patients',
      value: activePatients,
      format: 'number',
      deltaPct: 3.2,
      trend: 'up',
      hint: 'Patients seen in the last 90 days',
    },
    {
      id: 'rev-per-patient',
      label: 'Revenue / Patient (mo)',
      value: Math.round((184_500 + 142_300) / activePatients),
      format: 'currency',
      deltaPct: 2.7,
      trend: 'up',
      hint: 'Average monthly ticket per patient',
    },
    {
      id: 'new-patients',
      label: 'New patients',
      value: Math.round(96 * scale),
      format: 'number',
      deltaPct: 12.5,
      trend: 'up',
      hint: 'New sign-ups in the period',
    },
    {
      id: 'avg-wait',
      label: 'Wait for next appt.',
      value: 4.6,
      format: 'minutes',
      deltaPct: -6.0,
      trend: 'down',
      lowerIsBetter: true,
      hint: 'Average days waiting for the next appointment',
    },
    {
      id: 'occupancy',
      label: 'Unit occupancy',
      value: 82,
      format: 'percent',
      deltaPct: 4.0,
      trend: 'up',
      hint: 'Chairs/beds in use vs daily capacity',
    },
    {
      id: 'ivs',
      label: 'IVs administered',
      value: Math.round(1_540 * scale),
      format: 'number',
      deltaPct: 6.8,
      trend: 'up',
      hint: 'Total IV infusions in the period',
    },
  ]
}

// Revenue month over month (cash vs insurance)
export function getRevenueTrend(payment: PaymentType): TimePoint[] {
  const base: TimePoint[] = [
    { label: 'Jan', cash: 142_000, insurance: 118_000 },
    { label: 'Feb', cash: 151_000, insurance: 121_500 },
    { label: 'Mar', cash: 163_400, insurance: 128_900 },
    { label: 'Apr', cash: 158_900, insurance: 133_200 },
    { label: 'May', cash: 174_200, insurance: 139_700 },
    { label: 'Jun', cash: 184_500, insurance: 142_300 },
  ]
  const pm = paymentMultiplier(payment)
  return base.map((p) => ({
    label: p.label,
    cash: Math.round(p.cash * pm.cash),
    insurance: Math.round(p.insurance * pm.insurance),
  }))
}

// Funnel: lead -> onboarding -> patient -> first booking
export function getPatientFunnel(scale: number): FunnelStage[] {
  return [
    { stage: 'Leads', count: Math.round(420 * scale) },
    { stage: 'Contacted', count: Math.round(318 * scale) },
    { stage: 'Onboarding', count: Math.round(204 * scale) },
    { stage: 'Patients', count: Math.round(132 * scale) },
    { stage: '1st appt. booked', count: Math.round(96 * scale) },
  ]
}

export function getModalityBreakdown(scale: number, payment: PaymentType): ModalityBreakdown[] {
  const pm = payment === 'all' ? 1 : 0.55
  const base: ModalityBreakdown[] = [
    { modality: 'IV Therapy', patients: 540, revenue: 96_400 },
    { modality: 'EBOO', patients: 188, revenue: 121_300 },
    { modality: 'Hormone / HRT', patients: 224, revenue: 54_200 },
    { modality: 'Peptides', patients: 142, revenue: 31_800 },
    { modality: 'Aesthetics', patients: 186, revenue: 23_100 },
  ]
  return base.map((m) => ({
    modality: m.modality,
    patients: Math.round(m.patients * scale),
    revenue: Math.round(m.revenue * scale * pm),
  }))
}

// -----------------------------------------------------------------------------
// ROLES / KPIs by role (Front Desk, MA, PCC, Nurse, Medics, New Patient)
// -----------------------------------------------------------------------------
export function getRoles(scale: number): Role[] {
  const r = (n: number) => Math.round(n * scale)

  return [
    {
      id: 'frontDesk',
      name: 'Front Desk',
      summary: 'Collections, cash sales, and call handling (inbound/outbound).',
      source: 'ECW + 8x8',
      headcount: 4,
      metrics: [
        { label: 'Insurance collections', value: r(98_400), format: 'currency', target: r(110_000) },
        { label: 'Cash service sales', value: r(42_700), format: 'currency', target: r(45_000) },
        { label: 'Calls answered', value: r(1_840), format: 'number' },
        { label: 'Outbound calls', value: r(960), format: 'number', target: r(1_200) },
      ],
      leaderboard: [
        { name: 'Maria G.', metric: r(34_200), format: 'currency' },
        { name: 'Luis R.', metric: r(31_800), format: 'currency' },
        { name: 'Ana T.', metric: r(18_900), format: 'currency' },
      ],
    },
    {
      id: 'ma',
      name: 'Medical Assistants',
      summary: 'Patient inquiries, vitals, procedures, and refills.',
      source: 'ECW',
      headcount: 5,
      metrics: [
        { label: 'Patient inquiries', value: r(1_120), format: 'number' },
        { label: 'Vitals taken', value: r(2_310), format: 'number' },
        { label: 'Procedures', value: r(1_480), format: 'number' },
        { label: 'Rx refills', value: r(640), format: 'number' },
      ],
      leaderboard: [
        { name: 'Karen V.', metric: r(540), format: 'number' },
        { name: 'Jose M.', metric: r(498), format: 'number' },
        { name: 'Paola S.', metric: r(442), format: 'number' },
      ],
    },
    {
      id: 'pcc',
      name: 'PCC · Patient Care Coord.',
      summary: 'POC appointments, follow-ups, cash sales, and POC penetration.',
      source: 'ECW + Billing',
      headcount: 3,
      metrics: [
        { label: 'POC appointments', value: r(412), format: 'number' },
        { label: 'Follow-up appointments', value: r(688), format: 'number' },
        { label: 'Cash service sales', value: r(36_900), format: 'currency' },
        { label: 'POC penetration', value: 64, format: 'percent', target: 70 },
        { label: '% of patients dripping', value: 28, format: 'percent', lowerIsBetter: true },
      ],
      leaderboard: [
        { name: 'Diana P.', metric: r(168), format: 'number' },
        { name: 'Rafa C.', metric: r(151), format: 'number' },
        { name: 'Sofia L.', metric: r(93), format: 'number' },
      ],
    },
    {
      id: 'nurse',
      name: 'Nurses',
      summary: 'EBOO, sticks, misses, EBOO booked, and upsells.',
      source: 'ECW',
      headcount: 4,
      metrics: [
        { label: 'EBOOs performed', value: r(188), format: 'number' },
        { label: 'Sticks', value: r(1_620), format: 'number' },
        { label: 'Misses', value: r(74), format: 'number', lowerIsBetter: true, target: r(50) },
        { label: 'EBOO booked', value: r(212), format: 'number' },
        { label: 'Upsells ($ vol.)', value: r(28_400), format: 'currency' },
      ],
      leaderboard: [
        { name: 'Nurse Emma', metric: r(62), format: 'number' },
        { name: 'Nurse Jon', metric: r(54), format: 'number' },
        { name: 'Nurse Bea', metric: r(41), format: 'number' },
      ],
    },
    {
      id: 'medics',
      name: 'Medics',
      summary: 'Starts, misses ($3.20/miss), appts booked, upsells, EOD lockbox.',
      source: 'ECW',
      headcount: 5,
      metrics: [
        { label: 'Starts', value: r(1_340), format: 'number' },
        { label: 'Misses', value: r(96), format: 'number', lowerIsBetter: true, target: r(60) },
        { label: 'Appointments booked', value: r(880), format: 'number' },
        { label: 'Upsells', value: r(312), format: 'number' },
        { label: 'Cost of misses', value: r(96) * 3.2, format: 'currency', lowerIsBetter: true },
      ],
      leaderboard: [
        { name: 'Medic Tony', metric: r(298), format: 'number' },
        { name: 'Medic Ivy', metric: r(271), format: 'number' },
        { name: 'Medic Sam', metric: r(244), format: 'number' },
      ],
    },
    {
      id: 'newPatient',
      name: 'New Patient Team',
      summary: 'Leads, outbound calls, and new-patient pipeline status.',
      source: '8x8 + CRM',
      headcount: 3,
      metrics: [
        { label: 'Leads', value: r(420), format: 'number' },
        { label: 'Outbound calls', value: r(1_180), format: 'number' },
        { label: 'Onboarded', value: r(132), format: 'number' },
        { label: 'On waitlist', value: r(58), format: 'number' },
        { label: 'Declined', value: r(44), format: 'number', lowerIsBetter: true },
      ],
      leaderboard: [
        { name: 'Coord. Lucia', metric: r(58), format: 'number' },
        { name: 'Coord. Beto', metric: r(46), format: 'number' },
        { name: 'Coord. Nora', metric: r(28), format: 'number' },
      ],
    },
  ]
}

// New-patient pipeline status (for kanban-style cards)
export function getNewPatientPipeline(scale: number) {
  const r = (n: number) => Math.round(n * scale)
  return [
    { status: 'New / pending', count: r(86), tone: 'brand' as const },
    { status: 'Onboarded', count: r(132), tone: 'green' as const },
    { status: 'Waitlist', count: r(58), tone: 'amber' as const },
    { status: 'Declined', count: r(44), tone: 'red' as const },
  ]
}

// -----------------------------------------------------------------------------
// PER-EMPLOYEE METRICS
// -----------------------------------------------------------------------------
interface EmployeeSeed {
  id: string
  name: string
  role: string
  roleId: Employee['roleId']
  utilizationPct: number
  revenue: number
  metrics: { label: string; value: number; format: RoleMetric['format']; lowerIsBetter?: boolean }[]
}

const EMPLOYEE_SEEDS: EmployeeSeed[] = [
  // Front Desk
  { id: 'e1', name: 'Maria Garcia', role: 'Front Desk', roleId: 'frontDesk', utilizationPct: 94, revenue: 34_200, metrics: [
    { label: 'Insurance collections', value: 34_200, format: 'currency' },
    { label: 'Cash sales', value: 12_400, format: 'currency' },
    { label: 'Calls answered', value: 612, format: 'number' },
    { label: 'Outbound calls', value: 318, format: 'number' },
  ] },
  { id: 'e2', name: 'Luis Ramirez', role: 'Front Desk', roleId: 'frontDesk', utilizationPct: 88, revenue: 31_800, metrics: [
    { label: 'Insurance collections', value: 31_800, format: 'currency' },
    { label: 'Cash sales', value: 9_900, format: 'currency' },
    { label: 'Calls answered', value: 540, format: 'number' },
    { label: 'Outbound calls', value: 286, format: 'number' },
  ] },
  { id: 'e3', name: 'Ana Torres', role: 'Front Desk', roleId: 'frontDesk', utilizationPct: 79, revenue: 18_900, metrics: [
    { label: 'Insurance collections', value: 18_900, format: 'currency' },
    { label: 'Cash sales', value: 7_300, format: 'currency' },
    { label: 'Calls answered', value: 421, format: 'number' },
    { label: 'Outbound calls', value: 196, format: 'number' },
  ] },
  // Medical Assistants
  { id: 'e4', name: 'Karen Vega', role: 'Medical Assistant', roleId: 'ma', utilizationPct: 91, revenue: 14_200, metrics: [
    { label: 'Vitals taken', value: 540, format: 'number' },
    { label: 'Procedures', value: 372, format: 'number' },
    { label: 'Patient inquiries', value: 268, format: 'number' },
    { label: 'Rx refills', value: 154, format: 'number' },
  ] },
  { id: 'e5', name: 'Jose Mendez', role: 'Medical Assistant', roleId: 'ma', utilizationPct: 86, revenue: 12_800, metrics: [
    { label: 'Vitals taken', value: 498, format: 'number' },
    { label: 'Procedures', value: 341, format: 'number' },
    { label: 'Patient inquiries', value: 240, format: 'number' },
    { label: 'Rx refills', value: 132, format: 'number' },
  ] },
  { id: 'e6', name: 'Paola Suarez', role: 'Medical Assistant', roleId: 'ma', utilizationPct: 82, revenue: 11_100, metrics: [
    { label: 'Vitals taken', value: 442, format: 'number' },
    { label: 'Procedures', value: 298, format: 'number' },
    { label: 'Patient inquiries', value: 212, format: 'number' },
    { label: 'Rx refills', value: 118, format: 'number' },
  ] },
  // PCC
  { id: 'e7', name: 'Diana Peralta', role: 'PCC', roleId: 'pcc', utilizationPct: 93, revenue: 18_400, metrics: [
    { label: 'POC appointments', value: 168, format: 'number' },
    { label: 'Follow-ups', value: 280, format: 'number' },
    { label: 'Cash sales', value: 18_400, format: 'currency' },
    { label: 'POC penetration', value: 71, format: 'percent' },
  ] },
  { id: 'e8', name: 'Rafa Castro', role: 'PCC', roleId: 'pcc', utilizationPct: 84, revenue: 12_100, metrics: [
    { label: 'POC appointments', value: 151, format: 'number' },
    { label: 'Follow-ups', value: 248, format: 'number' },
    { label: 'Cash sales', value: 12_100, format: 'currency' },
    { label: 'POC penetration', value: 63, format: 'percent' },
  ] },
  { id: 'e9', name: 'Sofia Lopez', role: 'PCC', roleId: 'pcc', utilizationPct: 76, revenue: 6_400, metrics: [
    { label: 'POC appointments', value: 93, format: 'number' },
    { label: 'Follow-ups', value: 160, format: 'number' },
    { label: 'Cash sales', value: 6_400, format: 'currency' },
    { label: 'POC penetration', value: 55, format: 'percent' },
  ] },
  // Nurses
  { id: 'e10', name: 'Emma Walsh', role: 'Nurse', roleId: 'nurse', utilizationPct: 95, revenue: 41_600, metrics: [
    { label: 'EBOOs performed', value: 62, format: 'number' },
    { label: 'Sticks', value: 540, format: 'number' },
    { label: 'Misses', value: 18, format: 'number', lowerIsBetter: true },
    { label: 'Upsells ($)', value: 12_400, format: 'currency' },
  ] },
  { id: 'e11', name: 'Jon Pierce', role: 'Nurse', roleId: 'nurse', utilizationPct: 89, revenue: 36_200, metrics: [
    { label: 'EBOOs performed', value: 54, format: 'number' },
    { label: 'Sticks', value: 498, format: 'number' },
    { label: 'Misses', value: 24, format: 'number', lowerIsBetter: true },
    { label: 'Upsells ($)', value: 9_800, format: 'currency' },
  ] },
  { id: 'e12', name: 'Bea Nolan', role: 'Nurse', roleId: 'nurse', utilizationPct: 80, revenue: 27_500, metrics: [
    { label: 'EBOOs performed', value: 41, format: 'number' },
    { label: 'Sticks', value: 402, format: 'number' },
    { label: 'Misses', value: 32, format: 'number', lowerIsBetter: true },
    { label: 'Upsells ($)', value: 6_200, format: 'currency' },
  ] },
  // Medics
  { id: 'e13', name: 'Tony Reyes', role: 'Medic', roleId: 'medics', utilizationPct: 92, revenue: 22_800, metrics: [
    { label: 'Starts', value: 298, format: 'number' },
    { label: 'Appointments booked', value: 210, format: 'number' },
    { label: 'Misses', value: 19, format: 'number', lowerIsBetter: true },
    { label: 'Upsells', value: 84, format: 'number' },
  ] },
  { id: 'e14', name: 'Ivy Chen', role: 'Medic', roleId: 'medics', utilizationPct: 87, revenue: 20_100, metrics: [
    { label: 'Starts', value: 271, format: 'number' },
    { label: 'Appointments booked', value: 188, format: 'number' },
    { label: 'Misses', value: 26, format: 'number', lowerIsBetter: true },
    { label: 'Upsells', value: 71, format: 'number' },
  ] },
  { id: 'e15', name: 'Sam Brooks', role: 'Medic', roleId: 'medics', utilizationPct: 81, revenue: 17_900, metrics: [
    { label: 'Starts', value: 244, format: 'number' },
    { label: 'Appointments booked', value: 162, format: 'number' },
    { label: 'Misses', value: 31, format: 'number', lowerIsBetter: true },
    { label: 'Upsells', value: 58, format: 'number' },
  ] },
]

export function getEmployees(scale: number): Employee[] {
  return EMPLOYEE_SEEDS.map((e) => ({
    id: e.id,
    name: e.name,
    role: e.role,
    roleId: e.roleId,
    utilizationPct: e.utilizationPct,
    revenue: Math.round(e.revenue * scale),
    metrics: e.metrics.map((m) => ({
      label: m.label,
      // percentages and utilization do not scale with the period
      value: m.format === 'percent' ? m.value : Math.round(m.value * scale),
      format: m.format,
      lowerIsBetter: m.lowerIsBetter,
    })),
  }))
}

// -----------------------------------------------------------------------------
// TODAY — live daily snapshot
// -----------------------------------------------------------------------------

// Clinic hours, used to figure out how much of "today" has happened so far.
const CLINIC_OPEN = 8
const CLINIC_CLOSE = 18

/** Current clinic hour, clamped to opening hours (drives the "so far today" cut). */
function nowHour(): number {
  const h = new Date().getHours()
  return Math.min(CLINIC_CLOSE, Math.max(CLINIC_OPEN, h))
}

/** "as of" timestamp shown on the live view. */
export function asOfLabel(): string {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function getTodayKpis(): Kpi[] {
  const scheduled = 52
  const arrived = 38
  const cash = 6_240
  const insurance = 4_810
  return [
    {
      id: 'patients-today',
      label: 'Patients in today',
      value: arrived,
      format: 'number',
      deltaPct: 9.0,
      trend: 'up',
      hint: `${arrived} of ${scheduled} scheduled checked in`,
    },
    {
      id: 'revenue-today',
      label: 'Revenue today',
      value: cash + insurance,
      format: 'currency',
      deltaPct: 12.0,
      trend: 'up',
      hint: `Cash $${cash.toLocaleString()} · Insurance $${insurance.toLocaleString()}`,
    },
    {
      id: 'appts-remaining',
      label: 'Appointments left',
      value: 14,
      format: 'number',
      deltaPct: 0,
      trend: 'flat',
      hint: 'Still on the schedule for today',
    },
    {
      id: 'new-today',
      label: 'New patients today',
      value: 5,
      format: 'number',
      deltaPct: 25.0,
      trend: 'up',
      hint: 'First-time sign-ups checked in today',
    },
    {
      id: 'occupancy-now',
      label: 'Occupancy now',
      value: 78,
      format: 'percent',
      deltaPct: 6.0,
      trend: 'up',
      hint: 'Chairs/beds in use right now',
    },
    {
      id: 'no-shows-today',
      label: 'No-shows today',
      value: 3,
      format: 'number',
      deltaPct: -1.0,
      trend: 'down',
      lowerIsBetter: true,
      hint: 'Missed appointments so far',
    },
    {
      id: 'ivs-today',
      label: 'IVs today',
      value: 47,
      format: 'number',
      deltaPct: 8.0,
      trend: 'up',
      hint: 'Infusions administered so far',
    },
    {
      id: 'eboo-today',
      label: 'EBOOs today',
      value: 6,
      format: 'number',
      deltaPct: 20.0,
      trend: 'up',
      hint: 'EBOO procedures completed',
    },
  ]
}

/** Patient arrivals and revenue per hour today (only past hours have actuals). */
export function getTodayHourly(): { hour: string; arrivals: number; revenue: number; past: boolean }[] {
  const nh = nowHour()
  const shape = [3, 5, 6, 7, 4, 5, 6, 5, 4, 2] // arrivals per hour, 8a..5p
  return shape.map((arrivals, i) => {
    const hour24 = CLINIC_OPEN + i
    const past = hour24 < nh
    const label = `${((hour24 + 11) % 12) + 1}${hour24 < 12 ? 'a' : 'p'}`
    return {
      hour: label,
      arrivals: past ? arrivals : 0,
      revenue: past ? arrivals * 290 : 0,
      past,
    }
  })
}

/** Live per-employee performance for today. */
export function getEmployeesToday(): TodayEmployee[] {
  // Who's on shift today (a realistic subset of the roster).
  const shift: Record<string, { patients: number; revenue: number; target: number }> = {
    e1: { patients: 9, revenue: 2_100, target: 2_400 },
    e2: { patients: 7, revenue: 1_640, target: 2_000 },
    e4: { patients: 12, revenue: 980, target: 900 },
    e5: { patients: 10, revenue: 820, target: 900 },
    e7: { patients: 8, revenue: 1_480, target: 1_300 },
    e10: { patients: 6, revenue: 3_200, target: 2_800 },
    e11: { patients: 5, revenue: 2_300, target: 2_600 },
    e13: { patients: 11, revenue: 1_620, target: 1_500 },
    e14: { patients: 9, revenue: 1_280, target: 1_500 },
  }
  return EMPLOYEE_SEEDS.map((e) => {
    const s = shift[e.id]
    if (!s) {
      return {
        id: e.id,
        name: e.name,
        role: e.role,
        onShift: false,
        patients: 0,
        revenue: 0,
        target: 0,
        perfPct: 0,
        status: 'off' as const,
      }
    }
    const perfPct = Math.round((s.revenue / s.target) * 100)
    const status: TodayEmployee['status'] =
      perfPct >= 100 ? 'ahead' : perfPct >= 85 ? 'on-track' : 'behind'
    return {
      id: e.id,
      name: e.name,
      role: e.role,
      onShift: true,
      patients: s.patients,
      revenue: s.revenue,
      target: s.target,
      perfPct,
      status,
    }
  })
}

// -----------------------------------------------------------------------------
// UNIT OCCUPANCY (chairs / beds per day)
// -----------------------------------------------------------------------------
export function getOccupancy(): OccupancyUnit[] {
  return [
    { unit: 'IV Suite A', capacity: 8, booked: 7 },
    { unit: 'IV Suite B', capacity: 8, booked: 6 },
    { unit: 'EBOO Room 1', capacity: 4, booked: 4 },
    { unit: 'EBOO Room 2', capacity: 4, booked: 3 },
    { unit: 'Exam Room 1', capacity: 6, booked: 5 },
    { unit: 'Exam Room 2', capacity: 6, booked: 4 },
    { unit: 'Aesthetics', capacity: 5, booked: 4 },
  ]
}

// Occupancy across the day (simple heatmap)
export function getHourlyOccupancy(): { hour: string; pct: number }[] {
  const hours = ['8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p']
  return hours.map((hour, i) => ({
    hour,
    pct: Math.round(45 + 50 * Math.abs(Math.sin((i + 1) / 2)) - seeded(i, 3) * 10),
  }))
}

// -----------------------------------------------------------------------------
// ALERTS (actionable insights)
// -----------------------------------------------------------------------------
export function getAlerts(): Alert[] {
  return [
    {
      id: 'a1',
      severity: 'critical',
      message: 'Medics: misses above target (96 vs 60). Estimated cost $307.',
      area: 'Medics',
    },
    {
      id: 'a2',
      severity: 'warning',
      message: 'PCC: POC penetration at 64%, below the 70% target.',
      area: 'PCC',
    },
    {
      id: 'a3',
      severity: 'warning',
      message: 'Front Desk: outbound calls at 960 vs target of 1,200.',
      area: 'Front Desk',
    },
    {
      id: 'a4',
      severity: 'info',
      message: 'EBOO needs its own landing page — 212 booked, high demand.',
      area: 'Growth',
    },
  ]
}

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
  AgingRow,
  Alert,
  DenialCategory,
  EmailCampaign,
  Employee,
  FunnelStage,
  Goal,
  Kpi,
  MarketingChannel,
  ModalityBreakdown,
  OccupancyUnit,
  PatientRecord,
  PayerClaims,
  PaymentType,
  Period,
  RoleMetric,
  Role,
  Timeframe,
  TimePoint,
  TodayEmployee,
  Treatment,
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
      format: 'days',
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

export type RevenueMode = 'estimated' | 'collected'

// Collection factors: cash is mostly collected; insurance pays the allowable amount.
const COLLECT_FACTOR = { cash: 0.96, insurance: 0.58 }

// Revenue month over month (cash vs insurance).
// `estimated` = gross billed; `collected` = actually received.
export function getRevenueTrend(payment: PaymentType, mode: RevenueMode = 'estimated'): TimePoint[] {
  const base: TimePoint[] = [
    { label: 'Jan', cash: 142_000, insurance: 118_000 },
    { label: 'Feb', cash: 151_000, insurance: 121_500 },
    { label: 'Mar', cash: 163_400, insurance: 128_900 },
    { label: 'Apr', cash: 158_900, insurance: 133_200 },
    { label: 'May', cash: 174_200, insurance: 139_700 },
    { label: 'Jun', cash: 184_500, insurance: 142_300 },
  ]
  const pm = paymentMultiplier(payment)
  const cf = mode === 'collected' ? COLLECT_FACTOR : { cash: 1, insurance: 1 }
  return base.map((p) => ({
    label: p.label,
    cash: Math.round(p.cash * pm.cash * cf.cash),
    insurance: Math.round(p.insurance * pm.insurance * cf.insurance),
  }))
}

/** Estimated (gross/billed) vs collected revenue for the current month. */
export function getRevenueSummary(payment: PaymentType): {
  estimated: number
  collected: number
  collectionRate: number
  collectedToday: number
} {
  const estTrend = getRevenueTrend(payment, 'estimated')
  const colTrend = getRevenueTrend(payment, 'collected')
  const est = estTrend[estTrend.length - 1]
  const col = colTrend[colTrend.length - 1]
  const estimated = est.cash + est.insurance
  const collected = col.cash + col.insurance
  return {
    estimated,
    collected,
    collectionRate: estimated ? Math.round((collected / estimated) * 100) : 0,
    collectedToday: Math.round(collected / 30),
  }
}

// Funnel: lead -> onboarding -> patient -> first booking
export function getPatientFunnel(scale: number): FunnelStage[] {
  return [
    { stage: 'Leads', count: Math.round(420 * scale) },
    { stage: 'Contacted', count: Math.round(318 * scale) },
    { stage: 'Onboarding', count: Math.round(204 * scale) },
    { stage: 'Patients', count: Math.round(132 * scale) },
    { stage: '1st appt. booked', count: Math.round(96 * scale) },
    { stage: 'Denied / declined', count: Math.round(44 * scale) },
  ]
}

// -----------------------------------------------------------------------------
// HELIXONA SERVICE CATALOG — real treatments & diagnostics (single source)
// -----------------------------------------------------------------------------
interface CatalogItem {
  name: string
  patients: number
  treatments: number
  occupancyPct: number
  revenue: number
  capacity: number
  booked: number
}

const SERVICE_CATALOG: CatalogItem[] = [
  // Therapies
  { name: 'IV Therapy', patients: 540, treatments: 1_540, occupancyPct: 84, revenue: 96_400, capacity: 25, booked: 21 },
  { name: 'EBOO', patients: 188, treatments: 212, occupancyPct: 92, revenue: 121_300, capacity: 8, booked: 7 },
  { name: 'Platelet-Rich Plasma (PRP)', patients: 64, treatments: 88, occupancyPct: 61, revenue: 78_200, capacity: 6, booked: 4 },
  { name: 'Erchonia Laser Therapy', patients: 142, treatments: 410, occupancyPct: 68, revenue: 31_800, capacity: 10, booked: 7 },
  { name: 'Neuromuscular Therapy', patients: 132, treatments: 360, occupancyPct: 66, revenue: 26_800, capacity: 10, booked: 7 },
  { name: 'LymphStar LET Therapy', patients: 110, treatments: 320, occupancyPct: 63, revenue: 22_100, capacity: 8, booked: 5 },
  { name: 'BEMER Therapy', patients: 96, treatments: 280, occupancyPct: 55, revenue: 18_400, capacity: 8, booked: 4 },
  { name: 'BioCharger', patients: 88, treatments: 240, occupancyPct: 52, revenue: 14_600, capacity: 6, booked: 3 },
  { name: 'SCENAR Therapy', patients: 74, treatments: 190, occupancyPct: 49, revenue: 12_600, capacity: 6, booked: 3 },
  { name: 'Biomodulator Therapy', patients: 68, treatments: 160, occupancyPct: 47, revenue: 11_200, capacity: 6, booked: 3 },
  // Diagnostics (Functional Neuro Exam)
  { name: 'RightEye Diagnostics', patients: 168, treatments: 168, occupancyPct: 58, revenue: 11_700, capacity: 8, booked: 5 },
  { name: 'Autonomic Nervous System', patients: 142, treatments: 142, occupancyPct: 54, revenue: 9_800, capacity: 8, booked: 4 },
  { name: 'InBody 970', patients: 312, treatments: 312, occupancyPct: 74, revenue: 9_400, capacity: 12, booked: 9 },
  { name: 'MEAD Analysis', patients: 96, treatments: 96, occupancyPct: 44, revenue: 6_200, capacity: 6, booked: 3 },
]

/** Helixona program tracks patients enroll in. */
export function getPrograms() {
  return [
    { name: 'Wellness & Longevity', patients: 600 },
    { name: 'Chronic Illness', patients: 412 },
  ]
}

export function getModalityBreakdown(scale: number, payment: PaymentType): ModalityBreakdown[] {
  const pm = payment === 'all' ? 1 : 0.55
  // Top services by revenue keep the charts readable.
  const top = [...SERVICE_CATALOG].sort((a, b) => b.revenue - a.revenue).slice(0, 8)
  return top.map((m) => ({
    modality: m.name,
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
      id: 'provider',
      name: 'Provider · Dr. Drannikov',
      summary: 'New & established appointments, acupuncture, trigger points, hormones, PRP.',
      source: 'ECW',
      headcount: 1,
      metrics: [
        { label: 'New patient appointments', value: r(96), format: 'number' },
        { label: 'Established patient appts', value: r(444), format: 'number' },
        { label: 'Acupuncture appointments', value: r(84), format: 'number' },
        { label: 'Trigger point injections', value: r(62), format: 'number' },
        { label: 'Hormone consults', value: r(58), format: 'number' },
        { label: 'PRP procedures', value: r(34), format: 'number' },
        { label: 'Unlocked charts', value: r(14), format: 'number', lowerIsBetter: true },
      ],
      leaderboard: [
        { name: 'Dr. Drannikov', metric: r(540), format: 'number' },
        { name: 'Tom', metric: r(312), format: 'number' },
      ],
    },
    {
      id: 'pa',
      name: 'Physician Associate · Brock',
      summary: 'Patient visits, procedures, and EBOO clearances under the provider.',
      source: 'ECW',
      headcount: 1,
      metrics: [
        { label: 'Patients seen', value: r(386), format: 'number' },
        { label: 'Procedures', value: r(248), format: 'number' },
        { label: 'EBOO clearances', value: r(84), format: 'number' },
        { label: 'Follow-ups', value: r(212), format: 'number' },
        { label: 'Unlocked charts', value: r(9), format: 'number', lowerIsBetter: true },
      ],
      leaderboard: [{ name: 'Brock', metric: r(386), format: 'number' }],
    },
    {
      id: 'newPatient',
      name: 'New Patient Advisor · Marie',
      summary: 'Calls, messages, and texts — all tracked with trending over time.',
      source: '8x8 + CRM',
      headcount: 1,
      metrics: [
        { label: 'Calls', value: r(1_180), format: 'number' },
        { label: 'Messages', value: r(940), format: 'number' },
        { label: 'Texts', value: r(1_460), format: 'number' },
        { label: 'Leads', value: r(420), format: 'number' },
        { label: 'Onboarded', value: r(132), format: 'number' },
        { label: 'On waitlist', value: r(58), format: 'number' },
      ],
      leaderboard: [{ name: 'Marie', metric: r(132), format: 'number' }],
    },
    {
      id: 'frontDesk',
      name: 'Front Desk',
      summary: 'Cash sales, copays/deductibles, and call handling.',
      source: 'ECW + 8x8',
      headcount: 2,
      metrics: [
        { label: 'Cash service sales', value: r(42_700), format: 'currency', target: r(45_000) },
        { label: 'Copays & deductibles', value: r(18_300), format: 'currency' },
        { label: 'Inbound calls', value: r(2_140), format: 'number' },
        { label: 'Calls answered', value: r(1_840), format: 'number' },
        { label: 'Missed calls', value: r(300), format: 'number', lowerIsBetter: true },
        { label: 'Voicemails', value: r(180), format: 'number' },
        { label: '% inbound answered', value: 86, format: 'percent', target: 90 },
        { label: 'Avg call duration', value: 4.2, format: 'minutes' },
      ],
      leaderboard: [
        { name: 'Yazmine', metric: r(24_100), format: 'currency' },
        { name: 'Heily', metric: r(18_600), format: 'currency' },
      ],
    },
    {
      id: 'ma',
      name: 'Medical Assistants',
      summary: 'Vitals, procedures, prescription refills, and patient inquiries.',
      source: 'ECW',
      headcount: 2,
      metrics: [
        { label: 'Vitals taken', value: r(2_310), format: 'number' },
        { label: 'Procedures', value: r(1_480), format: 'number' },
        { label: 'Prescription refills', value: r(640), format: 'number' },
        { label: 'Patient messages', value: r(1_120), format: 'number' },
        { label: 'Plan of care releases', value: r(420), format: 'number' },
        { label: 'Extension calls', value: r(560), format: 'number' },
      ],
      leaderboard: [
        { name: 'Charlene (Virtual)', metric: r(540), format: 'number' },
        { name: 'Bee', metric: r(498), format: 'number' },
      ],
    },
    {
      id: 'medic',
      name: 'Medics',
      summary: 'IVs, stars, misses, IVs booked, open charts, and unlocked notes.',
      source: 'ECW',
      headcount: 1,
      metrics: [
        { label: 'Starts', value: r(1_620), format: 'number' },
        { label: 'Misses', value: r(74), format: 'number', lowerIsBetter: true, target: r(50) },
        { label: 'Cost of misses', value: r(74) * 3.2, format: 'currency', lowerIsBetter: true },
        { label: 'IVs administered', value: r(1_540), format: 'number' },
        { label: 'IVs booked', value: r(1_720), format: 'number' },
        { label: 'Unlocked notes', value: r(21), format: 'number', lowerIsBetter: true },
      ],
      leaderboard: [{ name: 'Bea', metric: r(1_540), format: 'number' }],
    },
    {
      id: 'nurse',
      name: 'Nurses',
      summary: 'EBOOs and IVs.',
      source: 'ECW',
      headcount: 1,
      metrics: [
        { label: 'EBOOs performed', value: r(188), format: 'number' },
        { label: 'EBOO booked', value: r(212), format: 'number' },
        { label: 'IVs administered', value: r(620), format: 'number' },
      ],
      leaderboard: [{ name: 'Nic', metric: r(188), format: 'number' }],
    },
    {
      id: 'technician',
      name: 'Technician · Kyle',
      summary: 'Diagnostics, laser, eyedrop, BioCharger, and energetics sessions.',
      source: 'ECW',
      headcount: 1,
      metrics: [
        { label: 'Diagnostics executed', value: r(248), format: 'number' },
        { label: 'Laser sessions', value: r(186), format: 'number' },
        { label: 'Eyedrop procedures', value: r(142), format: 'number' },
        { label: 'BioCharger sessions', value: r(96), format: 'number' },
        { label: 'Energetics sessions', value: r(74), format: 'number' },
      ],
      leaderboard: [{ name: 'Kyle', metric: r(248), format: 'number' }],
    },
    {
      id: 'billing',
      name: 'Billing',
      summary: 'Insurance collections, claims, denials, and appeals.',
      source: 'ECW Billing',
      headcount: 2,
      metrics: [
        { label: 'Insurance collections', value: r(98_400), format: 'currency', target: r(110_000) },
        { label: 'Claims not sent (today)', value: 12, format: 'number', lowerIsBetter: true },
        { label: 'Avg days to submit claim', value: 1.8, format: 'days', lowerIsBetter: true },
        { label: 'Claims denied', value: r(86), format: 'number', lowerIsBetter: true },
        { label: 'Denial rate', value: 11, format: 'percent', lowerIsBetter: true, target: 8 },
        { label: 'Appeals sent', value: r(34), format: 'number' },
        { label: 'Claims appealed', value: r(41), format: 'number' },
        { label: 'Claims paid', value: r(612), format: 'number' },
      ],
      leaderboard: [
        { name: 'Vignesh', metric: r(420), format: 'number' },
        { name: 'Kamalesh', metric: r(362), format: 'number' },
      ],
    },
    {
      id: 'ops',
      name: 'Operations Manager · Karina',
      summary: 'Provider scheduling, patient retention, and team productivity.',
      source: 'ECW',
      headcount: 1,
      metrics: [
        { label: 'Avg days of appts per provider', value: 6.2, format: 'days' },
        { label: 'Active patients w/o next appt', value: r(214), format: 'number', lowerIsBetter: true },
        { label: 'Revenue per employee', value: r(23_300), format: 'currency' },
        { label: 'Days to next patient visit (new)', value: 4.6, format: 'days', lowerIsBetter: true },
      ],
      leaderboard: [{ name: 'Karina', metric: 84, format: 'percent' }],
    },
    {
      id: 'admin',
      name: 'Admin · Shibani',
      summary: 'Can edit company info, Employees, and Roles. Scheduling oversight.',
      source: 'Admin portal',
      headcount: 1,
      metrics: [
        { label: 'Schedule fill rate', value: 84, format: 'percent', target: 85 },
        { label: 'Unit occupancy', value: 82, format: 'percent', target: 80 },
        { label: 'No-shows', value: r(96), format: 'number', lowerIsBetter: true },
        { label: 'Company goals tracked', value: 7, format: 'number' },
      ],
      leaderboard: [{ name: 'Shibani', metric: 84, format: 'percent' }],
    },
  ]
}

// -----------------------------------------------------------------------------
// PATIENT JOURNEY — individual patient detail / lifecycle stage
// -----------------------------------------------------------------------------

// The lifecycle every patient moves through.
export const PATIENT_STAGES = [
  'Lead',
  'Contacted',
  'Onboarding',
  'Patient',
  'First appointment',
  'Active',
] as const

const PATIENTS: PatientRecord[] = [
  {
    id: 'p1', name: 'Olivia Bennett', stageIndex: 5, status: 'active', modality: 'IV Therapy',
    coordinator: 'Marie', source: 'Referral', createdAt: '2026-02-10',
    nextAppt: '2026-06-09', revenue: 3_420, phone: '(305) 555-0142', email: 'olivia.b@example.com',
    stageDates: ['2026-02-10', '2026-02-11', '2026-02-14', '2026-02-18', '2026-02-25', '2026-03-12'],
  },
  {
    id: 'p2', name: 'Marcus Hale', stageIndex: 4, status: 'on-track', modality: 'EBOO',
    coordinator: 'Marie', source: 'EBOO landing page', createdAt: '2026-05-20',
    nextAppt: '2026-06-06', revenue: 1_850, phone: '(305) 555-0188', email: 'm.hale@example.com',
    stageDates: ['2026-05-20', '2026-05-21', '2026-05-26', '2026-05-30', '2026-06-02', undefined],
  },
  {
    id: 'p3', name: 'Sophia Nguyen', stageIndex: 3, status: 'on-track', modality: 'Neuromuscular Therapy',
    coordinator: 'Marie', source: 'Ad spend', createdAt: '2026-05-28',
    nextAppt: '2026-06-05', revenue: 420, phone: '(305) 555-0123', email: 's.nguyen@example.com',
    stageDates: ['2026-05-28', '2026-05-29', '2026-06-01', '2026-06-03', undefined, undefined],
  },
  {
    id: 'p4', name: 'James Carter', stageIndex: 2, status: 'on-track', modality: 'Erchonia Laser Therapy',
    coordinator: 'Marie', source: 'Referral', createdAt: '2026-06-01',
    nextAppt: undefined, revenue: 0, phone: '(305) 555-0177', email: 'jcarter@example.com',
    stageDates: ['2026-06-01', '2026-06-02', '2026-06-03', undefined, undefined, undefined],
  },
  {
    id: 'p5', name: 'Emma Rodriguez', stageIndex: 1, status: 'on-track', modality: 'BEMER Therapy',
    coordinator: 'Marie', source: 'Instagram', createdAt: '2026-06-02',
    nextAppt: undefined, revenue: 0, phone: '(305) 555-0119', email: 'emma.r@example.com',
    stageDates: ['2026-06-02', '2026-06-03', undefined, undefined, undefined, undefined],
  },
  {
    id: 'p6', name: 'Liam Foster', stageIndex: 0, status: 'on-track', modality: 'IV Therapy',
    coordinator: 'Marie', source: 'Ad spend', createdAt: '2026-06-04',
    nextAppt: undefined, revenue: 0, phone: '(305) 555-0160', email: 'liam.f@example.com',
    stageDates: ['2026-06-04', undefined, undefined, undefined, undefined, undefined],
  },
  {
    id: 'p7', name: 'Ava Mitchell', stageIndex: 2, status: 'waitlist', modality: 'EBOO',
    coordinator: 'Marie', source: 'EBOO landing page', createdAt: '2026-05-25',
    nextAppt: undefined, revenue: 0, phone: '(305) 555-0101', email: 'ava.m@example.com',
    stageDates: ['2026-05-25', '2026-05-27', '2026-05-31', undefined, undefined, undefined],
  },
  {
    id: 'p8', name: 'Noah Pearson', stageIndex: 1, status: 'declined', modality: 'Neuromuscular Therapy',
    coordinator: 'Marie', source: 'Ad spend', createdAt: '2026-05-22',
    nextAppt: undefined, revenue: 0, phone: '(305) 555-0134', email: 'noah.p@example.com',
    stageDates: ['2026-05-22', '2026-05-24', undefined, undefined, undefined, undefined],
    declineReason: 'Cost — chose not to proceed after pricing',
  },
  {
    id: 'p9', name: 'Isabella Reed', stageIndex: 5, status: 'active', modality: 'IV Therapy',
    coordinator: 'Marie', source: 'Referral', createdAt: '2026-01-15',
    nextAppt: '2026-06-07', revenue: 5_120, phone: '(305) 555-0155', email: 'bella.r@example.com',
    stageDates: ['2026-01-15', '2026-01-16', '2026-01-19', '2026-01-23', '2026-01-30', '2026-02-14'],
  },
  {
    id: 'p10', name: 'Ethan Brooks', stageIndex: 4, status: 'on-track', modality: 'Erchonia Laser Therapy',
    coordinator: 'Marie', source: 'Instagram', createdAt: '2026-05-18',
    nextAppt: '2026-06-10', revenue: 980, phone: '(305) 555-0166', email: 'ethan.b@example.com',
    stageDates: ['2026-05-18', '2026-05-19', '2026-05-23', '2026-05-27', '2026-06-01', undefined],
  },
  {
    id: 'p11', name: 'Mia Coleman', stageIndex: 3, status: 'on-track', modality: 'BEMER Therapy',
    coordinator: 'Marie', source: 'Referral', createdAt: '2026-05-30',
    nextAppt: '2026-06-08', revenue: 260, phone: '(305) 555-0111', email: 'mia.c@example.com',
    stageDates: ['2026-05-30', '2026-05-31', '2026-06-02', '2026-06-04', undefined, undefined],
  },
  {
    id: 'p12', name: 'Lucas Ward', stageIndex: 0, status: 'on-track', modality: 'EBOO',
    coordinator: 'Marie', source: 'EBOO landing page', createdAt: '2026-06-03',
    nextAppt: undefined, revenue: 0, phone: '(305) 555-0148', email: 'lucas.w@example.com',
    stageDates: ['2026-06-03', undefined, undefined, undefined, undefined, undefined],
  },
  {
    id: 'p13', name: 'Grace Sullivan', stageIndex: 2, status: 'declined', modality: 'IV Therapy',
    coordinator: 'Marie', source: 'Ad spend', createdAt: '2026-05-19',
    nextAppt: undefined, revenue: 0, phone: '(305) 555-0172', email: 'grace.s@example.com',
    stageDates: ['2026-05-19', '2026-05-20', '2026-05-23', undefined, undefined, undefined],
    declineReason: 'Insurance not accepted (out-of-network)',
  },
  {
    id: 'p14', name: 'Henry Diaz', stageIndex: 1, status: 'declined', modality: 'Erchonia Laser Therapy',
    coordinator: 'Marie', source: 'Instagram', createdAt: '2026-05-21',
    nextAppt: undefined, revenue: 0, phone: '(305) 555-0193', email: 'henry.d@example.com',
    stageDates: ['2026-05-21', '2026-05-23', undefined, undefined, undefined, undefined],
    declineReason: 'Unresponsive after 3 outreach attempts',
  },
]

export function getPatients(): PatientRecord[] {
  return PATIENTS
}

// New-patient team operational status (waitlist, next slot, weekly review).
export function getNewPatientTeam() {
  return {
    nextNewPatientSlot: '2026-06-06',
    waitlist: 58,
    lastReview: '2026-05-29',
    nextReview: '2026-06-05',
    reviewers: 'Marie & Shibani',
    reviewStatus: 'Pending' as 'Pending' | 'Committed',
  }
}

// New-patient pipeline status (for kanban-style cards)
export function getNewPatientPipeline(scale: number) {
  const r = (n: number) => Math.round(n * scale)
  return [
    { status: 'Leads', count: r(86), tone: 'brand' as const },
    { status: 'Onboarded', count: r(132), tone: 'green' as const },
    { status: 'Waitlisted', count: r(58), tone: 'amber' as const },
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
  { id: 'e1', name: 'Dr. Drannikov', role: 'Provider', roleId: 'provider', utilizationPct: 96, revenue: 96_400, metrics: [
    { label: 'New patient appts', value: 96, format: 'number' },
    { label: 'Established appts', value: 444, format: 'number' },
    { label: 'Acupuncture', value: 84, format: 'number' },
    { label: 'Trigger points', value: 62, format: 'number' },
    { label: 'Hormone consults', value: 58, format: 'number' },
    { label: 'PRP procedures', value: 34, format: 'number' },
    { label: 'Unlocked charts', value: 14, format: 'number', lowerIsBetter: true },
  ] },
  { id: 'e2', name: 'Brock', role: 'Physician Associate', roleId: 'pa', utilizationPct: 91, revenue: 58_200, metrics: [
    { label: 'Patients seen', value: 386, format: 'number' },
    { label: 'Procedures', value: 248, format: 'number' },
    { label: 'EBOO clearances', value: 84, format: 'number' },
    { label: 'Follow-ups', value: 212, format: 'number' },
    { label: 'Unlocked charts', value: 9, format: 'number', lowerIsBetter: true },
  ] },
  { id: 'e3', name: 'Marie', role: 'New Patient Advisor', roleId: 'newPatient', utilizationPct: 92, revenue: 24_000, metrics: [
    { label: 'Calls', value: 1_180, format: 'number' },
    { label: 'Messages', value: 940, format: 'number' },
    { label: 'Texts', value: 1_460, format: 'number' },
    { label: 'Onboarded', value: 132, format: 'number' },
  ] },
  { id: 'e4', name: 'Yazmine', role: 'Front Desk', roleId: 'frontDesk', utilizationPct: 94, revenue: 24_100, metrics: [
    { label: 'Cash sales', value: 24_100, format: 'currency' },
    { label: 'Inbound calls', value: 1_180, format: 'number' },
    { label: 'Calls answered', value: 1_020, format: 'number' },
    { label: '% answered', value: 86, format: 'percent' },
    { label: 'Avg call duration', value: 4.1, format: 'minutes' },
    { label: 'Outbound calls', value: 520, format: 'number' },
  ] },
  { id: 'e5', name: 'Heily', role: 'Front Desk', roleId: 'frontDesk', utilizationPct: 86, revenue: 18_600, metrics: [
    { label: 'Cash sales', value: 18_600, format: 'currency' },
    { label: 'Inbound calls', value: 960, format: 'number' },
    { label: 'Calls answered', value: 820, format: 'number' },
    { label: '% answered', value: 85, format: 'percent' },
    { label: 'Avg call duration', value: 4.6, format: 'minutes' },
    { label: 'Outbound calls', value: 440, format: 'number' },
  ] },
  { id: 'e6', name: 'Charlene (Virtual)', role: 'Medical Assistant', roleId: 'ma', utilizationPct: 91, revenue: 14_200, metrics: [
    { label: 'Vitals taken', value: 1_240, format: 'number' },
    { label: 'Procedures', value: 780, format: 'number' },
    { label: 'Prescription refills', value: 340, format: 'number' },
    { label: 'Patient messages', value: 590, format: 'number' },
  ] },
  { id: 'e7', name: 'Bee', role: 'Medical Assistant', roleId: 'ma', utilizationPct: 88, revenue: 12_800, metrics: [
    { label: 'Vitals taken', value: 1_070, format: 'number' },
    { label: 'Procedures', value: 700, format: 'number' },
    { label: 'Prescription refills', value: 300, format: 'number' },
    { label: 'Patient messages', value: 530, format: 'number' },
  ] },
  { id: 'e8', name: 'Bea', role: 'Medic', roleId: 'medic', utilizationPct: 93, revenue: 30_400, metrics: [
    { label: 'Starts', value: 1_620, format: 'number' },
    { label: 'Misses', value: 74, format: 'number', lowerIsBetter: true },
    { label: 'Cost of misses', value: 237, format: 'currency', lowerIsBetter: true },
    { label: 'IVs administered', value: 1_540, format: 'number' },
    { label: 'IVs booked', value: 1_720, format: 'number' },
    { label: 'Unlocked notes', value: 21, format: 'number', lowerIsBetter: true },
  ] },
  { id: 'e9', name: 'Nic', role: 'Nurse', roleId: 'nurse', utilizationPct: 95, revenue: 41_600, metrics: [
    { label: 'EBOOs performed', value: 188, format: 'number' },
    { label: 'EBOO booked', value: 212, format: 'number' },
    { label: 'IVs administered', value: 620, format: 'number' },
  ] },
  { id: 'e10', name: 'Vignesh', role: 'Billing', roleId: 'billing', utilizationPct: 93, revenue: 52_300, metrics: [
    { label: 'Insurance collections', value: 52_300, format: 'currency' },
    { label: 'Claims submitted', value: 420, format: 'number' },
    { label: 'Avg days to submit', value: 1.6, format: 'days', lowerIsBetter: true },
    { label: 'Appeals sent', value: 18, format: 'number' },
  ] },
  { id: 'e11', name: 'Kamalesh', role: 'Billing', roleId: 'billing', utilizationPct: 88, revenue: 46_100, metrics: [
    { label: 'Insurance collections', value: 46_100, format: 'currency' },
    { label: 'Claims submitted', value: 362, format: 'number' },
    { label: 'Avg days to submit', value: 2.0, format: 'days', lowerIsBetter: true },
    { label: 'Appeals sent', value: 16, format: 'number' },
  ] },
  { id: 'e12', name: 'Karina', role: 'Operations Manager', roleId: 'ops', utilizationPct: 90, revenue: 0, metrics: [
    { label: 'Avg days of appts / provider', value: 6.2, format: 'days' },
    { label: 'Active pts w/o next appt', value: 214, format: 'number', lowerIsBetter: true },
    { label: 'Revenue per employee', value: 23_300, format: 'currency' },
    { label: 'Days to next new-pt visit', value: 4.6, format: 'days', lowerIsBetter: true },
  ] },
  { id: 'e13', name: 'Shibani', role: 'Admin', roleId: 'admin', utilizationPct: 90, revenue: 0, metrics: [
    { label: 'Schedule fill rate', value: 84, format: 'percent' },
    { label: 'Unit occupancy', value: 82, format: 'percent' },
    { label: 'No-shows', value: 96, format: 'number', lowerIsBetter: true },
    { label: 'Goals tracked', value: 7, format: 'number' },
  ] },
  { id: 'e14', name: 'Tom', role: 'Provider', roleId: 'provider', utilizationPct: 94, revenue: 71_200, metrics: [
    { label: 'New patient appts', value: 72, format: 'number' },
    { label: 'Established appts', value: 312, format: 'number' },
    { label: 'Procedures', value: 240, format: 'number' },
    { label: 'Unlocked charts', value: 11, format: 'number', lowerIsBetter: true },
  ] },
  { id: 'e15', name: 'Kyle', role: 'Technician', roleId: 'technician', utilizationPct: 89, revenue: 18_400, metrics: [
    { label: 'Diagnostics executed', value: 248, format: 'number' },
    { label: 'Laser sessions', value: 186, format: 'number' },
    { label: 'Eyedrop procedures', value: 142, format: 'number' },
    { label: 'BioCharger sessions', value: 96, format: 'number' },
    { label: 'Energetics sessions', value: 74, format: 'number' },
  ] },
]

// Approximate share of revenue by payment type (cash vs insurance).
function paymentShare(payment: PaymentType): number {
  if (payment === 'cash') return 0.57
  if (payment === 'insurance') return 0.43
  return 1
}

export function getEmployees(scale: number, payment: PaymentType = 'all'): Employee[] {
  const share = paymentShare(payment)
  return EMPLOYEE_SEEDS.map((e) => ({
    id: e.id,
    name: e.name,
    role: e.role,
    roleId: e.roleId,
    utilizationPct: e.utilizationPct,
    revenue: Math.round(e.revenue * scale * share),
    metrics: e.metrics.map((m) => ({
      label: m.label,
      // percentages/utilization don't scale; currency also reflects payment mix
      value:
        m.format === 'percent'
          ? m.value
          : Math.round(m.value * scale * (m.format === 'currency' ? share : 1)),
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
    const label = `${((hour24 + 11) % 12) + 1}${hour24 < 12 ? 'am' : 'pm'}`
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
    e1: { patients: 18, revenue: 4_800, target: 4_500 }, // Dr. Drannikov
    e2: { patients: 14, revenue: 2_900, target: 2_800 }, // Brock (PA)
    e14: { patients: 16, revenue: 3_600, target: 3_400 }, // Tom (Provider)
    e15: { patients: 11, revenue: 720, target: 800 }, // Kyle (Technician)
    e3: { patients: 9, revenue: 1_900, target: 2_000 }, // Marie
    e4: { patients: 24, revenue: 2_100, target: 2_400 }, // Yazmine
    e5: { patients: 19, revenue: 1_700, target: 2_000 }, // Heily
    e6: { patients: 12, revenue: 980, target: 900 }, // Charlene
    e7: { patients: 10, revenue: 820, target: 900 }, // Bee
    e8: { patients: 16, revenue: 1_450, target: 1_300 }, // Bea (Medic)
    e9: { patients: 7, revenue: 3_100, target: 2_800 }, // Nic (Nurse)
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
    { unit: 'Laser / PRP', capacity: 5, booked: 4 },
  ]
}

// Occupancy across the day (simple heatmap)
export function getHourlyOccupancy(): { hour: string; pct: number }[] {
  const hours = ['8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm']
  return hours.map((hour, i) => ({
    hour,
    pct: Math.round(45 + 50 * Math.abs(Math.sin((i + 1) / 2)) - seeded(i, 3) * 10),
  }))
}

// -----------------------------------------------------------------------------
// GOALS — targets that drive the alerts
// -----------------------------------------------------------------------------
export function getGoals(): Goal[] {
  return [
    { id: 'g1', label: 'POC penetration', area: 'PCC', value: 64, target: 70, format: 'percent' },
    { id: 'g2', label: 'Monthly revenue', area: 'Revenue', value: 326_800, target: 340_000, format: 'currency' },
    { id: 'g3', label: 'Medic misses', area: 'Medics', value: 96, target: 60, format: 'number', lowerIsBetter: true },
    { id: 'g4', label: 'Outbound calls', area: 'Front Desk', value: 960, target: 1_200, format: 'number' },
    { id: 'g5', label: 'Claim denial rate', area: 'Billing', value: 11, target: 8, format: 'percent', lowerIsBetter: true },
    { id: 'g6', label: 'Unit occupancy', area: 'Treatments', value: 82, target: 80, format: 'percent' },
    { id: 'g7', label: 'New patients', area: 'Growth', value: 96, target: 90, format: 'number' },
  ]
}

/** True when a goal is currently being missed. */
function goalBreached(g: Goal): boolean {
  return g.lowerIsBetter ? g.value > g.target : g.value < g.target
}

// -----------------------------------------------------------------------------
// ALERTS — derived from goals that are off-target
// -----------------------------------------------------------------------------
export function getAlerts(goals: Goal[] = getGoals()): Alert[] {
  const fmt = (v: number, f: Goal['format']) =>
    f === 'currency' ? `$${v.toLocaleString()}` : f === 'percent' ? `${v}%` : v.toLocaleString()

  const fromGoals: Alert[] = goals
    .filter(goalBreached)
    .map((g) => {
      const gap = Math.abs(g.value - g.target)
      const severity: Alert['severity'] =
        gap / Math.max(1, g.target) >= 0.25 ? 'critical' : 'warning'
      return {
        id: g.id,
        severity,
        area: g.area,
        message: `${g.label}: ${fmt(g.value, g.format)} vs target ${fmt(g.target, g.format)}.`,
      }
    })

  return [
    ...fromGoals,
    {
      id: 'info-eboo',
      severity: 'info',
      area: 'Growth',
      message: 'EBOO needs its own landing page — 212 booked, high demand.',
    },
  ]
}

// -----------------------------------------------------------------------------
// INSURANCE / BILLING
// -----------------------------------------------------------------------------
export function getInsuranceKpis(scale: number = 1): Kpi[] {
  const r = (n: number) => Math.round(n * scale)
  return [
    { id: 'billed-yesterday', label: 'Billed yesterday', value: 84_200, format: 'currency', deltaPct: 6.0, trend: 'up', hint: 'Claims submitted yesterday' },
    { id: 'claims-yesterday', label: 'Claims sent yesterday', value: 47, format: 'number', deltaPct: 4.0, trend: 'up', hint: 'Number of claims submitted' },
    { id: 'days-to-submit', label: 'Avg days to submit', value: 1.8, format: 'days', deltaPct: -8.0, trend: 'down', lowerIsBetter: true, hint: 'Encounter → claim sent' },
    { id: 'days-to-pay', label: 'Avg days to pay', value: 38, format: 'days', deltaPct: -3.0, trend: 'down', lowerIsBetter: true, hint: 'Weighted across payers' },
    { id: 'denial-rate', label: 'Total denial rate', value: 11, format: 'percent', deltaPct: 1.5, trend: 'up', lowerIsBetter: true, hint: '86 claims denied (11%)' },
    { id: 'unlocked-claims', label: 'Unlocked claims (today)', value: 12, format: 'number', deltaPct: -14.0, trend: 'down', lowerIsBetter: true, hint: 'Claims not sent - waiting on unlocked charts/notes' },
    { id: 'appeals-sent', label: 'Appeals sent in period', value: r(34), format: 'number', deltaPct: 6.0, trend: 'up', hint: '41 claims appealed' },
    { id: 'claims-paid', label: 'Claims paid', value: r(612), format: 'number', deltaPct: 5.0, trend: 'up', hint: 'Paid in full this period' },
    { id: 'outstanding-ar', label: 'Outstanding A/R', value: 412_900, format: 'currency', deltaPct: 2.0, trend: 'up', lowerIsBetter: true, hint: 'Owed by insurers (billed)' },
  ]
}

export function getClaimsByPayer(): PayerClaims[] {
  return [
    { payer: 'BlueShield', claims: 182, billed: 248_000, allowable: 152_000, paid: 121_000, outstanding: 127_000, avgDaysToPay: 182, denialRate: 9 },
    { payer: 'Aetna', claims: 134, billed: 176_500, allowable: 110_300, paid: 92_400, outstanding: 84_100, avgDaysToPay: 46, denialRate: 12 },
    { payer: 'Cigna', claims: 98, billed: 132_400, allowable: 82_900, paid: 70_100, outstanding: 62_300, avgDaysToPay: 39, denialRate: 8 },
    { payer: 'UnitedHealthcare', claims: 121, billed: 158_900, allowable: 96_200, paid: 74_800, outstanding: 84_100, avgDaysToPay: 52, denialRate: 14 },
    { payer: 'Medicare', claims: 156, billed: 121_300, allowable: 88_700, paid: 81_900, outstanding: 39_400, avgDaysToPay: 28, denialRate: 6 },
    { payer: 'Humana', claims: 64, billed: 71_200, allowable: 44_100, paid: 35_200, outstanding: 36_000, avgDaysToPay: 41, denialRate: 10 },
  ]
}

export function getDenials(): DenialCategory[] {
  return [
    { category: 'Office visits', denials: 18 },
    { category: 'IVs', denials: 41 },
    { category: 'Diagnostics', denials: 27 },
    { category: 'Procedures', denials: 33 },
    { category: 'Labs', denials: 15 },
  ]
}

/** A/R aging by payer: outstanding money + open claims per age bucket. */
export function getAgingByPayer(): AgingRow[] {
  return [
    { payer: 'BlueShield', claims: 96, b0_30: 22_000, b31_60: 28_000, b61_90: 31_000, b90plus: 46_000 },
    { payer: 'Aetna', claims: 61, b0_30: 26_000, b31_60: 22_400, b61_90: 18_700, b90plus: 17_000 },
    { payer: 'Cigna', claims: 44, b0_30: 21_300, b31_60: 17_000, b61_90: 13_000, b90plus: 11_000 },
    { payer: 'UnitedHealthcare', claims: 58, b0_30: 24_100, b31_60: 21_000, b61_90: 19_000, b90plus: 20_000 },
    { payer: 'Medicare', claims: 37, b0_30: 18_400, b31_60: 11_000, b61_90: 6_000, b90plus: 4_000 },
    { payer: 'Humana', claims: 29, b0_30: 12_000, b31_60: 9_400, b61_90: 8_600, b90plus: 6_000 },
  ]
}

/** Billed vs collected by month (for month-over-month billing comparison). */
export function getBillingTrend(): { label: string; billed: number; collected: number }[] {
  return [
    { label: 'Jan', billed: 232_000, collected: 168_000 },
    { label: 'Feb', billed: 244_500, collected: 176_400 },
    { label: 'Mar', billed: 261_900, collected: 188_900 },
    { label: 'Apr', billed: 256_200, collected: 184_700 },
    { label: 'May', billed: 278_700, collected: 199_300 },
    { label: 'Jun', billed: 291_800, collected: 206_400 },
  ]
}

// -----------------------------------------------------------------------------
// MARKETING
// -----------------------------------------------------------------------------
export type MarketingChannelKey = 'all' | 'web' | 'instagram' | 'facebook' | 'x' | 'tiktok' | 'youtube' | 'email'

export const MARKETING_CHANNEL_LABELS: Record<MarketingChannelKey, string> = {
  all: 'All channels',
  web: 'Web',
  instagram: 'Instagram',
  facebook: 'Facebook',
  x: 'X',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  email: 'Email',
}

export function getMarketingKpis(channel: MarketingChannelKey = 'all'): Kpi[] {
  switch (channel) {
    case 'instagram':
      return [
        { id: 'ig-followers', label: 'Followers', value: 24_800, format: 'number', deltaPct: 4.1, trend: 'up', hint: 'Instagram audience' },
        { id: 'ig-new', label: 'New followers', value: 980, format: 'number', deltaPct: 14.0, trend: 'up', hint: 'This period' },
        { id: 'ig-eng', label: 'Engagement rate', value: 4.6, format: 'percent', deltaPct: 0.4, trend: 'up', hint: 'Likes + comments / reach' },
        { id: 'ig-impr', label: 'Impressions', value: 142_000, format: 'number', deltaPct: 9.0, trend: 'up', hint: 'Total reach' },
        { id: 'ig-posts', label: 'Posts', value: 38, format: 'number', deltaPct: 5.0, trend: 'up', hint: 'Published this period' },
        { id: 'ig-leads', label: 'Leads', value: 96, format: 'number', deltaPct: 11.0, trend: 'up', hint: 'Attributed to Instagram' },
      ]
    case 'facebook':
      return [
        { id: 'fb-followers', label: 'Followers', value: 14_200, format: 'number', deltaPct: 2.0, trend: 'up', hint: 'Facebook audience' },
        { id: 'fb-new', label: 'New followers', value: 410, format: 'number', deltaPct: 6.0, trend: 'up', hint: 'This period' },
        { id: 'fb-eng', label: 'Engagement rate', value: 2.1, format: 'percent', deltaPct: -0.2, trend: 'down', hint: 'Reactions + comments / reach' },
        { id: 'fb-impr', label: 'Impressions', value: 88_000, format: 'number', deltaPct: 4.0, trend: 'up', hint: 'Total reach' },
        { id: 'fb-posts', label: 'Posts', value: 24, format: 'number', deltaPct: 0, trend: 'flat', hint: 'Published this period' },
        { id: 'fb-leads', label: 'Leads', value: 64, format: 'number', deltaPct: 7.0, trend: 'up', hint: 'Attributed to Facebook' },
      ]
    case 'web':
      return [
        { id: 'web-sessions', label: 'Sessions', value: 21_400, format: 'number', deltaPct: 8.0, trend: 'up', hint: 'Google Analytics' },
        { id: 'web-users', label: 'Users', value: 16_800, format: 'number', deltaPct: 7.0, trend: 'up', hint: 'Unique visitors' },
        { id: 'web-bounce', label: 'Bounce rate', value: 42, format: 'percent', deltaPct: -2.0, trend: 'down', lowerIsBetter: true, hint: 'Single-page sessions' },
        { id: 'web-dur', label: 'Avg session', value: 2.4, format: 'minutes', deltaPct: 3.0, trend: 'up', hint: 'Time on site' },
        { id: 'web-conv', label: 'Conversions', value: 312, format: 'number', deltaPct: 10.0, trend: 'up', hint: 'Form / booking submits' },
        { id: 'web-leads', label: 'Leads', value: 78, format: 'number', deltaPct: 6.0, trend: 'up', hint: 'Attributed to web' },
      ]
    case 'email':
      return [
        { id: 'em-sent', label: 'Emails sent', value: 18_900, format: 'number', deltaPct: 5.0, trend: 'up', hint: 'Mailchimp campaigns' },
        { id: 'em-open', label: 'Open rate', value: 38, format: 'percent', deltaPct: 2.0, trend: 'up', hint: 'Avg across campaigns' },
        { id: 'em-click', label: 'Click rate', value: 6.2, format: 'percent', deltaPct: 0.6, trend: 'up', hint: 'Avg across campaigns' },
        { id: 'em-leads', label: 'Leads', value: 215, format: 'number', deltaPct: 8.0, trend: 'up', hint: 'Attributed to email' },
      ]
    case 'x':
      return [
        { id: 'x-followers', label: 'Followers', value: 8_900, format: 'number', deltaPct: 3.0, trend: 'up', hint: 'X (Twitter) audience' },
        { id: 'x-new', label: 'New followers', value: 240, format: 'number', deltaPct: 9.0, trend: 'up', hint: 'This period' },
        { id: 'x-eng', label: 'Engagement rate', value: 1.8, format: 'percent', deltaPct: 0.1, trend: 'up', hint: 'Likes + reposts / impressions' },
        { id: 'x-impr', label: 'Impressions', value: 64_000, format: 'number', deltaPct: 5.0, trend: 'up', hint: 'Total reach' },
        { id: 'x-posts', label: 'Posts', value: 42, format: 'number', deltaPct: 4.0, trend: 'up', hint: 'Published this period' },
        { id: 'x-leads', label: 'Leads', value: 28, format: 'number', deltaPct: 6.0, trend: 'up', hint: 'Attributed to X' },
      ]
    case 'tiktok':
      return [
        { id: 'tt-followers', label: 'Followers', value: 18_600, format: 'number', deltaPct: 11.0, trend: 'up', hint: 'TikTok audience' },
        { id: 'tt-new', label: 'New followers', value: 1_420, format: 'number', deltaPct: 22.0, trend: 'up', hint: 'This period' },
        { id: 'tt-eng', label: 'Engagement rate', value: 6.4, format: 'percent', deltaPct: 0.8, trend: 'up', hint: 'Likes + comments / views' },
        { id: 'tt-views', label: 'Video views', value: 312_000, format: 'number', deltaPct: 18.0, trend: 'up', hint: 'Total views' },
        { id: 'tt-posts', label: 'Posts', value: 28, format: 'number', deltaPct: 7.0, trend: 'up', hint: 'Published this period' },
        { id: 'tt-leads', label: 'Leads', value: 64, format: 'number', deltaPct: 14.0, trend: 'up', hint: 'Attributed to TikTok' },
      ]
    case 'youtube':
      return [
        { id: 'yt-subs', label: 'Subscribers', value: 6_300, format: 'number', deltaPct: 5.0, trend: 'up', hint: 'YouTube subscribers' },
        { id: 'yt-new', label: 'New subscribers', value: 310, format: 'number', deltaPct: 8.0, trend: 'up', hint: 'This period' },
        { id: 'yt-views', label: 'Video views', value: 142_000, format: 'number', deltaPct: 9.0, trend: 'up', hint: 'Total views' },
        { id: 'yt-watch', label: 'Watch time (hrs)', value: 4_800, format: 'number', deltaPct: 6.0, trend: 'up', hint: 'Total watch hours' },
        { id: 'yt-videos', label: 'Videos', value: 12, format: 'number', deltaPct: 0, trend: 'flat', hint: 'Published this period' },
        { id: 'yt-leads', label: 'Leads', value: 36, format: 'number', deltaPct: 7.0, trend: 'up', hint: 'Attributed to YouTube' },
      ]
    default:
      return [
        { id: 'followers', label: 'Total followers', value: 48_200, format: 'number', deltaPct: 3.4, trend: 'up', hint: 'Across all social channels' },
        { id: 'new-followers', label: 'New followers', value: 1_640, format: 'number', deltaPct: 12.0, trend: 'up', hint: 'This period' },
        { id: 'web-sessions', label: 'Website sessions', value: 21_400, format: 'number', deltaPct: 8.0, trend: 'up', hint: 'Google Analytics' },
        { id: 'emails-sent', label: 'Emails sent', value: 18_900, format: 'number', deltaPct: 5.0, trend: 'up', hint: 'Mailchimp campaigns' },
        { id: 'open-rate', label: 'Email open rate', value: 38, format: 'percent', deltaPct: 2.0, trend: 'up', hint: 'Avg across campaigns' },
        { id: 'mktg-leads', label: 'Leads from marketing', value: 286, format: 'number', deltaPct: 9.0, trend: 'up', hint: 'Attributed to campaigns' },
        { id: 'g-reviews', label: 'Google reviews', value: 312, format: 'number', deltaPct: 4.0, trend: 'up', hint: 'Avg rating 4.8 stars on Google Business' },
      ]
  }
}

/** Monthly trend of the channel's primary metric. */
export function getChannelTrend(channel: MarketingChannelKey = 'all'): {
  metric: string
  points: { label: string; value: number }[]
} {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const series: Record<MarketingChannelKey, { metric: string; values: number[] }> = {
    all: { metric: 'Leads', values: [210, 228, 241, 256, 272, 286] },
    instagram: { metric: 'Followers', values: [21_800, 22_500, 23_100, 23_700, 24_200, 24_800] },
    facebook: { metric: 'Followers', values: [13_200, 13_500, 13_700, 13_900, 14_050, 14_200] },
    web: { metric: 'Sessions', values: [16_800, 17_500, 18_200, 19_100, 20_200, 21_400] },
    email: { metric: 'Emails sent', values: [12_400, 13_800, 15_200, 16_100, 17_800, 18_900] },
    x: { metric: 'Followers', values: [8_100, 8_300, 8_450, 8_600, 8_750, 8_900] },
    tiktok: { metric: 'Followers', values: [13_200, 14_400, 15_600, 16_800, 17_700, 18_600] },
    youtube: { metric: 'Subscribers', values: [5_400, 5_600, 5_800, 6_000, 6_150, 6_300] },
  }
  const s = series[channel]
  return { metric: s.metric, points: months.map((label, i) => ({ label, value: s.values[i] })) }
}

export function getMarketingChannels(): MarketingChannel[] {
  return [
    { channel: 'Instagram', followers: 24_800, leads: 96 },
    { channel: 'Facebook', followers: 14_200, leads: 64 },
    { channel: 'Google / SEO', followers: 0, leads: 78 },
    { channel: 'TikTok', followers: 18_600, leads: 64 },
    { channel: 'X', followers: 8_900, leads: 28 },
    { channel: 'YouTube', followers: 6_300, leads: 36 },
    { channel: 'Email', followers: 9_200, leads: 38 },
    { channel: 'Referral', followers: 0, leads: 10 },
  ]
}

/** Top and lower performing social posts (by engagement). */
export function getSocialPosts(): { title: string; channel: string; engagement: number; reach: number }[] {
  return [
    { title: 'EBOO before/after reel', channel: 'TikTok', engagement: 9.8, reach: 142_000 },
    { title: 'IV drip menu walkthrough', channel: 'Instagram', engagement: 7.2, reach: 38_400 },
    { title: 'Patient testimonial: chronic fatigue', channel: 'YouTube', engagement: 6.1, reach: 21_000 },
    { title: 'Dr. Drannikov Q&A clip', channel: 'Instagram', engagement: 5.4, reach: 26_700 },
    { title: 'PRP explained in 30s', channel: 'TikTok', engagement: 4.9, reach: 54_000 },
    { title: 'Clinic tour photo dump', channel: 'Facebook', engagement: 2.1, reach: 12_300 },
    { title: 'Hours update post', channel: 'X', engagement: 1.2, reach: 6_400 },
    { title: 'Holiday closure notice', channel: 'Facebook', engagement: 0.8, reach: 8_900 },
  ]
}

/** Patients gone inactive (no visit recently) - staff call list. */
export function getInactivePatients(): { name: string; lastVisit: string; modality: string; phone: string }[] {
  return [
    { name: 'Daniel Cooper', lastVisit: '2026-02-18', modality: 'IV Therapy', phone: '(305) 555-0210' },
    { name: 'Rachel Kim', lastVisit: '2026-02-11', modality: 'EBOO', phone: '(305) 555-0221' },
    { name: 'Victor Alvarez', lastVisit: '2026-01-29', modality: 'Neuromuscular Therapy', phone: '(305) 555-0234' },
    { name: 'Megan Lewis', lastVisit: '2026-01-22', modality: 'BEMER Therapy', phone: '(305) 555-0245' },
    { name: 'Brandon Hughes', lastVisit: '2026-01-15', modality: 'IV Therapy', phone: '(305) 555-0256' },
    { name: 'Priya Nair', lastVisit: '2026-01-08', modality: 'Erchonia Laser Therapy', phone: '(305) 555-0267' },
    { name: 'Carlos Mendoza', lastVisit: '2025-12-19', modality: 'PRP', phone: '(305) 555-0278' },
    { name: 'Stephanie Young', lastVisit: '2025-12-12', modality: 'IV Therapy', phone: '(305) 555-0289' },
  ]
}

export function getEmailCampaigns(): EmailCampaign[] {
  return [
    { name: 'EBOO awareness', sent: 6_200, openRate: 42, clickRate: 7.1, leads: 88 },
    { name: 'June IV specials', sent: 5_400, openRate: 39, clickRate: 5.8, leads: 54 },
    { name: 'HRT re-engagement', sent: 3_900, openRate: 34, clickRate: 4.2, leads: 31 },
    { name: 'New patient welcome', sent: 3_400, openRate: 51, clickRate: 9.4, leads: 42 },
  ]
}

// -----------------------------------------------------------------------------
// TREATMENTS (occupancy or revenue by modality)
// -----------------------------------------------------------------------------
export function getTreatments(scale: number = 1, payment: PaymentType = 'all'): Treatment[] {
  const share = paymentShare(payment)
  return SERVICE_CATALOG.map((t) => ({
    name: t.name,
    treatments: Math.round(t.treatments * scale),
    occupancyPct: t.occupancyPct,
    revenue: Math.round(t.revenue * scale * share),
    capacity: t.capacity,
    booked: t.booked,
  }))
}

const TREND_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

/** 6-month trend for one treatment (for the click-through trend view). */
export function getTreatmentTrend(name: string) {
  const t = SERVICE_CATALOG.find((x) => x.name === name)
  if (!t) return []
  return TREND_MONTHS.map((label, i) => ({
    label,
    revenue: Math.round(t.revenue * (0.74 + i * 0.052) * (1 + (seeded(i, name.length) - 0.5) * 0.06)),
    treatments: Math.round(t.treatments * (0.74 + i * 0.052)),
    occupancyPct: Math.min(100, Math.round(t.occupancyPct * (0.85 + i * 0.03))),
  }))
}

/** 6-month revenue trend per employee (to spot low performance over time). */
export function getEmployeeTrend(id: string) {
  const e = EMPLOYEE_SEEDS.find((x) => x.id === id)
  if (!e) return []
  const base = Math.max(1_500, e.revenue)
  return TREND_MONTHS.map((label, i) => ({
    label,
    revenue: Math.round(base * (0.72 + i * 0.056) * (1 + (seeded(i, id.length + e.name.length) - 0.5) * 0.12)),
  }))
}

/** Generic 6-month trend for any metric, so any KPI block can be clicked. */
export function getMetricTrend(seedKey: string, current: number) {
  return TREND_MONTHS.map((label, i) => ({
    label,
    value: Math.round(current * (0.72 + i * 0.056) * (1 + (seeded(i, seedKey.length) - 0.5) * 0.08)),
  }))
}

// -----------------------------------------------------------------------------
// AI INSIGHTS — placeholder until wired to an LLM over the live data
// -----------------------------------------------------------------------------
export type AiTone = 'positive' | 'watch' | 'risk'

export function getAiExecutiveSummary(): string {
  return (
    'Helixona had a strong month: total revenue grew 8.4% MoM to $326.8k, led by EBOO (+12%) and steady IV Therapy volume. ' +
    'Cash collection remains healthy (96%), but insurance is the drag — only 58% of billed insurance revenue has landed in the bank, ' +
    'with $412.9k outstanding and BlueShield alone holding $127k at a 182-day payment cycle. Patient acquisition is solid ' +
    '(96 new patients, +12.5%), though onboarding-to-first-appointment conversion slipped 4% and 8 patients have gone inactive. ' +
    'On the floor, EBOO is capacity-constrained at 92% occupancy while medic misses run 60% over target. ' +
    'Marketing momentum is shifting to TikTok (+22% followers), which now drives the most leads per post.'
  )
}

export interface AiSection {
  page: string
  area: string
  summary: string
  insights: { tone: AiTone; text: string }[]
}

export function getAiSections(): AiSection[] {
  return [
    {
      page: 'revenue',
      area: 'Revenue',
      summary: 'Growth is healthy but collection lags billing.',
      insights: [
        { tone: 'positive', text: 'Revenue up 8.4% MoM to $326.8k; 6th consecutive month of growth.' },
        { tone: 'watch', text: 'Collection rate is 79% — $68k of June billing is not yet in the bank.' },
        { tone: 'positive', text: 'EBOO is the top earner ($121k) with the best revenue-per-patient ratio.' },
      ],
    },
    {
      page: 'billing',
      area: 'Insurance & Billing',
      summary: 'A/R aging and BlueShield are the biggest risks.',
      insights: [
        { tone: 'risk', text: 'BlueShield: $46k aged over 90 days across 96 claims — largest exposure, 182-day pay cycle.' },
        { tone: 'watch', text: 'Denial rate at 11% vs 8% goal; IVs and procedures drive most denials.' },
        { tone: 'positive', text: 'Claims go out in 1.8 days on average — submission speed is not the bottleneck.' },
        { tone: 'watch', text: '12 unlocked claims today are blocking submissions; chase unlocked charts/notes.' },
      ],
    },
    {
      page: 'patients',
      area: 'Patients',
      summary: 'Acquisition is strong; retention needs attention.',
      insights: [
        { tone: 'positive', text: 'New patients +12.5% (96); leads up across all channels.' },
        { tone: 'watch', text: 'Onboarding → 1st appointment conversion slipped 4% vs last month.' },
        { tone: 'risk', text: '8 patients have gone inactive (90+ days) — call list is ready in Patients.' },
        { tone: 'watch', text: '44 leads denied/declined this period; cost and insurance fit are the top reasons.' },
      ],
    },
    {
      page: 'marketing',
      area: 'Marketing',
      summary: 'TikTok is the growth engine; Facebook underperforms.',
      insights: [
        { tone: 'positive', text: 'TikTok followers +22%; EBOO reels are the top-performing content (9.8% engagement).' },
        { tone: 'positive', text: 'Google reviews at 4.8 stars (312 reviews), up 4% this period.' },
        { tone: 'watch', text: 'Facebook engagement (2.1%) is a third of TikTok — consider repurposing reels.' },
      ],
    },
    {
      page: 'team',
      area: 'Team & Roles',
      summary: 'Strong utilization; misses and unlocked charts need follow-up.',
      insights: [
        { tone: 'risk', text: 'Medic misses (96) are 60% over target — estimated $307 cost, trending up 3 weeks.' },
        { tone: 'watch', text: '24 unlocked charts across providers are delaying claim submissions.' },
        { tone: 'positive', text: 'Front desk answers 86% of inbound calls; 300 missed calls and 180 voicemails to recover.' },
      ],
    },
    {
      page: 'treatments',
      area: 'Treatments',
      summary: 'EBOO is capacity-constrained; low utilizers drag occupancy.',
      insights: [
        { tone: 'watch', text: 'EBOO at 92% occupancy (7/8 spots daily) — demand exceeds capacity; consider expanding.' },
        { tone: 'positive', text: 'IV Therapy holds 84% occupancy with the highest treatment volume (1,540).' },
        { tone: 'watch', text: 'SCENAR, Biomodulator and MEAD run below 50% occupancy — bundle or promote.' },
      ],
    },
  ]
}

export function getAiRecommendations(): { priority: 'high' | 'medium'; text: string }[] {
  return [
    { priority: 'high', text: 'Work the BlueShield 90+ day A/R bucket ($46k) and appeal denied IV claims first.' },
    { priority: 'high', text: 'Lock charts daily: 24 unlocked charts + 12 unlocked claims are delaying revenue.' },
    { priority: 'high', text: 'Call the 8 inactive patients this week — the list with phone numbers is in Patients.' },
    { priority: 'medium', text: 'Add EBOO capacity (or extend hours): it is the top earner and is turning patients away.' },
    { priority: 'medium', text: 'Shift ad budget toward TikTok and repurpose EBOO reels to Facebook to lift its 2.1% engagement.' },
    { priority: 'medium', text: 'Coach medics on misses (96 vs 60 target); review the 4% drop in onboarding conversion with Marie.' },
  ]
}

/** 6-month trend for any marketing KPI (clickable blocks). */
export function getMarketingMetricTrend(metricId: string, current: number) {
  return TREND_MONTHS.map((label, i) => ({
    label,
    value: Math.round(current * (0.72 + i * 0.056) * (1 + (seeded(i, metricId.length) - 0.5) * 0.08)),
  }))
}

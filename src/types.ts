// Core types for the operational dashboard.
// All data comes from src/data/mockData.ts (placeholder) and is easy to
// swap for real integrations later (ECW / 8x8 / billing).

export type Timeframe = 'today' | 'week' | 'month' | 'quarter' | 'ytd'
export type PaymentType = 'all' | 'cash' | 'insurance'

export type Trend = 'up' | 'down' | 'flat'

/** A selected reporting period: either a quick preset or an exact date range. */
export interface DateRange {
  /** ISO date yyyy-mm-dd */
  from: string
  /** ISO date yyyy-mm-dd */
  to: string
}

export type Period =
  | { kind: 'preset'; preset: Timeframe }
  | { kind: 'custom'; range: DateRange }

export interface Kpi {
  id: string
  label: string
  value: number
  /** presentation format for the value */
  format: 'number' | 'currency' | 'percent' | 'minutes' | 'days'
  /** change vs previous period, in % */
  deltaPct: number
  trend: Trend
  /** true when "lower" is good (e.g. misses, wait time) */
  lowerIsBetter?: boolean
  hint?: string
}

export interface TimePoint {
  label: string
  cash: number
  insurance: number
}

export interface FunnelStage {
  stage: string
  count: number
}

export type RoleId =
  | 'provider'
  | 'pa'
  | 'newPatient'
  | 'frontDesk'
  | 'ma'
  | 'medic'
  | 'nurse'
  | 'billing'
  | 'ops'
  | 'admin'
  | 'exec'

export interface RoleMetric {
  label: string
  value: number
  format: Kpi['format']
  target?: number
  lowerIsBetter?: boolean
}

export interface EmployeePerformance {
  name: string
  metric: number
  format: Kpi['format']
}

export interface Role {
  id: RoleId
  name: string
  /** short description of the responsibility */
  summary: string
  /** expected data source (per notes) */
  source: string
  headcount: number
  metrics: RoleMetric[]
  /** ranking of employees by the role's primary metric */
  leaderboard: EmployeePerformance[]
}

/** A single employee with their attributed revenue and personal metrics. */
export interface Employee {
  id: string
  name: string
  role: string
  roleId: RoleId
  /** % of scheduled capacity actually worked/booked */
  utilizationPct: number
  /** revenue attributed to this employee in the period */
  revenue: number
  metrics: RoleMetric[]
}

/** One employee's live performance for the current day. */
export interface TodayEmployee {
  id: string
  name: string
  role: string
  onShift: boolean
  /** patients seen so far today */
  patients: number
  /** revenue generated so far today */
  revenue: number
  /** daily revenue target */
  target: number
  /** actual vs target, as a percentage */
  perfPct: number
  status: 'ahead' | 'on-track' | 'behind' | 'off'
}

/** A single patient's position in the lifecycle, for the detail view. */
export type PatientStatus = 'on-track' | 'active' | 'waitlist' | 'declined'

export interface PatientRecord {
  id: string
  name: string
  /** furthest stage reached, index into PATIENT_STAGES */
  stageIndex: number
  status: PatientStatus
  modality: string
  /** assigned coordinator / owner */
  coordinator: string
  /** where the lead came from */
  source: string
  /** ISO date the lead entered the pipeline */
  createdAt: string
  /** ISO date of the next scheduled appointment, if any */
  nextAppt?: string
  /** revenue to date */
  revenue: number
  phone: string
  email: string
  /** date reached for each stage (aligned to PATIENT_STAGES; undefined = not reached) */
  stageDates: (string | undefined)[]
  /** reason the patient was declined (only when status === 'declined') */
  declineReason?: string
}

/** A measurable goal that drives the alerts. */
export interface Goal {
  id: string
  label: string
  area: string
  value: number
  target: number
  format: 'number' | 'currency' | 'percent'
  lowerIsBetter?: boolean
}

/** Insurance billing — one payer's claim aggregates. */
export interface PayerClaims {
  payer: string
  claims: number
  billed: number
  allowable: number
  paid: number
  outstanding: number
  /** average days the payer takes to pay */
  avgDaysToPay: number
  denialRate: number
}

export interface DenialCategory {
  category: string
  denials: number
}

/** A/R aging for one payer: outstanding money and open claims by age bucket. */
export interface AgingRow {
  payer: string
  claims: number
  b0_30: number
  b31_60: number
  b61_90: number
  b90plus: number
}

/** Marketing — one acquisition channel. */
export interface MarketingChannel {
  channel: string
  followers: number
  leads: number
}

export interface EmailCampaign {
  name: string
  sent: number
  openRate: number
  clickRate: number
  leads: number
}

/** A treatment/modality with both occupancy and revenue, for the Treatments view. */
export interface Treatment {
  name: string
  treatments: number
  occupancyPct: number
  revenue: number
  /** today's bookable spots for this treatment */
  capacity: number
  booked: number
}

export interface ModalityBreakdown {
  modality: string
  patients: number
  revenue: number
}

export interface OccupancyUnit {
  unit: string
  capacity: number
  booked: number
}

export interface Alert {
  id: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  area: string
}

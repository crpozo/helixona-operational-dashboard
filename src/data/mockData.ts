// =============================================================================
// DATA PLACEHOLDER — Helixona Operational Dashboard
// -----------------------------------------------------------------------------
// Todo aqui es data sintetica/demo. La estructura imita lo que vendria de:
//   - ECW (eClinicalWorks)  -> pacientes, citas, procedimientos, vitals
//   - 8x8                   -> llamadas (answered / outbound)
//   - Billing               -> cobranza insurance vs cash
// Para conectar data real, reemplaza getDashboardData() por llamadas a tu API
// manteniendo las mismas firmas de tipos (ver src/types.ts).
// =============================================================================

import type {
  Alert,
  FunnelStage,
  Kpi,
  ModalityBreakdown,
  OccupancyUnit,
  PaymentType,
  Role,
  Timeframe,
  TimePoint,
} from '../types'

export const CLINIC_NAME = 'Helixona Wellness'

// Factores de escala para simular distintas ventanas de tiempo.
const TIMEFRAME_SCALE: Record<Timeframe, number> = {
  week: 0.25,
  month: 1,
  quarter: 3,
  ytd: 5.4,
}

export const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  week: 'Esta semana',
  month: 'Este mes',
  quarter: 'Trimestre',
  ytd: 'Año (YTD)',
}

export const PAYMENT_LABELS: Record<PaymentType, string> = {
  all: 'Cash + Insurance',
  cash: 'Solo Cash',
  insurance: 'Solo Insurance',
}

// Pequeño hash determinista para que los "delta" se vean estables por filtro.
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
export function getExecutiveKpis(tf: Timeframe, payment: PaymentType): Kpi[] {
  const s = TIMEFRAME_SCALE[tf]
  const pm = paymentMultiplier(payment)
  const cashRev = 184_500 * s * pm.cash
  const insRev = 142_300 * s * pm.insurance
  const totalRev = cashRev + insRev
  const headcount = 24
  const activePatients = Math.round(1_280)

  return [
    {
      id: 'revenue',
      label: 'Revenue total',
      value: Math.round(totalRev),
      format: 'currency',
      deltaPct: 8.4,
      trend: 'up',
      hint: 'Cash + Insurance cobrado en el periodo',
    },
    {
      id: 'rev-per-employee',
      label: 'Revenue / Empleado',
      value: Math.round(totalRev / headcount),
      format: 'currency',
      deltaPct: 5.1,
      trend: 'up',
      hint: 'Productividad por persona del equipo',
    },
    {
      id: 'active-patients',
      label: 'Pacientes activos',
      value: activePatients,
      format: 'number',
      deltaPct: 3.2,
      trend: 'up',
      hint: 'Pacientes con cita en los últimos 90 días',
    },
    {
      id: 'rev-per-patient',
      label: 'Revenue / Paciente (mes)',
      value: Math.round((184_500 + 142_300) / activePatients),
      format: 'currency',
      deltaPct: 2.7,
      trend: 'up',
      hint: 'Ticket promedio mensual por paciente',
    },
    {
      id: 'new-patients',
      label: 'Pacientes nuevos',
      value: Math.round(96 * s),
      format: 'number',
      deltaPct: 12.5,
      trend: 'up',
      hint: 'Altas nuevas en el periodo',
    },
    {
      id: 'avg-wait',
      label: 'Espera próx. cita',
      value: 4.6,
      format: 'minutes',
      deltaPct: -6.0,
      trend: 'down',
      lowerIsBetter: true,
      hint: 'Días promedio de espera para la siguiente cita',
    },
    {
      id: 'occupancy',
      label: 'Ocupación de unidades',
      value: 82,
      format: 'percent',
      deltaPct: 4.0,
      trend: 'up',
      hint: 'Sillas/camas ocupadas vs capacidad del día',
    },
    {
      id: 'ivs',
      label: 'IVs administrados',
      value: Math.round(1_540 * s),
      format: 'number',
      deltaPct: 6.8,
      trend: 'up',
      hint: 'Total de infusiones IV en el periodo',
    },
  ]
}

// Revenue mes a mes (cash vs insurance)
export function getRevenueTrend(payment: PaymentType): TimePoint[] {
  const base: TimePoint[] = [
    { label: 'Ene', cash: 142_000, insurance: 118_000 },
    { label: 'Feb', cash: 151_000, insurance: 121_500 },
    { label: 'Mar', cash: 163_400, insurance: 128_900 },
    { label: 'Abr', cash: 158_900, insurance: 133_200 },
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

// Embudo: lead -> onboarding -> paciente -> primera cita
export function getPatientFunnel(tf: Timeframe): FunnelStage[] {
  const s = TIMEFRAME_SCALE[tf]
  return [
    { stage: 'Leads', count: Math.round(420 * s) },
    { stage: 'Contactados', count: Math.round(318 * s) },
    { stage: 'Onboarding', count: Math.round(204 * s) },
    { stage: 'Pacientes', count: Math.round(132 * s) },
    { stage: '1ª cita agendada', count: Math.round(96 * s) },
  ]
}

export function getModalityBreakdown(tf: Timeframe, payment: PaymentType): ModalityBreakdown[] {
  const s = TIMEFRAME_SCALE[tf]
  const pm = (payment === 'all' ? 1 : 0.55)
  const base: ModalityBreakdown[] = [
    { modality: 'IV Therapy', patients: 540, revenue: 96_400 },
    { modality: 'EBOO', patients: 188, revenue: 121_300 },
    { modality: 'Hormone / HRT', patients: 224, revenue: 54_200 },
    { modality: 'Peptides', patients: 142, revenue: 31_800 },
    { modality: 'Aesthetics', patients: 186, revenue: 23_100 },
  ]
  return base.map((m) => ({
    modality: m.modality,
    patients: Math.round(m.patients * s),
    revenue: Math.round(m.revenue * s * pm),
  }))
}

// -----------------------------------------------------------------------------
// ROLES / KPIs por rol (segun notas: Front Desk, MA, PCC, Nurse, Medics, New Patient)
// -----------------------------------------------------------------------------
export function getRoles(tf: Timeframe): Role[] {
  const s = TIMEFRAME_SCALE[tf]
  const r = (n: number) => Math.round(n * s)

  return [
    {
      id: 'frontDesk',
      name: 'Front Desk',
      summary: 'Cobranza, ventas cash y manejo de llamadas (entrada/salida).',
      source: 'ECW + 8x8',
      headcount: 4,
      metrics: [
        { label: 'Cobranza insurance', value: r(98_400), format: 'currency', target: r(110_000) },
        { label: 'Ventas cash service', value: r(42_700), format: 'currency', target: r(45_000) },
        { label: 'Llamadas atendidas', value: r(1_840), format: 'number' },
        { label: 'Llamadas salientes', value: r(960), format: 'number', target: r(1_200) },
      ],
      leaderboard: [
        { name: 'María G.', metric: r(34_200), format: 'currency' },
        { name: 'Luis R.', metric: r(31_800), format: 'currency' },
        { name: 'Ana T.', metric: r(18_900), format: 'currency' },
      ],
    },
    {
      id: 'ma',
      name: 'Medical Assistants',
      summary: 'Inquiries de pacientes, vitals, procedimientos y refills.',
      source: 'ECW',
      headcount: 5,
      metrics: [
        { label: 'Inquiries de pacientes', value: r(1_120), format: 'number' },
        { label: 'Vitals tomados', value: r(2_310), format: 'number' },
        { label: 'Procedimientos', value: r(1_480), format: 'number' },
        { label: 'Rx refills', value: r(640), format: 'number' },
      ],
      leaderboard: [
        { name: 'Karen V.', metric: r(540), format: 'number' },
        { name: 'José M.', metric: r(498), format: 'number' },
        { name: 'Paola S.', metric: r(442), format: 'number' },
      ],
    },
    {
      id: 'pcc',
      name: 'PCC · Patient Care Coord.',
      summary: 'Citas POC, follow-ups, ventas cash y penetración de POC.',
      source: 'ECW + Billing',
      headcount: 3,
      metrics: [
        { label: 'Citas POC', value: r(412), format: 'number' },
        { label: 'Citas Follow-up', value: r(688), format: 'number' },
        { label: 'Ventas cash service', value: r(36_900), format: 'currency' },
        { label: 'Penetración POC', value: 64, format: 'percent', target: 70 },
        { label: '% pacientes "dripping"', value: 28, format: 'percent', lowerIsBetter: true },
      ],
      leaderboard: [
        { name: 'Diana P.', metric: r(168), format: 'number' },
        { name: 'Rafa C.', metric: r(151), format: 'number' },
        { name: 'Sofía L.', metric: r(93), format: 'number' },
      ],
    },
    {
      id: 'nurse',
      name: 'Nurses',
      summary: 'EBOO, sticks, misses, EBOO agendados y upsells.',
      source: 'ECW',
      headcount: 4,
      metrics: [
        { label: 'EBOOs realizados', value: r(188), format: 'number' },
        { label: 'Sticks', value: r(1_620), format: 'number' },
        { label: 'Misses', value: r(74), format: 'number', lowerIsBetter: true, target: r(50) },
        { label: 'EBOO agendados', value: r(212), format: 'number' },
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
      summary: 'Starts, misses ($3.20/miss), citas agendadas, upsells, caja EOD.',
      source: 'ECW',
      headcount: 5,
      metrics: [
        { label: 'Starts', value: r(1_340), format: 'number' },
        { label: 'Misses', value: r(96), format: 'number', lowerIsBetter: true, target: r(60) },
        { label: 'Citas agendadas', value: r(880), format: 'number' },
        { label: 'Upsells', value: r(312), format: 'number' },
        { label: 'Costo misses', value: r(96) * 3.2, format: 'currency', lowerIsBetter: true },
      ],
      leaderboard: [
        { name: 'Medic Toño', metric: r(298), format: 'number' },
        { name: 'Medic Ivy', metric: r(271), format: 'number' },
        { name: 'Medic Sam', metric: r(244), format: 'number' },
      ],
    },
    {
      id: 'newPatient',
      name: 'New Patient Team',
      summary: 'Leads, llamadas salientes y estado del pipeline de nuevos.',
      source: '8x8 + CRM',
      headcount: 3,
      metrics: [
        { label: 'Leads', value: r(420), format: 'number' },
        { label: 'Llamadas salientes', value: r(1_180), format: 'number' },
        { label: 'Onboarded', value: r(132), format: 'number' },
        { label: 'En waitlist', value: r(58), format: 'number' },
        { label: 'Declined', value: r(44), format: 'number', lowerIsBetter: true },
      ],
      leaderboard: [
        { name: 'Coord. Lucía', metric: r(58), format: 'number' },
        { name: 'Coord. Beto', metric: r(46), format: 'number' },
        { name: 'Coord. Nora', metric: r(28), format: 'number' },
      ],
    },
  ]
}

// Estado del pipeline de nuevos pacientes (para tarjetas tipo "kanban")
export function getNewPatientPipeline(tf: Timeframe) {
  const s = TIMEFRAME_SCALE[tf]
  const r = (n: number) => Math.round(n * s)
  return [
    { status: 'Nuevos / pendientes', count: r(86), tone: 'brand' as const },
    { status: 'Onboarded', count: r(132), tone: 'green' as const },
    { status: 'Waitlist', count: r(58), tone: 'amber' as const },
    { status: 'Declined', count: r(44), tone: 'red' as const },
  ]
}

// -----------------------------------------------------------------------------
// OCUPACIÓN DE UNIDADES (sillas / camas por día)
// -----------------------------------------------------------------------------
export function getOccupancy(): OccupancyUnit[] {
  return [
    { unit: 'IV Suite A', capacity: 8, booked: 7 },
    { unit: 'IV Suite B', capacity: 8, booked: 6 },
    { unit: 'EBOO Room 1', capacity: 4, booked: 4 },
    { unit: 'EBOO Room 2', capacity: 4, booked: 3 },
    { unit: 'Consulta 1', capacity: 6, booked: 5 },
    { unit: 'Consulta 2', capacity: 6, booked: 4 },
    { unit: 'Aesthetics', capacity: 5, booked: 4 },
  ]
}

// Ocupación a lo largo del día (heatmap simple)
export function getHourlyOccupancy(): { hour: string; pct: number }[] {
  const hours = ['8a', '9a', '10a', '11a', '12p', '1p', '2p', '3p', '4p', '5p', '6p']
  return hours.map((hour, i) => ({
    hour,
    pct: Math.round(45 + 50 * Math.abs(Math.sin((i + 1) / 2)) - seeded(i, 3) * 10),
  }))
}

// -----------------------------------------------------------------------------
// ALERTAS (insights accionables)
// -----------------------------------------------------------------------------
export function getAlerts(): Alert[] {
  return [
    {
      id: 'a1',
      severity: 'critical',
      message: 'Medics: misses por encima del target (96 vs 60). Costo estimado $307.',
      area: 'Medics',
    },
    {
      id: 'a2',
      severity: 'warning',
      message: 'PCC: penetración POC en 64%, debajo del objetivo de 70%.',
      area: 'PCC',
    },
    {
      id: 'a3',
      severity: 'warning',
      message: 'Front Desk: llamadas salientes en 960 vs meta de 1,200.',
      area: 'Front Desk',
    },
    {
      id: 'a4',
      severity: 'info',
      message: 'EBOO necesita landing page propia — 212 agendados, alta demanda.',
      area: 'Growth',
    },
  ]
}

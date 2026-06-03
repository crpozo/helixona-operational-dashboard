// Tipos centrales del dashboard operacional.
// Toda la data viene de src/data/mockData.ts (placeholder) y es facil de
// reemplazar por integraciones reales (ECW / 8x8 / billing) mas adelante.

export type Timeframe = 'week' | 'month' | 'quarter' | 'ytd'
export type PaymentType = 'all' | 'cash' | 'insurance'

export type Trend = 'up' | 'down' | 'flat'

export interface Kpi {
  id: string
  label: string
  value: number
  /** formato de presentacion del valor */
  format: 'number' | 'currency' | 'percent' | 'minutes'
  /** variacion vs periodo anterior, en % */
  deltaPct: number
  trend: Trend
  /** true cuando "bajar" es bueno (ej: misses, tiempo de espera) */
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
  | 'frontDesk'
  | 'ma'
  | 'pcc'
  | 'nurse'
  | 'medics'
  | 'newPatient'

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
  /** descripcion corta de la responsabilidad */
  summary: string
  /** fuente de datos esperada (segun notas) */
  source: string
  headcount: number
  metrics: RoleMetric[]
  /** ranking de empleados por la metrica principal del rol */
  leaderboard: EmployeePerformance[]
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

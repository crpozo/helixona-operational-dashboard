import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, Info, ShieldAlert } from 'lucide-react'
import Card from '../components/Card'
import KpiCard from '../components/KpiCard'
import type { PaymentType, Timeframe } from '../types'
import {
  getAlerts,
  getExecutiveKpis,
  getModalityBreakdown,
  getPatientFunnel,
  getRevenueTrend,
} from '../data/mockData'
import { CATEGORICAL, COLORS } from '../lib/colors'
import { formatCompact } from '../lib/format'

interface Props {
  timeframe: Timeframe
  payment: PaymentType
}

const SEVERITY = {
  critical: { icon: ShieldAlert, cls: 'text-rose-600 bg-rose-50 border-rose-100' },
  warning: { icon: AlertTriangle, cls: 'text-amber-600 bg-amber-50 border-amber-100' },
  info: { icon: Info, cls: 'text-brand-600 bg-brand-50 border-brand-100' },
}

export default function Overview({ timeframe, payment }: Props) {
  const kpis = getExecutiveKpis(timeframe, payment)
  const revenue = getRevenueTrend(payment)
  const funnel = getPatientFunnel(timeframe)
  const modalities = getModalityBreakdown(timeframe, payment)
  const alerts = getAlerts()

  return (
    <div className="space-y-6">
      {/* KPIs ejecutivos */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.id} kpi={k} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue trend */}
        <Card
          title="Revenue mensual"
          subtitle="Cash vs Insurance"
          className="lg:col-span-2"
        >
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenue} margin={{ left: -16, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="gCash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.cash} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={COLORS.cash} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gIns" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.insurance} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={COLORS.insurance} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v / 1000}k`}
              />
              <Tooltip formatter={(v: number) => formatCompact(v, 'currency')} />
              <Legend iconType="circle" />
              <Area
                type="monotone"
                dataKey="cash"
                name="Cash"
                stroke={COLORS.cash}
                fill="url(#gCash)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="insurance"
                name="Insurance"
                stroke={COLORS.insurance}
                fill="url(#gIns)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Alertas */}
        <Card title="Alertas operativas" subtitle="Necesitan atención">
          <ul className="space-y-3">
            {alerts.map((a) => {
              const { icon: Icon, cls } = SEVERITY[a.severity]
              return (
                <li
                  key={a.id}
                  className={`flex gap-3 rounded-xl border p-3 text-sm ${cls}`}
                >
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="font-medium leading-snug text-ink-900">{a.message}</p>
                    <p className="mt-0.5 text-xs opacity-70">{a.area}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Embudo de pacientes */}
        <Card title="Embudo de pacientes" subtitle="Lead → Onboarding → Paciente → 1ª cita">
          <div className="space-y-2.5">
            {funnel.map((stage, i) => {
              const pct = Math.round((stage.count / funnel[0].count) * 100)
              return (
                <div key={stage.stage}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-600">{stage.stage}</span>
                    <span className="tabular-nums text-slate-500">
                      {stage.count.toLocaleString()} · {pct}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        background: CATEGORICAL[i % CATEGORICAL.length],
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Revenue por modalidad */}
        <Card title="Revenue por modalidad" subtitle="Distribución del periodo">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={modalities} layout="vertical" margin={{ left: 24, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v / 1000}k`}
              />
              <YAxis
                type="category"
                dataKey="modality"
                tick={{ fontSize: 12, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                width={90}
              />
              <Tooltip formatter={(v: number) => formatCompact(v, 'currency')} />
              <Bar dataKey="revenue" radius={[0, 6, 6, 0]} barSize={18}>
                {modalities.map((_, i) => (
                  <Cell key={i} fill={CATEGORICAL[i % CATEGORICAL.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}

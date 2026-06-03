import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Card from '../components/Card'
import KpiCard from '../components/KpiCard'
import type { PaymentType, Timeframe } from '../types'
import {
  getExecutiveKpis,
  getModalityBreakdown,
  getRevenueTrend,
} from '../data/mockData'
import { CATEGORICAL, COLORS } from '../lib/colors'
import { formatCompact, formatValue } from '../lib/format'

interface Props {
  timeframe: Timeframe
  payment: PaymentType
}

export default function Revenue({ timeframe, payment }: Props) {
  const kpis = getExecutiveKpis(timeframe, payment).filter((k) =>
    ['revenue', 'rev-per-employee', 'rev-per-patient', 'ivs'].includes(k.id),
  )
  const trend = getRevenueTrend(payment)
  const modalities = getModalityBreakdown(timeframe, payment)

  const totalCash = trend.reduce((s, p) => s + p.cash, 0)
  const totalIns = trend.reduce((s, p) => s + p.insurance, 0)
  const mix = [
    { name: 'Cash', value: totalCash, color: COLORS.cash },
    { name: 'Insurance', value: totalIns, color: COLORS.insurance },
  ].filter((m) => m.value > 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.id} kpi={k} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card title="Revenue mensual" subtitle="Stack cash + insurance" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trend} margin={{ left: -16, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `$${v / 1000}k`}
              />
              <Tooltip formatter={(v: number) => formatCompact(v, 'currency')} />
              <Legend iconType="circle" />
              <Bar dataKey="cash" name="Cash" stackId="r" fill={COLORS.cash} radius={[0, 0, 0, 0]} />
              <Bar dataKey="insurance" name="Insurance" stackId="r" fill={COLORS.insurance} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Mix de pago" subtitle="Cash vs Insurance">
          {mix.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={mix}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {mix.map((m) => (
                      <Cell key={m.name} fill={m.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCompact(v, 'currency')} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1.5">
                {mix.map((m) => (
                  <div key={m.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
                      {m.name}
                    </span>
                    <span className="font-semibold tabular-nums text-ink-900">
                      {formatValue(m.value, 'currency')}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">Sin datos para este filtro.</p>
          )}
        </Card>
      </div>

      <Card title="Revenue y pacientes por modalidad" subtitle="Detalle del periodo">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-semibold">Modalidad</th>
                <th className="pb-2 text-right font-semibold">Pacientes</th>
                <th className="pb-2 text-right font-semibold">Revenue</th>
                <th className="pb-2 text-right font-semibold">Rev / paciente</th>
                <th className="pb-2 pl-4 font-semibold">Participación</th>
              </tr>
            </thead>
            <tbody>
              {modalities.map((m, i) => {
                const totalRev = modalities.reduce((s, x) => s + x.revenue, 0)
                const share = totalRev ? Math.round((m.revenue / totalRev) * 100) : 0
                return (
                  <tr key={m.modality} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 font-medium text-ink-900">{m.modality}</td>
                    <td className="py-2.5 text-right tabular-nums text-slate-600">
                      {m.patients.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right tabular-nums font-semibold text-ink-900">
                      {formatValue(m.revenue, 'currency')}
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-slate-600">
                      {formatValue(m.patients ? m.revenue / m.patients : 0, 'currency')}
                    </td>
                    <td className="py-2.5 pl-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${share}%`, background: CATEGORICAL[i % CATEGORICAL.length] }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs tabular-nums text-slate-500">{share}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

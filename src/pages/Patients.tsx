import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Card from '../components/Card'
import KpiCard from '../components/KpiCard'
import type { PaymentType } from '../types'
import {
  getExecutiveKpis,
  getModalityBreakdown,
  getNewPatientPipeline,
  getPatientFunnel,
} from '../data/mockData'
import { CATEGORICAL } from '../lib/colors'

interface Props {
  scale: number
  payment: PaymentType
}

const TONE: Record<string, string> = {
  brand: 'bg-brand-50 text-brand-700 border-brand-100',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  red: 'bg-rose-50 text-rose-700 border-rose-100',
}

export default function Patients({ scale, payment }: Props) {
  const kpis = getExecutiveKpis(scale, payment).filter((k) =>
    ['active-patients', 'new-patients', 'avg-wait', 'ivs'].includes(k.id),
  )
  const funnel = getPatientFunnel(scale)
  const pipeline = getNewPatientPipeline(scale)
  const modalities = getModalityBreakdown(scale, payment)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.id} kpi={k} />
        ))}
      </div>

      {/* New-patient pipeline */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {pipeline.map((p) => (
          <div key={p.status} className={`rounded-2xl border p-4 ${TONE[p.tone]}`}>
            <p className="text-3xl font-bold tabular-nums">{p.count.toLocaleString()}</p>
            <p className="mt-1 text-sm font-medium">{p.status}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Conversion funnel" subtitle="From lead to first appointment">
          <div className="space-y-2.5">
            {funnel.map((stage, i) => {
              const pct = Math.round((stage.count / funnel[0].count) * 100)
              const prev = i > 0 ? funnel[i - 1].count : stage.count
              const stepConv = prev ? Math.round((stage.count / prev) * 100) : 100
              return (
                <div key={stage.stage}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-600">{stage.stage}</span>
                    <span className="tabular-nums text-slate-500">
                      {stage.count.toLocaleString()}
                      {i > 0 && <span className="ml-2 text-xs text-slate-400">({stepConv}% step)</span>}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: CATEGORICAL[i % CATEGORICAL.length] }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card title="Patients by modality" subtitle="Service mix">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={modalities} margin={{ left: -16, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis
                dataKey="modality"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-12}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => `${v.toLocaleString()} patients`} />
              <Bar dataKey="patients" radius={[6, 6, 0, 0]} barSize={36}>
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

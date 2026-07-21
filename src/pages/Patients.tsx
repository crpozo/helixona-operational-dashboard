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
import { useState } from 'react'
import { Phone } from 'lucide-react'
import Card from '../components/Card'
import TrendPanel from '../components/TrendPanel'
import KpiCard from '../components/KpiCard'
import type { Kpi, PaymentType } from '../types'
import {
  getExecutiveKpis,
  getInactivePatients,
  getModalityBreakdown,
  getNewPatientPipeline,
  getPatientFunnel,
  getPrograms,
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
  const programs = getPrograms()
  const modalities = getModalityBreakdown(scale, payment)
  const inactive = getInactivePatients()
  const [selKpi, setSelKpi] = useState<Kpi | null>(null)
  const [showInactive, setShowInactive] = useState(false)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard
            key={k.id}
            kpi={k}
            active={selKpi?.id === k.id}
            onClick={() => setSelKpi(selKpi?.id === k.id ? null : k)}
          />
        ))}
      </div>
      {selKpi && <TrendPanel metric={selKpi} onClose={() => setSelKpi(null)} />}

      {/* Inactive patients — click to get the call list */}
      <Card
        title="Inactive patients"
        subtitle="No visit in 90+ days — click to get the call list for staff"
        action={
          <button
            onClick={() => setShowInactive((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-sm font-bold text-rose-700 transition hover:bg-rose-100"
          >
            {inactive.length} patients
          </button>
        }
      >
        {showInactive ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 font-semibold">Patient</th>
                  <th className="pb-2 font-semibold">Last visit</th>
                  <th className="pb-2 font-semibold">Modality</th>
                  <th className="pb-2 font-semibold">Phone</th>
                  <th className="pb-2 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {inactive.map((p) => (
                  <tr key={p.name} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 font-medium text-ink-900">{p.name}</td>
                    <td className="py-2 text-slate-600">{p.lastVisit}</td>
                    <td className="py-2 text-slate-600">{p.modality}</td>
                    <td className="py-2 tabular-nums text-slate-600">{p.phone}</td>
                    <td className="py-2 text-right">
                      <a
                        href={`tel:${p.phone.replace(/[^\d]/g, '')}`}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-2.5 py-1 text-xs font-semibold text-ink-900 transition hover:bg-brand-400"
                      >
                        <Phone className="h-3 w-3" />
                        Call
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            {inactive.length} patients have gone inactive. Click the counter to open the call list.
          </p>
        )}
      </Card>

      {/* New-patient pipeline */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {pipeline.map((p) => (
          <div key={p.status} className={`rounded-2xl border p-4 ${TONE[p.tone]}`}>
            <p className="text-3xl font-bold tabular-nums">{p.count.toLocaleString()}</p>
            <p className="mt-1 text-sm font-medium">{p.status}</p>
          </div>
        ))}
      </div>

      {/* Helixona program tracks */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {programs.map((p) => (
          <div key={p.name} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-3xl font-bold tabular-nums text-ink-900">{p.patients.toLocaleString()}</p>
            <p className="mt-1 text-sm font-medium text-slate-500">{p.name}</p>
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
              const denied = stage.stage.startsWith('Denied')
              return (
                <div key={stage.stage}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className={`font-medium ${denied ? 'text-rose-600' : 'text-slate-600'}`}>{stage.stage}</span>
                    <span className="tabular-nums text-slate-500">
                      {stage.count.toLocaleString()}
                      {denied ? (
                        <span className="ml-2 text-xs text-rose-400">left the funnel</span>
                      ) : (
                        i > 0 && <span className="ml-2 text-xs text-slate-400">({stepConv}% step)</span>
                      )}
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: denied ? '#e11d48' : CATEGORICAL[i % CATEGORICAL.length] }}
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
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={90}
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

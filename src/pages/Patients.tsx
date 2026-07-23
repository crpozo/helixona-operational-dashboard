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
import type { ReactNode } from 'react'
import { Phone } from 'lucide-react'
import Card from '../components/Card'
import FunnelChart from '../components/FunnelChart'
import TrendPanel from '../components/TrendPanel'
import KpiCard from '../components/KpiCard'
import type { Kpi, PaymentType } from '../types'
import {
  getExecutiveKpis,
  getInactivePatients,
  getModalityBreakdown,
  getNewPatientPipeline,
  getPatientFunnel,
  getPatientPopulation,
  getPrograms,
  getSuccessfulLeadSources,
} from '../data/mockData'
import { CATEGORICAL } from '../lib/colors'

interface Props {
  scale: number
  payment: PaymentType
}

/** A uniform stat cell for the population panel, with an optional ratio meter. */
function StatCell({
  label,
  value,
  hint,
  meter,
  accent,
}: {
  label: string
  value: ReactNode
  hint?: string
  meter?: number
  accent?: boolean
}) {
  return (
    <div
      className={`flex flex-col rounded-xl border p-4 ${
        accent ? 'border-brand-200 bg-brand-50/60' : 'border-slate-100 bg-slate-50/60'
      }`}
    >
      <p className={`text-xs font-medium ${accent ? 'text-brand-700' : 'text-slate-500'}`}>{label}</p>
      <p className="mt-1.5 text-2xl font-bold tabular-nums tracking-tight text-ink-900">{value}</p>
      {typeof meter === 'number' && (
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70">
          <div
            className={`h-full rounded-full ${accent ? 'bg-brand-500' : 'bg-emerald-500'}`}
            style={{ width: `${Math.min(100, meter)}%` }}
          />
        </div>
      )}
      {hint && <p className="mt-1.5 text-[11px] leading-tight text-slate-400">{hint}</p>}
    </div>
  )
}

export default function Patients({ scale, payment }: Props) {
  const kpis = getExecutiveKpis(scale, payment).filter((k) =>
    ['active-patients', 'new-patients', 'avg-wait'].includes(k.id),
  )
  const activePatients = getExecutiveKpis(scale, payment).find((k) => k.id === 'active-patients')?.value ?? 0
  const pop = getPatientPopulation(scale)
  const ivRatioPct = Math.round((pop.activeIvPatients / pop.totalIvScripts) * 100)
  const pocPct = activePatients > 0 ? Math.round((pop.followingPoc / activePatients) * 100) : 0
  const totalCalls = Math.round(1_720 * scale)
  const sources = getSuccessfulLeadSources(scale)
  const funnel = getPatientFunnel(scale)
  const pipeline = getNewPatientPipeline(scale)
  const waitlisted = pipeline.find((p) => p.status === 'Waitlisted')?.count ?? 0
  const programs = getPrograms()
  const programTotal = programs.reduce((s, p) => s + p.patients, 0)
  const modalities = getModalityBreakdown(scale, payment)
  const inactive = getInactivePatients()
  const [selKpi, setSelKpi] = useState<Kpi | null>(null)
  const [showInactive, setShowInactive] = useState(false)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

      {/* Patient population — stock metrics (don't rescale with the period) */}
      <Card title="Patient population" subtitle="Current totals · leads & onboarding detail lives with Marie (Team & Roles)">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <StatCell label="Total patients" value={pop.totalPatients.toLocaleString()} hint="All patients on record" />
          <StatCell label="IV patients" value={pop.ivPatients.toLocaleString()} hint="Distinct patients receiving IVs in the period" />
          <StatCell
            accent
            label="Active IV patients / IV scripts"
            value={
              <>
                {pop.activeIvPatients}
                <span className="text-slate-300">/</span>
                {pop.totalIvScripts}
                <span className="ml-2 text-sm font-semibold text-brand-700">{ivRatioPct}%</span>
              </>
            }
            meter={ivRatioPct}
            hint="Actively coming in vs. all with an IV script"
          />
          <StatCell
            label="Following plan of care"
            value={
              <>
                {pop.followingPoc.toLocaleString()}
                <span className="ml-2 text-sm font-semibold text-slate-400">{pocPct}% of active</span>
              </>
            }
            meter={pocPct}
            hint="Active patients on track with their POC"
          />
          <StatCell label="Total calls" value={totalCalls.toLocaleString()} hint="Inbound + outbound this period" />
          <StatCell label="Waitlisted" value={waitlisted.toLocaleString()} hint="New patients waiting for an opening" />
        </div>
      </Card>

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Conversion funnel" subtitle="From lead to first appointment · also shown in Marie's section (Team & Roles)">
          <FunnelChart funnel={funnel} />
        </Card>

        <Card
          title="What's working"
          subtitle="Lead sources of successful (still-active) patients · feeds the AI Insights analysis"
        >
          <div className="space-y-2.5">
            {(() => {
              const total = sources.reduce((s, x) => s + x.patients, 0)
              return sources.map((s) => {
                const pct = Math.round((s.patients / total) * 100)
                return (
                  <div key={s.source}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-600">{s.source}</span>
                      <span className="tabular-nums text-slate-500">
                        {s.patients.toLocaleString()}
                        <span className="ml-1.5 text-xs text-slate-400">({pct}%)</span>
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )
              })
            })()}
          </div>
        </Card>

        <Card title="Program tracks" subtitle="Enrollment by Helixona program">
          <div className="space-y-3.5">
            {programs.map((p, i) => {
              const pct = Math.round((p.patients / programTotal) * 100)
              return (
                <div key={p.name}>
                  <div className="mb-1 flex items-baseline justify-between">
                    <span className="text-sm font-medium text-slate-600">{p.name}</span>
                    <span className="text-lg font-bold tabular-nums text-ink-900">{p.patients.toLocaleString()}</span>
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

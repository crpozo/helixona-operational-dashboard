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

const TONE: Record<string, string> = {
  brand: 'bg-brand-50 text-brand-700 border-brand-100',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  amber: 'bg-amber-50 text-amber-700 border-amber-100',
  red: 'bg-rose-50 text-rose-700 border-rose-100',
}

export default function Patients({ scale, payment }: Props) {
  const kpis = getExecutiveKpis(scale, payment).filter((k) =>
    ['active-patients', 'new-patients', 'avg-wait'].includes(k.id),
  )
  const activePatients = getExecutiveKpis(scale, payment).find((k) => k.id === 'active-patients')?.value ?? 0
  const pop = getPatientPopulation(scale)
  const ivRatioPct = Math.round((pop.activeIvPatients / pop.totalIvScripts) * 100)
  const sources = getSuccessfulLeadSources(scale)
  const funnel = getPatientFunnel(scale)
  const pipeline = getNewPatientPipeline(scale)
  const programs = getPrograms()
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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Total patients</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-ink-900">{pop.totalPatients.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-slate-400">All patients on record</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Following plan of care</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-ink-900">
            {pop.followingPoc.toLocaleString()}
            {activePatients > 0 && (
              <span className="ml-2 text-sm font-semibold text-slate-400">
                {Math.round((pop.followingPoc / activePatients) * 100)}% of active
              </span>
            )}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">Active patients on track with their POC</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-medium text-slate-500">IV patients</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-ink-900">{pop.ivPatients.toLocaleString()}</p>
          <p className="mt-1 text-[11px] text-slate-400">Distinct patients receiving IVs in the period</p>
        </div>
        <div className="rounded-2xl border border-brand-200 bg-brand-50 p-4">
          <p className="text-sm font-medium text-brand-700">Active IV patients / IV scripts</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-ink-900">
            {pop.activeIvPatients}/{pop.totalIvScripts}
            <span className="ml-2 text-sm font-semibold text-brand-700">{ivRatioPct}%</span>
          </p>
          <p className="mt-1 text-[11px] text-brand-700/70">Patients actively coming in vs. all with an IV script</p>
        </div>
      </div>

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

      {/* Population-level stats — leads/onboarding detail lives with Marie (Team & Roles) */}
      <div className="grid grid-cols-2 gap-4">
        <div className={`rounded-2xl border p-4 ${TONE.brand}`}>
          <p className="text-3xl font-bold tabular-nums">{Math.round(1_720 * scale).toLocaleString()}</p>
          <p className="mt-1 text-sm font-medium">Total calls</p>
        </div>
        {pipeline
          .filter((p) => p.status === 'Waitlisted')
          .map((p) => (
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

import { useState } from 'react'
import { Users } from 'lucide-react'
import Card from '../components/Card'
import FunnelChart from '../components/FunnelChart'
import type { RoleMetric } from '../types'
import { getPatientFunnel, getRoles } from '../data/mockData'
import { formatValue } from '../lib/format'

interface Props {
  scale: number
}

function MetricRow({ m }: { m: RoleMetric }) {
  const hasTarget = typeof m.target === 'number' && m.target > 0
  const pct = hasTarget ? Math.min(100, Math.round((m.value / (m.target as number)) * 100)) : 0
  // For metrics where lower is better, "on track" = value <= target
  const onTrack = hasTarget
    ? m.lowerIsBetter
      ? m.value <= (m.target as number)
      : m.value >= (m.target as number)
    : true

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-600">{m.label}</span>
        <span className="text-sm font-bold tabular-nums text-ink-900">{formatValue(m.value, m.format)}</span>
      </div>
      {hasTarget && (
        <div className="mt-2">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
            <div
              className={`h-full rounded-full ${onTrack ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Target: {formatValue(m.target as number, m.format)}
            {m.lowerIsBetter ? ' (lower is better)' : ''}
          </p>
        </div>
      )}
    </div>
  )
}

export default function Team({ scale }: Props) {
  const roles = getRoles(scale)
  const [activeId, setActiveId] = useState(roles[0].id)
  const active = roles.find((r) => r.id === activeId) ?? roles[0]
  const totalHeadcount = roles.reduce((s, r) => s + r.headcount, 0)

  return (
    <div className="space-y-6">
      {/* Role selector */}
      <div className="flex flex-wrap gap-2">
        {roles.map((r) => (
          <button
            key={r.id}
            onClick={() => setActiveId(r.id)}
            className={`rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
              r.id === activeId
                ? 'border-brand-500 bg-brand-500 text-ink-900 shadow'
                : 'border-slate-200 bg-white text-slate-600 hover:border-brand-400'
            }`}
          >
            {r.name}
            <span
              className={`ml-2 rounded-full px-1.5 py-0.5 text-[11px] ${
                r.id === activeId ? 'bg-white/20' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {r.headcount}
            </span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 rounded-xl bg-slate-100 px-3.5 py-2 text-sm font-medium text-slate-500">
          <Users className="h-4 w-4" />
          {totalHeadcount} employees
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Role detail */}
        <Card
          title={active.name}
          subtitle={active.summary}
          className={active.id === 'newPatient' ? 'lg:col-span-2' : 'lg:col-span-3'}
          action={
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
              Source: {active.source}
            </span>
          }
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {active.metrics.map((m) => (
              <MetricRow key={m.label} m={m} />
            ))}
          </div>
        </Card>

        {/* Marie owns the lead funnel — same funnel as the Patients tab */}
        {active.id === 'newPatient' && (
          <Card title="Conversion funnel" subtitle="From lead to first appointment">
            <FunnelChart funnel={getPatientFunnel(scale)} />
          </Card>
        )}
      </div>

      {/* Roll-up across all roles (manager view) */}
      <Card title="Team roll-up" subtitle="Manager view · all areas">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-semibold">Role</th>
                <th className="pb-2 text-right font-semibold">Headcount</th>
                <th className="pb-2 font-semibold pl-4">Highlighted metric</th>
                <th className="pb-2 font-semibold pl-4">Source</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="py-2.5 font-medium text-ink-900">{r.name}</td>
                  <td className="py-2.5 text-right tabular-nums text-slate-600">{r.headcount}</td>
                  <td className="py-2.5 pl-4 text-slate-600">
                    {r.metrics[0].label}:{' '}
                    <span className="font-semibold text-ink-900">
                      {formatValue(r.metrics[0].value, r.metrics[0].format)}
                    </span>
                  </td>
                  <td className="py-2.5 pl-4 text-slate-400">{r.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

import { useState } from 'react'
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
import { AlertTriangle, Info, Plus, ShieldAlert, X } from 'lucide-react'
import Card from '../components/Card'
import KpiCard from '../components/KpiCard'
import type { Goal, PaymentType } from '../types'
import {
  getAlerts,
  getExecutiveKpis,
  getGoals,
  getModalityBreakdown,
  getPatientFunnel,
  getRevenueTrend,
} from '../data/mockData'
import { CATEGORICAL, COLORS } from '../lib/colors'
import { formatCompact, formatValue } from '../lib/format'

interface Props {
  scale: number
  payment: PaymentType
}

const SEVERITY = {
  critical: { icon: ShieldAlert, cls: 'text-rose-600 bg-rose-50 border-rose-100' },
  warning: { icon: AlertTriangle, cls: 'text-amber-600 bg-amber-50 border-amber-100' },
  info: { icon: Info, cls: 'text-brand-600 bg-brand-50 border-brand-100' },
}

export default function Overview({ scale, payment }: Props) {
  const kpis = getExecutiveKpis(scale, payment)
  const revenue = getRevenueTrend(payment)
  const funnel = getPatientFunnel(scale)
  const modalities = getModalityBreakdown(scale, payment)
  const [dismissed, setDismissed] = useState<string[]>([])
  const alerts = getAlerts().filter((a) => !dismissed.includes(a.id))

  // Admin: company goals added at runtime (placeholder until persisted via API)
  const [customGoals, setCustomGoals] = useState<Goal[]>([])
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [draft, setDraft] = useState({ label: '', area: '', value: '', target: '', lowerIsBetter: false })
  const goals = [...getGoals(), ...customGoals]

  const addGoal = () => {
    const value = Number(draft.value)
    const target = Number(draft.target)
    if (!draft.label.trim() || !Number.isFinite(value) || !Number.isFinite(target) || target <= 0) return
    setCustomGoals((g) => [
      ...g,
      {
        id: `custom-${Date.now()}`,
        label: draft.label.trim(),
        area: draft.area.trim() || 'Company',
        value,
        target,
        format: 'number',
        lowerIsBetter: draft.lowerIsBetter,
      },
    ])
    setDraft({ label: '', area: '', value: '', target: '', lowerIsBetter: false })
    setShowGoalForm(false)
  }

  return (
    <div className="space-y-6">
      {/* Executive KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.id} kpi={k} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue trend */}
        <Card title="Monthly revenue" subtitle="Cash vs Insurance" className="lg:col-span-2">
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
              <Area type="monotone" dataKey="cash" name="Cash" stroke={COLORS.cash} fill="url(#gCash)" strokeWidth={2} />
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

        {/* Alerts */}
        <Card title="Operational alerts" subtitle="Need attention">
          {alerts.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-400">All clear — no open alerts.</p>
          ) : (
            <ul className="space-y-3">
              {alerts.map((a) => {
                const { icon: Icon, cls } = SEVERITY[a.severity]
                return (
                  <li key={a.id} className={`flex gap-3 rounded-xl border p-3 text-sm ${cls}`}>
                    <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium leading-snug text-ink-900">{a.message}</p>
                      <p className="mt-0.5 text-xs opacity-70">{a.area}</p>
                    </div>
                    <button
                      onClick={() => setDismissed((d) => [...d, a.id])}
                      className="shrink-0 rounded-md p-0.5 text-slate-400 hover:bg-white/60 hover:text-slate-600"
                      title="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Patient funnel */}
        <Card title="Patient funnel" subtitle="Lead → Onboarding → Patient → 1st appt.">
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
                      style={{ width: `${pct}%`, background: CATEGORICAL[i % CATEGORICAL.length] }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Revenue by modality */}
        <Card title="Revenue by modality" subtitle="Period distribution">
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
                tick={{ fontSize: 11, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                width={140}
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

      {/* Goals — these drive the alerts above; admins can add company goals */}
      <Card
        title="Goals"
        subtitle="Targets that trigger the alerts · Admin can add company goals"
        action={
          <button
            onClick={() => setShowGoalForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Add goal
          </button>
        }
      >
        {showGoalForm && (
          <div className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-brand-200 bg-brand-50/50 p-3">
            <div>
              <p className="mb-1 text-[11px] font-medium text-slate-500">Goal name</p>
              <input
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                placeholder="e.g. EBOOs per month"
                className="w-44 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <p className="mb-1 text-[11px] font-medium text-slate-500">Area</p>
              <input
                value={draft.area}
                onChange={(e) => setDraft({ ...draft, area: e.target.value })}
                placeholder="e.g. Nurses"
                className="w-28 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <p className="mb-1 text-[11px] font-medium text-slate-500">Current</p>
              <input
                value={draft.value}
                onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                placeholder="0"
                inputMode="numeric"
                className="w-20 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <p className="mb-1 text-[11px] font-medium text-slate-500">Target</p>
              <input
                value={draft.target}
                onChange={(e) => setDraft({ ...draft, target: e.target.value })}
                placeholder="100"
                inputMode="numeric"
                className="w-20 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
              />
            </div>
            <label className="flex items-center gap-1.5 pb-1.5 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={draft.lowerIsBetter}
                onChange={(e) => setDraft({ ...draft, lowerIsBetter: e.target.checked })}
              />
              Lower is better
            </label>
            <button
              onClick={addGoal}
              className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-ink-900 transition hover:bg-brand-400"
            >
              Save goal
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g) => {
            const breached = g.lowerIsBetter ? g.value > g.target : g.value < g.target
            const pct = Math.min(100, Math.round((g.value / g.target) * 100))
            return (
              <div key={g.id} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600">{g.label}</span>
                  <span className={`text-xs font-semibold ${breached ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {breached ? 'Off target' : 'On track'}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full rounded-full ${breached ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {formatValue(g.value, g.format)} / target {formatValue(g.target, g.format)}
                  {g.lowerIsBetter ? ' (lower is better)' : ''}
                </p>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

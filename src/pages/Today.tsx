import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Clock } from 'lucide-react'
import Card from '../components/Card'
import KpiCard from '../components/KpiCard'
import type { TodayEmployee } from '../types'
import { asOfLabel, getEmployeesToday, getTodayHourly, getTodayKpis } from '../data/mockData'
import { COLORS } from '../lib/colors'
import { formatValue } from '../lib/format'

const STATUS: Record<TodayEmployee['status'], { label: string; cls: string }> = {
  ahead: { label: 'Ahead', cls: 'bg-emerald-50 text-emerald-700' },
  'on-track': { label: 'On track', cls: 'bg-brand-50 text-brand-700' },
  behind: { label: 'Behind', cls: 'bg-rose-50 text-rose-700' },
  off: { label: 'Off', cls: 'bg-slate-100 text-slate-400' },
}

// Appointments breakdown for today.
const APPTS = { completed: 38, remaining: 14, noShow: 3 }

export default function Today() {
  const kpis = getTodayKpis()
  const hourly = getTodayHourly()
  const employees = getEmployeesToday()

  const onShift = employees
    .filter((e) => e.onShift)
    .sort((a, b) => b.perfPct - a.perfPct)
  const aheadCount = onShift.filter((e) => e.status === 'ahead').length

  const apptData = [
    { name: 'Completed', value: APPTS.completed, color: COLORS.cash },
    { name: 'Remaining', value: APPTS.remaining, color: '#cbb892' },
    { name: 'No-show', value: APPTS.noShow, color: COLORS.rose },
  ]
  const apptTotal = APPTS.completed + APPTS.remaining + APPTS.noShow

  return (
    <div className="space-y-6">
      {/* Live banner */}
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          LIVE
        </span>
        <Clock className="h-4 w-4" />
        <span>As of {asOfLabel()} today</span>
      </div>

      {/* Today KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <KpiCard key={k.id} kpi={k} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Arrivals by hour */}
        <Card title="Arrivals by hour" subtitle="Patients checked in today" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={hourly} margin={{ left: -16, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip formatter={(v: number) => `${v} patients`} />
              <Bar dataKey="arrivals" radius={[6, 6, 0, 0]} barSize={24}>
                {hourly.map((h, i) => (
                  <Cell key={i} fill={h.past ? COLORS.cash : '#e8d7b4'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Appointments today */}
        <Card title="Appointments today" subtitle={`${apptTotal} scheduled`}>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={apptData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={75} paddingAngle={3}>
                {apptData.map((a) => (
                  <Cell key={a.name} fill={a.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => `${v} appts`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-1.5">
            {apptData.map((a) => (
              <div key={a.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: a.color }} />
                  {a.name}
                </span>
                <span className="font-semibold tabular-nums text-ink-900">{a.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Employee performance today */}
      <Card
        title="Team on shift — performance today"
        subtitle={`${onShift.length} on shift · ${aheadCount} ahead of target`}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-semibold">Employee</th>
                <th className="pb-2 font-semibold">Role</th>
                <th className="pb-2 text-right font-semibold">Patients</th>
                <th className="pb-2 text-right font-semibold">Revenue</th>
                <th className="pb-2 pl-4 font-semibold">vs daily target</th>
                <th className="pb-2 pl-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {onShift.map((e) => {
                const { label, cls } = STATUS[e.status]
                const barPct = Math.min(100, e.perfPct)
                const barColor = e.perfPct >= 100 ? '#22c55e' : e.perfPct >= 85 ? COLORS.cash : COLORS.rose
                return (
                  <tr key={e.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 font-medium text-ink-900">{e.name}</td>
                    <td className="py-2.5 text-slate-600">{e.role}</td>
                    <td className="py-2.5 text-right tabular-nums text-slate-600">{e.patients}</td>
                    <td className="py-2.5 text-right tabular-nums font-semibold text-ink-900">
                      {formatValue(e.revenue, 'currency')}
                    </td>
                    <td className="py-2.5 pl-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full" style={{ width: `${barPct}%`, background: barColor }} />
                        </div>
                        <span className="w-10 text-right text-xs tabular-nums text-slate-500">{e.perfPct}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 pl-4">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${cls}`}>{label}</span>
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

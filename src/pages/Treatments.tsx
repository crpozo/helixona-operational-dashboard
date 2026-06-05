import { useState } from 'react'
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
import { getHourlyOccupancy, getOccupancy, getTreatments } from '../data/mockData'
import { CATEGORICAL, COLORS } from '../lib/colors'
import { formatCompact, formatValue } from '../lib/format'

type Metric = 'occupancy' | 'revenue'

function pctColor(pct: number): string {
  if (pct >= 90) return '#1c1c1c'
  if (pct >= 75) return '#d6b981'
  if (pct >= 50) return '#cbb892'
  return COLORS.slate
}

export default function Treatments() {
  const treatments = getTreatments()
  const units = getOccupancy()
  const hourly = getHourlyOccupancy()
  const [metric, setMetric] = useState<Metric>('revenue')

  const totalTreatments = treatments.reduce((s, t) => s + t.treatments, 0)
  const totalRevenue = treatments.reduce((s, t) => s + t.revenue, 0)
  const avgOcc = Math.round(treatments.reduce((s, t) => s + t.occupancyPct, 0) / treatments.length)

  const sorted = [...treatments].sort((a, b) =>
    metric === 'revenue' ? b.revenue - a.revenue : b.occupancyPct - a.occupancyPct,
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Treatments delivered</p>
          <p className="mt-2 text-3xl font-bold text-ink-900">{totalTreatments.toLocaleString()}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Treatment revenue</p>
          <p className="mt-2 text-3xl font-bold text-ink-900">{formatValue(totalRevenue, 'currency')}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Avg occupancy</p>
          <p className="mt-2 text-3xl font-bold text-ink-900">{avgOcc}%</p>
        </div>
      </div>

      {/* Treatments by revenue / occupancy (toggle) */}
      <Card
        title="By treatment / modality"
        subtitle={metric === 'revenue' ? 'Revenue per treatment type' : 'Occupancy per treatment type'}
        action={
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
            {(['revenue', 'occupancy'] as Metric[]).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold capitalize transition ${
                  metric === m ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        }
      >
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={sorted} layout="vertical" margin={{ left: 24, right: 16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
            <XAxis
              type="number"
              tick={{ fontSize: 12, fill: '#94a3b8' }}
              axisLine={false}
              tickLine={false}
              domain={metric === 'occupancy' ? [0, 100] : [0, 'auto']}
              tickFormatter={(v) => (metric === 'revenue' ? `$${v / 1000}k` : `${v}%`)}
            />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={100} />
            <Tooltip formatter={(v: number) => (metric === 'revenue' ? formatCompact(v, 'currency') : `${v}%`)} />
            <Bar dataKey={metric === 'revenue' ? 'revenue' : 'occupancyPct'} radius={[0, 6, 6, 0]} barSize={20}>
              {sorted.map((t, i) => (
                <Cell key={i} fill={metric === 'occupancy' ? pctColor(t.occupancyPct) : CATEGORICAL[i % CATEGORICAL.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Occupancy by unit */}
        <Card title="Occupancy by unit" subtitle="Booked vs capacity (today)">
          <div className="space-y-3">
            {units.map((u) => {
              const pct = Math.round((u.booked / u.capacity) * 100)
              return (
                <div key={u.unit}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-600">{u.unit}</span>
                    <span className="tabular-nums text-slate-500">{u.booked}/{u.capacity} · {pct}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: pctColor(pct) }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Occupancy by hour */}
        <Card title="Occupancy by hour" subtitle="Daily curve — spot the peaks">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourly} margin={{ left: -16, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
              <Tooltip formatter={(v: number) => [`${v}%`, 'Occupancy']} />
              <Bar dataKey="pct" name="Occupancy" radius={[6, 6, 0, 0]} barSize={22}>
                {hourly.map((h, i) => (
                  <Cell key={i} fill={pctColor(h.pct)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}

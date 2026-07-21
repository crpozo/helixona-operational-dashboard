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
import { X } from 'lucide-react'
import Card from '../components/Card'
import type { PaymentType, Treatment } from '../types'
import { getHourlyOccupancy, getOccupancy, getTreatments, getTreatmentTrend } from '../data/mockData'
import { CATEGORICAL, COLORS } from '../lib/colors'
import { formatCompact, formatValue } from '../lib/format'

type Metric = 'occupancy' | 'revenue'

interface Props {
  scale: number
  payment: PaymentType
}

function pctColor(pct: number): string {
  if (pct >= 90) return '#1c1c1c'
  if (pct >= 75) return '#d6b981'
  if (pct >= 50) return '#cbb892'
  return COLORS.slate
}

/** Hover tooltip: appointments + occupancy with today's spots (e.g. 21/25). */
function TreatmentTooltip({ active, payload }: { active?: boolean; payload?: { payload: Treatment }[] }) {
  if (!active || !payload?.length) return null
  const t = payload[0].payload
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-md">
      <p className="font-semibold text-ink-900">{t.name}</p>
      <p className="mt-1 text-slate-600">Appointments: <span className="font-semibold">{t.treatments.toLocaleString()}</span></p>
      <p className="text-slate-600">
        Occupancy: <span className="font-semibold">{t.occupancyPct}%</span>{' '}
        <span className="text-slate-400">({t.booked}/{t.capacity} spots today)</span>
      </p>
      <p className="text-slate-600">Revenue: <span className="font-semibold">{formatValue(t.revenue, 'currency')}</span></p>
      <p className="mt-1 text-[10px] text-slate-400">Click for trend over time</p>
    </div>
  )
}

export default function Treatments({ scale, payment }: Props) {
  const treatments = getTreatments(scale, payment)
  const units = getOccupancy()
  const hourly = getHourlyOccupancy()
  const [metric, setMetric] = useState<Metric>('revenue')
  const [selected, setSelected] = useState<string | null>(null)

  const totalTreatments = treatments.reduce((s, t) => s + t.treatments, 0)
  const totalRevenue = treatments.reduce((s, t) => s + t.revenue, 0)
  const avgOcc = Math.round(treatments.reduce((s, t) => s + t.occupancyPct, 0) / treatments.length)

  const sorted = [...treatments].sort((a, b) =>
    metric === 'revenue' ? b.revenue - a.revenue : b.occupancyPct - a.occupancyPct,
  )

  const trend = selected ? getTreatmentTrend(selected) : []

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

      {/* Treatments by revenue / occupancy (toggle); hover = spots, click = trend */}
      <Card
        title="By treatment / modality"
        subtitle={
          metric === 'revenue'
            ? 'Revenue per treatment type · hover for occupancy, click for trend'
            : 'Occupancy per treatment type · hover for spots, click for trend'
        }
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
        <ResponsiveContainer width="100%" height={440}>
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
            <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={155} />
            <Tooltip content={<TreatmentTooltip />} />
            <Bar
              dataKey={metric === 'revenue' ? 'revenue' : 'occupancyPct'}
              radius={[0, 6, 6, 0]}
              barSize={20}
              className="cursor-pointer"
              onClick={(d: { name?: string }) => d?.name && setSelected(d.name)}
            >
              {sorted.map((t, i) => (
                <Cell key={i} fill={metric === 'occupancy' ? pctColor(t.occupancyPct) : CATEGORICAL[i % CATEGORICAL.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Trend over time for the clicked treatment */}
      {selected && (
        <Card
          title={`${selected} · trend over time`}
          subtitle="Monthly revenue, treatments, and occupancy"
          action={
            <button
              onClick={() => setSelected(null)}
              className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          }
        >
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trend} margin={{ left: -8, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="gTreat" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.cash} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={COLORS.cash} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip formatter={(v: number) => formatCompact(v, 'currency')} />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke={COLORS.cash} fill="url(#gTreat)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={trend} margin={{ left: -8, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Legend iconType="circle" />
                <Bar dataKey="treatments" name="Treatments" fill={COLORS.insurance} radius={[4, 4, 0, 0]} />
                <Bar dataKey="occupancyPct" name="Occupancy %" fill={COLORS.cash} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

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

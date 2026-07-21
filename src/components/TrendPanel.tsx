import { X } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Card from './Card'
import type { Kpi } from '../types'
import { getMetricTrend } from '../data/mockData'
import { COLORS } from '../lib/colors'
import { formatCompact } from '../lib/format'

interface Props {
  metric: Pick<Kpi, 'id' | 'label' | 'value' | 'format'>
  onClose: () => void
}

/** Trend-over-time panel shown when any KPI block is clicked. */
export default function TrendPanel({ metric, onClose }: Props) {
  const data = getMetricTrend(metric.id, metric.value)
  return (
    <Card
      title={`${metric.label} · trend over time`}
      subtitle="Last 6 months"
      action={
        <button
          onClick={onClose}
          className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>
      }
    >
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ left: -8, right: 8, top: 8 }}>
          <defs>
            <linearGradient id={`gTrend-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={COLORS.cash} stopOpacity={0.35} />
              <stop offset="95%" stopColor={COLORS.cash} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fontSize: 12, fill: '#94a3b8' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatCompact(v, metric.format)}
          />
          <Tooltip formatter={(v: number) => [formatCompact(v, metric.format), metric.label]} />
          <Area type="monotone" dataKey="value" stroke={COLORS.cash} fill={`url(#gTrend-${metric.id})`} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}

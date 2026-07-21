import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react'
import type { Kpi } from '../types'
import { formatValue } from '../lib/format'

interface Props {
  kpi: Kpi
  /** when provided, the card is clickable (e.g. opens a trend view) */
  onClick?: () => void
  active?: boolean
}

export default function KpiCard({ kpi, onClick, active }: Props) {
  // A delta is "good" if it goes up when we want up, or down when we want down.
  const positiveIsGood = !kpi.lowerIsBetter
  const isGood =
    kpi.trend === 'flat'
      ? true
      : positiveIsGood
        ? kpi.deltaPct >= 0
        : kpi.deltaPct <= 0

  const toneClass = isGood ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'
  const Icon =
    kpi.trend === 'up' ? ArrowUpRight : kpi.trend === 'down' ? ArrowDownRight : Minus

  const interactive = onClick
    ? 'cursor-pointer hover:border-brand-400 ' + (active ? 'border-brand-500 ring-2 ring-brand-100' : '')
    : ''

  return (
    <div
      onClick={onClick}
      className={`group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:shadow-md ${interactive}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-slate-500">{kpi.label}</p>
        <span
          className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold ${toneClass}`}
          title="Change vs previous period"
        >
          <Icon className="h-3 w-3" />
          {Math.abs(kpi.deltaPct).toFixed(1)}%
        </span>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-ink-900">
        {formatValue(kpi.value, kpi.format)}
      </p>
      {kpi.hint && <p className="mt-1 text-xs text-slate-400">{kpi.hint}</p>}
    </div>
  )
}

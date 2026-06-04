import { Calendar, CreditCard } from 'lucide-react'
import type { PaymentType, Period, Timeframe } from '../types'
import { PAYMENT_LABELS, TIMEFRAME_LABELS } from '../data/mockData'

interface Props {
  title: string
  subtitle: string
  period: Period
  payment: PaymentType
  onPeriod: (p: Period) => void
  onPayment: (p: PaymentType) => void
  /** which filters apply to the current page */
  showPeriod?: boolean
  showPayment?: boolean
}

const TIMEFRAMES: Timeframe[] = ['today', 'week', 'month', 'quarter', 'ytd']
const PAYMENTS: PaymentType[] = ['all', 'cash', 'insurance']

// A sensible default custom range: the last 30 days.
function defaultRange(): { from: string; to: string } {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 29)
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { from: iso(from), to: iso(to) }
}

const chip = (active: boolean) =>
  `rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
    active ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
  }`

export default function Header({
  title,
  subtitle,
  period,
  payment,
  onPeriod,
  onPayment,
  showPeriod = true,
  showPayment = true,
}: Props) {
  const isCustom = period.kind === 'custom'

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-6 py-3 backdrop-blur">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {/* Title — mr-auto pushes all controls to the right edge */}
        <div className="mr-auto min-w-0">
          <h1 className="truncate text-lg font-bold leading-tight text-ink-900">{title}</h1>
          <p className="truncate text-xs text-slate-400">{subtitle}</p>
        </div>

        {/* Payment filter */}
        {showPayment && (
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            <CreditCard className="ml-1 h-4 w-4 shrink-0 text-slate-400" />
            {PAYMENTS.map((p) => (
              <button key={p} onClick={() => onPayment(p)} className={chip(payment === p)}>
                {PAYMENT_LABELS[p]}
              </button>
            ))}
          </div>
        )}

        {/* Time filter: presets + custom */}
        {showPeriod && (
          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
            <Calendar className="ml-1 h-4 w-4 shrink-0 text-slate-400" />
            {TIMEFRAMES.map((t) => (
              <button
                key={t}
                onClick={() => onPeriod({ kind: 'preset', preset: t })}
                className={chip(period.kind === 'preset' && period.preset === t)}
              >
                {TIMEFRAME_LABELS[t]}
              </button>
            ))}
            <button
              onClick={() => onPeriod({ kind: 'custom', range: defaultRange() })}
              className={chip(isCustom)}
            >
              Custom
            </button>
          </div>
        )}

        {/* Exact date-range inputs — inline, only when "Custom" is active */}
        {showPeriod && isCustom && (
          <div className="flex items-center gap-1.5 rounded-xl border border-brand-200 bg-brand-50/50 px-2 py-1">
            <input
              type="date"
              value={period.range.from}
              max={period.range.to}
              onChange={(e) =>
                onPeriod({ kind: 'custom', range: { ...period.range, from: e.target.value } })
              }
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-ink-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <span className="text-xs text-slate-400">→</span>
            <input
              type="date"
              value={period.range.to}
              min={period.range.from}
              onChange={(e) =>
                onPeriod({ kind: 'custom', range: { ...period.range, to: e.target.value } })
              }
              className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-ink-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        )}
      </div>
    </header>
  )
}

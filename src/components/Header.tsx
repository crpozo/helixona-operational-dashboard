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
}

const TIMEFRAMES: Timeframe[] = ['week', 'month', 'quarter', 'ytd']
const PAYMENTS: PaymentType[] = ['all', 'cash', 'insurance']

// A sensible default custom range: the last 30 days.
function defaultRange(): { from: string; to: string } {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 29)
  const iso = (d: Date) => d.toISOString().slice(0, 10)
  return { from: iso(from), to: iso(to) }
}

export default function Header({
  title,
  subtitle,
  period,
  payment,
  onPeriod,
  onPayment,
}: Props) {
  const isCustom = period.kind === 'custom'

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-ink-900">{title}</h1>
          <p className="text-sm text-slate-400">{subtitle}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Payment filter: cash / insurance / all */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
            <CreditCard className="ml-1.5 h-4 w-4 text-slate-400" />
            {PAYMENTS.map((p) => (
              <button
                key={p}
                onClick={() => onPayment(p)}
                className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                  payment === p
                    ? 'bg-white text-brand-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {PAYMENT_LABELS[p]}
              </button>
            ))}
          </div>

          {/* Time filter: presets + custom range */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
            <Calendar className="ml-1.5 h-4 w-4 text-slate-400" />
            {TIMEFRAMES.map((t) => {
              const active = period.kind === 'preset' && period.preset === t
              return (
                <button
                  key={t}
                  onClick={() => onPeriod({ kind: 'preset', preset: t })}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                    active
                      ? 'bg-white text-brand-700 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {TIMEFRAME_LABELS[t]}
                </button>
              )
            })}
            <button
              onClick={() => onPeriod({ kind: 'custom', range: defaultRange() })}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                isCustom
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Custom
            </button>
          </div>
        </div>
      </div>

      {/* Exact date-range inputs (only when "Custom" is active) */}
      {isCustom && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-xs font-medium text-slate-400">Date range</span>
          <input
            type="date"
            value={period.range.from}
            max={period.range.to}
            onChange={(e) =>
              onPeriod({ kind: 'custom', range: { ...period.range, from: e.target.value } })
            }
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-ink-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
          <span className="text-slate-400">→</span>
          <input
            type="date"
            value={period.range.to}
            min={period.range.from}
            onChange={(e) =>
              onPeriod({ kind: 'custom', range: { ...period.range, to: e.target.value } })
            }
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-ink-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
      )}
    </header>
  )
}

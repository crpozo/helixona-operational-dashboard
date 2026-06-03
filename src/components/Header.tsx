import { Calendar, CreditCard } from 'lucide-react'
import type { PaymentType, Timeframe } from '../types'
import { PAYMENT_LABELS, TIMEFRAME_LABELS } from '../data/mockData'

interface Props {
  title: string
  subtitle: string
  timeframe: Timeframe
  payment: PaymentType
  onTimeframe: (t: Timeframe) => void
  onPayment: (p: PaymentType) => void
}

const TIMEFRAMES: Timeframe[] = ['week', 'month', 'quarter', 'ytd']
const PAYMENTS: PaymentType[] = ['all', 'cash', 'insurance']

export default function Header({
  title,
  subtitle,
  timeframe,
  payment,
  onTimeframe,
  onPayment,
}: Props) {
  return (
    <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur">
      <div>
        <h1 className="text-lg font-bold text-ink-900">{title}</h1>
        <p className="text-sm text-slate-400">{subtitle}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Filtro de pago: cash / insurance / todo */}
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

        {/* Filtro de tiempo */}
        <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
          <Calendar className="ml-1.5 h-4 w-4 text-slate-400" />
          {TIMEFRAMES.map((t) => (
            <button
              key={t}
              onClick={() => onTimeframe(t)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                timeframe === t
                  ? 'bg-white text-brand-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {TIMEFRAME_LABELS[t]}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}

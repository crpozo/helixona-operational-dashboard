import { useMemo, useState } from 'react'
import {
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
import { Download } from 'lucide-react'
import Card from '../components/Card'
import KpiCard from '../components/KpiCard'
import {
  getBillingTrend,
  getClaimsByPayer,
  getDenials,
  getInsuranceKpis,
} from '../data/mockData'
import { CATEGORICAL, COLORS } from '../lib/colors'
import { formatCompact, formatValue } from '../lib/format'
import { downloadCsv } from '../lib/csv'
import type { Kpi } from '../types'

type OwedBasis = 'billed' | 'allowable'

export default function Billing() {
  const payers = getClaimsByPayer()
  const [payerFilter, setPayerFilter] = useState<string>('All')
  const [basis, setBasis] = useState<OwedBasis>('billed')

  // Selected payer (null = All). Everything below reacts to this.
  const selected = payerFilter === 'All' ? null : payers.find((p) => p.payer === payerFilter) ?? null
  const totalBilled = payers.reduce((s, p) => s + p.billed, 0)
  const share = selected ? selected.billed / totalBilled : 1

  const kpis: Kpi[] = selected
    ? [
        { id: 'p-billed', label: 'Billed', value: selected.billed, format: 'currency', deltaPct: 0, trend: 'flat', hint: `${selected.payer} this period` },
        { id: 'p-claims', label: 'Claims', value: selected.claims, format: 'number', deltaPct: 0, trend: 'flat', hint: 'Submitted' },
        { id: 'p-paid', label: 'Paid', value: selected.paid, format: 'currency', deltaPct: 0, trend: 'flat', hint: 'Received' },
        { id: 'p-out', label: 'Outstanding', value: selected.outstanding, format: 'currency', deltaPct: 0, trend: 'flat', lowerIsBetter: true, hint: 'Owed (billed)' },
        { id: 'p-days', label: 'Avg days to pay', value: selected.avgDaysToPay, format: 'days', deltaPct: 0, trend: 'flat', lowerIsBetter: true, hint: `${selected.payer} cycle` },
        { id: 'p-denial', label: 'Denial rate', value: selected.denialRate, format: 'percent', deltaPct: 0, trend: 'flat', lowerIsBetter: true, hint: 'Claims denied' },
      ]
    : getInsuranceKpis()

  const trend = getBillingTrend().map((t) => ({
    label: t.label,
    billed: Math.round(t.billed * share),
    collected: Math.round(t.collected * share),
  }))
  const denials = getDenials().map((d) => ({ ...d, denials: Math.max(1, Math.round(d.denials * share)) }))

  // Revenue recognition: billed = estimate (not money yet); paid = real revenue (in caja).
  const agg = selected
    ? { billed: selected.billed, allowable: selected.allowable, paid: selected.paid }
    : payers.reduce(
        (a, p) => ({ billed: a.billed + p.billed, allowable: a.allowable + p.allowable, paid: a.paid + p.paid }),
        { billed: 0, allowable: 0, paid: 0 },
      )
  const estimated = agg.billed
  const expected = agg.allowable
  const collected = agg.paid
  const atRisk = Math.max(0, agg.allowable - agg.paid)

  const owed = (p: (typeof payers)[number]) =>
    basis === 'billed' ? p.outstanding : Math.max(0, p.allowable - p.paid)

  const rows = useMemo(
    () => (payerFilter === 'All' ? payers : payers.filter((p) => p.payer === payerFilter)),
    [payers, payerFilter],
  )
  const totalOwed = rows.reduce((s, p) => s + owed(p), 0)

  const exportClaims = () =>
    downloadCsv(
      'claims-by-payer.csv',
      ['Payer', 'Claims', 'Billed', 'Allowable', 'Paid', `Owed (${basis})`, 'Avg days to pay', 'Denial %'],
      rows.map((p) => [p.payer, p.claims, p.billed, p.allowable, p.paid, owed(p), p.avgDaysToPay, p.denialRate]),
    )

  return (
    <div className="space-y-6">
      {/* Payer filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-400">Filter by insurance:</span>
        {['All', ...payers.map((p) => p.payer)].map((p) => (
          <button
            key={p}
            onClick={() => setPayerFilter(p)}
            className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
              payerFilter === p
                ? 'border-brand-500 bg-brand-500 text-ink-900'
                : 'border-slate-200 bg-white text-slate-500 hover:border-brand-400'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Revenue recognition — estimated (billed) vs real revenue (collected/in caja) */}
      <div>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-700">Estimated (billed)</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-amber-800">{formatValue(estimated, 'currency')}</p>
            <p className="mt-1 text-[11px] text-amber-700/80">Submitted to insurers — not money yet</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Expected (allowable)</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-ink-900">{formatValue(expected, 'currency')}</p>
            <p className="mt-1 text-[11px] text-slate-400">Contracted amount likely to be paid</p>
          </div>
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-sm font-medium text-emerald-700">Revenue (collected · in caja)</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-emerald-800">{formatValue(collected, 'currency')}</p>
            <p className="mt-1 text-[11px] text-emerald-700/80">Actually received — recognized revenue</p>
          </div>
          <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
            <p className="text-sm font-medium text-rose-700">At risk · outstanding</p>
            <p className="mt-1 text-2xl font-bold tabular-nums text-rose-800">{formatValue(atRisk, 'currency')}</p>
            <p className="mt-1 text-[11px] text-rose-700/80">Pending — can be denied or clawed back</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Only collected money counts as revenue. Billed amounts are an estimate — insurers can deny, delay,
          or claw back payments until it's in the bank.
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <KpiCard key={k.id} kpi={k} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Billed vs collected MoM */}
        <Card title="Billed vs collected" subtitle={`Month over month · ${selected ? selected.payer : 'All payers'}`} className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={trend} margin={{ left: -16, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip formatter={(v: number) => formatCompact(v, 'currency')} />
              <Legend iconType="circle" />
              <Bar dataKey="billed" name="Billed" fill={COLORS.cash} radius={[4, 4, 0, 0]} />
              <Bar dataKey="collected" name="Collected" fill={COLORS.insurance} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Denials by category */}
        <Card title="Denials by category" subtitle="Count and avg delay (days)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={denials} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip formatter={(v: number, n) => [n === 'denials' ? `${v} denials` : `${v} days`, n === 'denials' ? 'Denials' : 'Avg delay']} />
              <Bar dataKey="denials" radius={[0, 4, 4, 0]} barSize={14}>
                {denials.map((_, i) => (
                  <Cell key={i} fill={CATEGORICAL[i % CATEGORICAL.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Claims by payer */}
      <Card
        title="Claims by payer"
        subtitle={`Owed to clinic: ${formatValue(totalOwed, 'currency')} (${basis})`}
        action={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              {(['billed', 'allowable'] as OwedBasis[]).map((b) => (
                <button
                  key={b}
                  onClick={() => setBasis(b)}
                  className={`rounded-md px-2 py-1 text-xs font-semibold capitalize transition ${
                    basis === b ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
            <button
              onClick={exportClaims}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
            >
              <Download className="h-3.5 w-3.5" />
              Export
            </button>
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-semibold">Payer</th>
                <th className="pb-2 text-right font-semibold">Claims</th>
                <th className="pb-2 text-right font-semibold">Billed</th>
                <th className="pb-2 text-right font-semibold">Allowable</th>
                <th className="pb-2 text-right font-semibold">Paid</th>
                <th className="pb-2 text-right font-semibold">Owed ({basis})</th>
                <th className="pb-2 text-right font-semibold">Avg days to pay</th>
                <th className="pb-2 text-right font-semibold">Denial %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.payer} className="border-b border-slate-100 last:border-0">
                  <td className="py-2.5 font-medium text-ink-900">{p.payer}</td>
                  <td className="py-2.5 text-right tabular-nums text-slate-600">{p.claims}</td>
                  <td className="py-2.5 text-right tabular-nums text-slate-600">{formatValue(p.billed, 'currency')}</td>
                  <td className="py-2.5 text-right tabular-nums text-slate-600">{formatValue(p.allowable, 'currency')}</td>
                  <td className="py-2.5 text-right tabular-nums text-slate-600">{formatValue(p.paid, 'currency')}</td>
                  <td className="py-2.5 text-right tabular-nums font-semibold text-ink-900">{formatValue(owed(p), 'currency')}</td>
                  <td className={`py-2.5 text-right tabular-nums ${p.avgDaysToPay >= 90 ? 'font-semibold text-rose-600' : 'text-slate-600'}`}>
                    {p.avgDaysToPay}d
                  </td>
                  <td className={`py-2.5 text-right tabular-nums ${p.denialRate >= 12 ? 'font-semibold text-rose-600' : 'text-slate-600'}`}>
                    {p.denialRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

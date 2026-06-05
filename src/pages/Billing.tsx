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

type OwedBasis = 'billed' | 'allowable'

export default function Billing() {
  const kpis = getInsuranceKpis()
  const payers = getClaimsByPayer()
  const denials = getDenials()
  const trend = getBillingTrend()

  const [payerFilter, setPayerFilter] = useState<string>('All')
  const [basis, setBasis] = useState<OwedBasis>('billed')

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
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <KpiCard key={k.id} kpi={k} />
        ))}
      </div>

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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Billed vs collected MoM */}
        <Card title="Billed vs collected" subtitle="Month over month" className="lg:col-span-2">
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

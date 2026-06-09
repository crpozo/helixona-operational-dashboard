import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Download } from 'lucide-react'
import Card from '../components/Card'
import type { PaymentType } from '../types'
import {
  getModalityBreakdown,
  getRevenueSummary,
  getRevenueTrend,
  type RevenueMode,
} from '../data/mockData'
import { CATEGORICAL, COLORS } from '../lib/colors'
import { formatCompact, formatValue } from '../lib/format'
import { downloadCsv } from '../lib/csv'

interface Props {
  scale: number
  payment: PaymentType
}

export default function Revenue({ scale, payment }: Props) {
  const [mode, setMode] = useState<RevenueMode>('estimated')
  const summary = getRevenueSummary(payment)
  const trend = getRevenueTrend(payment, mode)
  const modalities = getModalityBreakdown(scale, payment)

  const totalCash = trend.reduce((s, p) => s + p.cash, 0)
  const totalIns = trend.reduce((s, p) => s + p.insurance, 0)
  const mix = [
    { name: 'Cash', value: totalCash, color: COLORS.cash },
    { name: 'Insurance', value: totalIns, color: COLORS.insurance },
  ].filter((m) => m.value > 0)

  const tiles = [
    { label: 'Estimated revenue (gross)', value: summary.estimated, hint: 'Billed — not money yet' },
    { label: 'Revenue (collected)', value: summary.collected, hint: 'In the bank — recognized' },
    { label: 'Collection rate', value: summary.collectionRate, hint: 'Collected ÷ estimated', pct: true },
    { label: 'Collected today', value: summary.collectedToday, hint: 'In the bank today' },
  ]

  const exportModalities = () =>
    downloadCsv(
      'revenue-by-modality.csv',
      ['Modality', 'Patients', 'Revenue', 'Revenue per patient'],
      modalities.map((m) => [m.modality, m.patients, m.revenue, m.patients ? Math.round(m.revenue / m.patients) : 0]),
    )

  return (
    <div className="space-y-6">
      {/* Estimated vs collected summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{t.label}</p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-ink-900">
              {t.pct ? `${t.value}%` : formatValue(t.value, 'currency')}
            </p>
            <p className="mt-1 text-xs text-slate-400">{t.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card
          title="Monthly revenue"
          subtitle={mode === 'estimated' ? 'Estimated / billed (gross)' : 'Collected (received)'}
          className="lg:col-span-2"
          action={
            <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              {(['estimated', 'collected'] as RevenueMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold capitalize transition ${
                    mode === m ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trend} margin={{ left: -16, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
              <Tooltip formatter={(v: number) => formatCompact(v, 'currency')} />
              <Legend iconType="circle" />
              <Bar dataKey="cash" name="Cash" stackId="r" fill={COLORS.cash} />
              <Bar dataKey="insurance" name="Insurance" stackId="r" fill={COLORS.insurance} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Payment mix" subtitle={`Cash vs Insurance · ${mode}`}>
          {mix.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={mix} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {mix.map((m) => (
                      <Cell key={m.name} fill={m.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCompact(v, 'currency')} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 space-y-1.5">
                {mix.map((m) => (
                  <div key={m.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: m.color }} />
                      {m.name}
                    </span>
                    <span className="font-semibold tabular-nums text-ink-900">{formatValue(m.value, 'currency')}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">No data for this filter.</p>
          )}
        </Card>
      </div>

      <Card
        title="Revenue and patients by modality"
        subtitle="Period detail"
        action={
          <button
            onClick={exportModalities}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-semibold">Modality</th>
                <th className="pb-2 text-right font-semibold">Patients</th>
                <th className="pb-2 text-right font-semibold">Revenue</th>
                <th className="pb-2 text-right font-semibold">Rev / patient</th>
                <th className="pb-2 pl-4 font-semibold">Share</th>
              </tr>
            </thead>
            <tbody>
              {modalities.map((m, i) => {
                const totalRev = modalities.reduce((s, x) => s + x.revenue, 0)
                const share = totalRev ? Math.round((m.revenue / totalRev) * 100) : 0
                return (
                  <tr key={m.modality} className="border-b border-slate-100 last:border-0">
                    <td className="py-2.5 font-medium text-ink-900">{m.modality}</td>
                    <td className="py-2.5 text-right tabular-nums text-slate-600">{m.patients.toLocaleString()}</td>
                    <td className="py-2.5 text-right tabular-nums font-semibold text-ink-900">{formatValue(m.revenue, 'currency')}</td>
                    <td className="py-2.5 text-right tabular-nums text-slate-600">{formatValue(m.patients ? m.revenue / m.patients : 0, 'currency')}</td>
                    <td className="py-2.5 pl-4">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                          <div className="h-full rounded-full" style={{ width: `${share}%`, background: CATEGORICAL[i % CATEGORICAL.length] }} />
                        </div>
                        <span className="w-8 text-right text-xs tabular-nums text-slate-500">{share}%</span>
                      </div>
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

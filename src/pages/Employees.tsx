import { Fragment, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, Download, Search } from 'lucide-react'
import Card from '../components/Card'
import type { Employee } from '../types'
import { getEmployees } from '../data/mockData'
import { formatValue } from '../lib/format'
import { downloadCsv } from '../lib/csv'
import type { PaymentType } from '../types'

interface Props {
  scale: number
  payment: PaymentType
}

type SortKey = 'name' | 'role' | 'revenue' | 'utilizationPct'

const ROLE_FILTERS = ['All', 'Front Desk', 'Medical Assistant', 'PCC', 'Nurse', 'Medic'] as const

function utilTone(pct: number): string {
  if (pct >= 90) return 'text-emerald-600'
  if (pct >= 80) return 'text-amber-600'
  return 'text-rose-600'
}

export default function Employees({ scale, payment }: Props) {
  const employees = getEmployees(scale, payment)

  const [query, setQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<(typeof ROLE_FILTERS)[number]>('All')
  const [sortKey, setSortKey] = useState<SortKey>('revenue')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [expanded, setExpanded] = useState<string | null>(null)

  const rows = useMemo(() => {
    let list = employees.filter((e) => {
      const matchesQuery =
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.role.toLowerCase().includes(query.toLowerCase())
      const matchesRole = roleFilter === 'All' || e.role === roleFilter
      return matchesQuery && matchesRole
    })
    list = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name' || sortKey === 'role') cmp = a[sortKey].localeCompare(b[sortKey])
      else cmp = a[sortKey] - b[sortKey]
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [employees, query, roleFilter, sortKey, sortDir])

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(key === 'name' || key === 'role' ? 'asc' : 'desc')
    }
  }

  const totalRevenue = rows.reduce((s, e) => s + e.revenue, 0)
  const avgUtil = rows.length ? Math.round(rows.reduce((s, e) => s + e.utilizationPct, 0) / rows.length) : 0
  const topPerformer = rows.reduce<Employee | null>((top, e) => (!top || e.revenue > top.revenue ? e : top), null)

  const exportCsv = () =>
    downloadCsv(
      'employee-metrics.csv',
      ['Name', 'Role', 'Revenue', 'Utilization %'],
      rows.map((e) => [e.name, e.role, e.revenue, e.utilizationPct]),
    )

  const SortHeader = ({ label, k, align = 'left' }: { label: string; k: SortKey; align?: 'left' | 'right' }) => (
    <th className={`pb-2 font-semibold ${align === 'right' ? 'text-right' : ''}`}>
      <button
        onClick={() => toggleSort(k)}
        className={`inline-flex items-center gap-1 hover:text-slate-700 ${align === 'right' ? 'flex-row-reverse' : ''}`}
      >
        {label}
        {sortKey === k &&
          (sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  )

  return (
    <div className="space-y-6">
      {/* Summary tiles */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Employees shown</p>
          <p className="mt-2 text-3xl font-bold text-ink-900">{rows.length}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Attributed revenue</p>
          <p className="mt-2 text-3xl font-bold text-ink-900">{formatValue(totalRevenue, 'currency')}</p>
          <p className="mt-1 text-xs text-slate-400">Avg utilization {avgUtil}%</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Top performer</p>
          <p className="mt-2 text-xl font-bold text-ink-900">{topPerformer?.name ?? '—'}</p>
          <p className="mt-1 text-xs text-slate-400">
            {topPerformer ? `${formatValue(topPerformer.revenue, 'currency')} · ${topPerformer.role}` : ''}
          </p>
        </div>
      </div>

      <Card
        title="Per-employee metrics"
        subtitle="Search, sort, and click a row for detail"
        action={
          <button
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
        }
      >
        {/* Controls */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or role…"
              className="w-56 rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-sm text-ink-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {ROLE_FILTERS.map((rf) => (
              <button
                key={rf}
                onClick={() => setRoleFilter(rf)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                  roleFilter === rf
                    ? 'border-brand-500 bg-brand-500 text-ink-900'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-brand-400'
                }`}
              >
                {rf}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <SortHeader label="Employee" k="name" />
                <SortHeader label="Role" k="role" />
                <SortHeader label="Revenue" k="revenue" align="right" />
                <SortHeader label="Utilization" k="utilizationPct" align="right" />
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => {
                const isOpen = expanded === e.id
                return (
                  <Fragment key={e.id}>
                    <tr
                      onClick={() => setExpanded(isOpen ? null : e.id)}
                      className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50"
                    >
                      <td className="py-2.5 font-medium text-ink-900">{e.name}</td>
                      <td className="py-2.5 text-slate-600">{e.role}</td>
                      <td className="py-2.5 text-right tabular-nums font-semibold text-ink-900">
                        {formatValue(e.revenue, 'currency')}
                      </td>
                      <td className={`py-2.5 text-right tabular-nums font-semibold ${utilTone(e.utilizationPct)}`}>
                        {e.utilizationPct}%
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-b border-slate-100 bg-slate-50/60">
                        <td colSpan={4} className="px-2 py-3">
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {e.metrics.map((m) => (
                              <div key={m.label} className="rounded-lg border border-slate-200 bg-white p-2.5">
                                <p className="text-[11px] text-slate-400">{m.label}</p>
                                <p className="mt-0.5 text-sm font-bold text-ink-900">
                                  {formatValue(m.value, m.format)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-10 text-center text-sm text-slate-400">
                    No employees match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

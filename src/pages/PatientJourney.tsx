import { Fragment, useMemo, useState } from 'react'
import { Calendar, Check, Mail, Phone, Search, User } from 'lucide-react'
import Card from '../components/Card'
import type { PatientRecord } from '../types'
import { getPatients, PATIENT_STAGES } from '../data/mockData'
import { formatValue } from '../lib/format'

const FILTERS = ['All', ...PATIENT_STAGES, 'Waitlist', 'Declined'] as const

function currentLabel(p: PatientRecord): string {
  if (p.status === 'active') return 'Active'
  if (p.status === 'waitlist') return 'Waitlist'
  if (p.status === 'declined') return 'Declined'
  return PATIENT_STAGES[p.stageIndex]
}

function statusChip(p: PatientRecord): string {
  if (p.status === 'active') return 'bg-emerald-50 text-emerald-700'
  if (p.status === 'waitlist') return 'bg-amber-50 text-amber-700'
  if (p.status === 'declined') return 'bg-rose-50 text-rose-700'
  return 'bg-brand-50 text-brand-700'
}

function fmtDate(iso?: string): string {
  if (!iso) return '—'
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function daysSince(iso: string): number {
  const ms = Date.now() - new Date(iso + 'T00:00:00').getTime()
  return Math.max(0, Math.round(ms / 86_400_000))
}

/** Horizontal lifecycle stepper for one patient. */
function StageTracker({ p }: { p: PatientRecord }) {
  const stalled = p.status === 'declined' || p.status === 'waitlist'
  return (
    <div className="flex items-start">
      {PATIENT_STAGES.map((stage, i) => {
        const done = i < p.stageIndex || (i === p.stageIndex && p.status === 'active')
        const current = i === p.stageIndex && p.status !== 'active'
        const reached = i <= p.stageIndex
        const circle = done
          ? 'bg-brand-500 text-ink-900 border-brand-500'
          : current
            ? stalled
              ? 'border-amber-400 text-amber-600 bg-amber-50'
              : 'border-brand-500 text-brand-700 bg-white'
            : 'border-slate-200 text-slate-300 bg-white'
        return (
          <div key={stage} className="flex flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <div className={`h-0.5 flex-1 ${i === 0 ? 'opacity-0' : reached ? 'bg-brand-400' : 'bg-slate-200'}`} />
              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${circle}`}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <div
                className={`h-0.5 flex-1 ${
                  i === PATIENT_STAGES.length - 1 ? 'opacity-0' : i < p.stageIndex ? 'bg-brand-400' : 'bg-slate-200'
                }`}
              />
            </div>
            <p className={`mt-1.5 text-[11px] font-medium ${reached ? 'text-ink-900' : 'text-slate-400'}`}>
              {stage}
            </p>
            <p className="text-[10px] text-slate-400">{fmtDate(p.stageDates[i])}</p>
          </div>
        )
      })}
    </div>
  )
}

function PatientDetail({ p }: { p: PatientRecord }) {
  return (
    <div className="space-y-4 px-2 py-3">
      <StageTracker p={p} />

      {p.status === 'declined' && (
        <div className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2 text-sm">
          <span className="font-semibold text-rose-700">Declined · </span>
          <span className="text-rose-700">{p.declineReason ?? 'No reason recorded'}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Modality', value: p.modality },
          { label: 'Coordinator', value: p.coordinator },
          { label: 'Lead source', value: p.source },
          { label: 'Revenue to date', value: formatValue(p.revenue, 'currency') },
          { label: 'In pipeline', value: `${daysSince(p.createdAt)} days` },
          { label: 'Next appointment', value: fmtDate(p.nextAppt) },
        ].map((f) => (
          <div key={f.label} className="rounded-lg border border-slate-200 bg-white p-2.5">
            <p className="text-[11px] text-slate-400">{f.label}</p>
            <p className="mt-0.5 text-sm font-semibold text-ink-900">{f.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{p.phone}</span>
        <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{p.email}</span>
      </div>
    </div>
  )
}

export default function PatientJourney() {
  const patients = getPatients()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All')
  const [open, setOpen] = useState<string | null>(null)

  const rows = useMemo(() => {
    return patients.filter((p) => {
      const q = query.toLowerCase()
      const matchesQuery =
        p.name.toLowerCase().includes(q) ||
        p.modality.toLowerCase().includes(q) ||
        p.coordinator.toLowerCase().includes(q)
      const matchesFilter = filter === 'All' || currentLabel(p) === filter
      return matchesQuery && matchesFilter
    })
  }, [patients, query, filter])

  const counts = {
    active: patients.filter((p) => p.status === 'active').length,
    pipeline: patients.filter((p) => p.status === 'on-track').length,
    waitlist: patients.filter((p) => p.status === 'waitlist').length,
    declined: patients.filter((p) => p.status === 'declined').length,
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-3xl font-bold tabular-nums text-emerald-700">{counts.active}</p>
          <p className="mt-1 text-sm font-medium text-emerald-700">Active</p>
        </div>
        <div className="rounded-2xl border border-brand-100 bg-brand-50 p-4">
          <p className="text-3xl font-bold tabular-nums text-brand-700">{counts.pipeline}</p>
          <p className="mt-1 text-sm font-medium text-brand-700">In pipeline</p>
        </div>
        <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
          <p className="text-3xl font-bold tabular-nums text-amber-700">{counts.waitlist}</p>
          <p className="mt-1 text-sm font-medium text-amber-700">Waitlist</p>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4">
          <p className="text-3xl font-bold tabular-nums text-rose-700">{counts.declined}</p>
          <p className="mt-1 text-sm font-medium text-rose-700">Declined</p>
        </div>
      </div>

      <Card title="Patients" subtitle="Click a patient to see their journey and current stage">
        {/* Controls */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search patient, modality, coordinator…"
              className="w-64 rounded-lg border border-slate-200 bg-white py-1.5 pl-8 pr-3 text-sm text-ink-900 outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                  filter === f
                    ? 'border-brand-500 bg-brand-500 text-ink-900'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-brand-400'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-semibold">Patient</th>
                <th className="pb-2 font-semibold">Current stage</th>
                <th className="pb-2 font-semibold">Modality</th>
                <th className="pb-2 font-semibold">Coordinator</th>
                <th className="pb-2 font-semibold">Next appt.</th>
                <th className="pb-2 text-right font-semibold">In pipeline</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => {
                const isOpen = open === p.id
                return (
                  <Fragment key={p.id}>
                    <tr
                      onClick={() => setOpen(isOpen ? null : p.id)}
                      className="cursor-pointer border-b border-slate-100 transition hover:bg-slate-50"
                    >
                      <td className="py-2.5">
                        <span className="flex items-center gap-2 font-medium text-ink-900">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                            <User className="h-4 w-4" />
                          </span>
                          {p.name}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusChip(p)}`}>
                          {currentLabel(p)}
                        </span>
                        {p.status === 'declined' && p.declineReason && (
                          <p className="mt-1 max-w-[200px] text-[11px] leading-tight text-rose-600">{p.declineReason}</p>
                        )}
                      </td>
                      <td className="py-2.5 text-slate-600">{p.modality}</td>
                      <td className="py-2.5 text-slate-600">{p.coordinator}</td>
                      <td className="py-2.5 text-slate-600">
                        {p.nextAppt ? (
                          <span className="inline-flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {fmtDate(p.nextAppt)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 text-right tabular-nums text-slate-600">{daysSince(p.createdAt)}d</td>
                    </tr>
                    {isOpen && (
                      <tr className="border-b border-slate-100 bg-slate-50/60">
                        <td colSpan={6}>
                          <PatientDetail p={p} />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-sm text-slate-400">
                    No patients match your filters.
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

import { useState } from 'react'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import Card from '../components/Card'
import type { Goal } from '../types'
import { getEmployees } from '../data/mockData'
import { formatValue } from '../lib/format'

interface Props {
  goals: Goal[]
  onGoalsChange: (goals: Goal[]) => void
}

const ROLE_OPTIONS = [
  'Provider',
  'Physician Associate',
  'New Patient Advisor',
  'Front Desk',
  'Medical Assistant',
  'Medic',
  'Nurse',
  'Billing',
  'Operations Manager',
  'Admin',
  'Executive',
]

// Placeholder permission matrix per role (until wired to a real backend).
const DEFAULT_PERMISSIONS: Record<string, { label: string; perms: Record<string, boolean> }> = {
  provider: { label: 'Provider', perms: { 'View dashboards': true, 'Edit patients': true, 'Unlocked notes': false, 'Edit employees & roles': false, 'Manage goals': false } },
  pa: { label: 'Physician Associate', perms: { 'View dashboards': true, 'Edit patients': true, 'Unlocked notes': false, 'Edit employees & roles': false, 'Manage goals': false } },
  newPatient: { label: 'New Patient Advisor', perms: { 'View dashboards': true, 'Edit patients': true, 'Unlocked notes': false, 'Edit employees & roles': false, 'Manage goals': false } },
  frontDesk: { label: 'Front Desk', perms: { 'View dashboards': true, 'Edit patients': false, 'Unlocked notes': false, 'Edit employees & roles': false, 'Manage goals': false } },
  ma: { label: 'Medical Assistant', perms: { 'View dashboards': true, 'Edit patients': true, 'Unlocked notes': false, 'Edit employees & roles': false, 'Manage goals': false } },
  medic: { label: 'Medic', perms: { 'View dashboards': true, 'Edit patients': true, 'Unlocked notes': true, 'Edit employees & roles': false, 'Manage goals': false } },
  nurse: { label: 'Nurse', perms: { 'View dashboards': true, 'Edit patients': true, 'Unlocked notes': false, 'Edit employees & roles': false, 'Manage goals': false } },
  billing: { label: 'Billing', perms: { 'View dashboards': true, 'Edit patients': false, 'Unlocked notes': false, 'Edit employees & roles': false, 'Manage goals': false } },
  ops: { label: 'Operations Manager', perms: { 'View dashboards': true, 'Edit patients': false, 'Unlocked notes': false, 'Edit employees & roles': false, 'Manage goals': true } },
  admin: { label: 'Admin', perms: { 'View dashboards': true, 'Edit patients': true, 'Unlocked notes': false, 'Edit employees & roles': true, 'Manage goals': true } },
  exec: { label: 'Executive', perms: { 'View dashboards': true, 'Edit patients': false, 'Unlocked notes': false, 'Edit employees & roles': false, 'Manage goals': true } },
}

const PERM_COLUMNS = ['View dashboards', 'Edit patients', 'Unlocked notes', 'Edit employees & roles', 'Manage goals']

export default function Admin({ goals, onGoalsChange }: Props) {
  // ----- Goals -----
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [draft, setDraft] = useState({ label: '', area: '', value: '', target: '', lowerIsBetter: false })

  const addGoal = () => {
    const value = Number(draft.value)
    const target = Number(draft.target)
    if (!draft.label.trim() || !Number.isFinite(value) || !Number.isFinite(target) || target <= 0) return
    onGoalsChange([
      ...goals,
      {
        id: `custom-${Date.now()}`,
        label: draft.label.trim(),
        area: draft.area.trim() || 'Company',
        value,
        target,
        format: 'number',
        lowerIsBetter: draft.lowerIsBetter,
      },
    ])
    setDraft({ label: '', area: '', value: '', target: '', lowerIsBetter: false })
    setShowGoalForm(false)
  }

  const deleteGoal = (id: string) => onGoalsChange(goals.filter((g) => g.id !== id))

  // ----- Employees (placeholder local editing) -----
  const [employees, setEmployees] = useState(() => getEmployees(1))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [edit, setEdit] = useState({ name: '', role: '' })

  const startEdit = (id: string, name: string, role: string) => {
    setEditingId(id)
    setEdit({ name, role })
  }
  const saveEdit = () => {
    setEmployees((list) =>
      list.map((e) => (e.id === editingId ? { ...e, name: edit.name.trim() || e.name, role: edit.role } : e)),
    )
    setEditingId(null)
  }

  // ----- Roles & permissions (placeholder toggles) -----
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS)
  const togglePerm = (roleId: string, perm: string) =>
    setPermissions((p) => ({
      ...p,
      [roleId]: { ...p[roleId], perms: { ...p[roleId].perms, [perm]: !p[roleId].perms[perm] } },
    }))

  return (
    <div className="space-y-6">
      <p className="text-xs text-slate-400">
        Changes here are placeholder (in-memory) until the admin portal is connected to a backend.
      </p>

      {/* ------------------------------------------------ Company goals ----- */}
      <Card
        title="Company goals"
        subtitle="Goals drive the alerts on the Executive overview"
        action={
          <button
            onClick={() => setShowGoalForm((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
          >
            <Plus className="h-3.5 w-3.5" />
            Add goal
          </button>
        }
      >
        {showGoalForm && (
          <div className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-brand-200 bg-brand-50/50 p-3">
            <div>
              <p className="mb-1 text-[11px] font-medium text-slate-500">Goal name</p>
              <input
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                placeholder="e.g. EBOOs per month"
                className="w-44 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <p className="mb-1 text-[11px] font-medium text-slate-500">Area</p>
              <input
                value={draft.area}
                onChange={(e) => setDraft({ ...draft, area: e.target.value })}
                placeholder="e.g. Nurses"
                className="w-28 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <p className="mb-1 text-[11px] font-medium text-slate-500">Current</p>
              <input
                value={draft.value}
                onChange={(e) => setDraft({ ...draft, value: e.target.value })}
                placeholder="0"
                inputMode="numeric"
                className="w-20 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
              />
            </div>
            <div>
              <p className="mb-1 text-[11px] font-medium text-slate-500">Target</p>
              <input
                value={draft.target}
                onChange={(e) => setDraft({ ...draft, target: e.target.value })}
                placeholder="100"
                inputMode="numeric"
                className="w-20 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-400"
              />
            </div>
            <label className="flex items-center gap-1.5 pb-1.5 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={draft.lowerIsBetter}
                onChange={(e) => setDraft({ ...draft, lowerIsBetter: e.target.checked })}
              />
              Lower is better
            </label>
            <button
              onClick={addGoal}
              className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-ink-900 transition hover:bg-brand-400"
            >
              Save goal
            </button>
          </div>
        )}

        <div className="space-y-2.5">
          {goals.map((g) => {
            const breached = g.lowerIsBetter ? g.value > g.target : g.value < g.target
            const pct = Math.min(100, Math.round((g.value / g.target) * 100))
            return (
              <div key={g.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-ink-900">
                      {g.label} <span className="text-xs font-normal text-slate-400">· {g.area}</span>
                    </span>
                    <span className={`shrink-0 text-xs font-semibold ${breached ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {breached ? 'Off target' : 'On track'}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div className={`h-full rounded-full ${breached ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400">
                    {formatValue(g.value, g.format)} / target {formatValue(g.target, g.format)}
                    {g.lowerIsBetter ? ' (lower is better)' : ''}
                  </p>
                </div>
                <button
                  onClick={() => deleteGoal(g.id)}
                  className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                  title="Delete goal"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )
          })}
          {goals.length === 0 && (
            <p className="py-8 text-center text-sm text-slate-400">No goals yet — add the first one above.</p>
          )}
        </div>
      </Card>

      {/* ------------------------------------------------ Employees --------- */}
      <Card title="Employees" subtitle="Edit employee info (name and role)">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-semibold">Employee</th>
                <th className="pb-2 font-semibold">Role</th>
                <th className="pb-2 text-right font-semibold">Utilization</th>
                <th className="pb-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => {
                const isEditing = editingId === e.id
                return (
                  <tr key={e.id} className="border-b border-slate-100 last:border-0">
                    <td className="py-2">
                      {isEditing ? (
                        <input
                          value={edit.name}
                          onChange={(ev) => setEdit({ ...edit, name: ev.target.value })}
                          className="w-44 rounded-lg border border-brand-300 bg-white px-2 py-1 text-sm outline-none focus:border-brand-400"
                        />
                      ) : (
                        <span className="font-medium text-ink-900">{e.name}</span>
                      )}
                    </td>
                    <td className="py-2">
                      {isEditing ? (
                        <select
                          value={edit.role}
                          onChange={(ev) => setEdit({ ...edit, role: ev.target.value })}
                          className="rounded-lg border border-brand-300 bg-white px-2 py-1 text-sm outline-none focus:border-brand-400"
                        >
                          {ROLE_OPTIONS.map((r) => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-slate-600">{e.role}</span>
                      )}
                    </td>
                    <td className="py-2 text-right tabular-nums text-slate-600">{e.utilizationPct}%</td>
                    <td className="py-2 text-right">
                      {isEditing ? (
                        <span className="inline-flex gap-1">
                          <button onClick={saveEdit} className="rounded-lg p-1.5 text-emerald-600 transition hover:bg-emerald-50" title="Save">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => setEditingId(null)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100" title="Cancel">
                            <X className="h-4 w-4" />
                          </button>
                        </span>
                      ) : (
                        <button
                          onClick={() => startEdit(e.id, e.name, e.role)}
                          className="rounded-lg p-1.5 text-slate-400 transition hover:bg-brand-50 hover:text-brand-700"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ------------------------------------------------ Roles & permissions */}
      <Card title="Roles & permissions" subtitle="What each role can see and do">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-semibold">Role</th>
                {PERM_COLUMNS.map((p) => (
                  <th key={p} className="pb-2 text-center font-semibold">{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(permissions).map(([roleId, role]) => (
                <tr key={roleId} className="border-b border-slate-100 last:border-0">
                  <td className="py-2 font-medium text-ink-900">{role.label}</td>
                  {PERM_COLUMNS.map((p) => (
                    <td key={p} className="py-2 text-center">
                      <input
                        type="checkbox"
                        checked={role.perms[p]}
                        onChange={() => togglePerm(roleId, p)}
                        className="h-4 w-4 cursor-pointer accent-brand-600"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-slate-400">
          e.g. "Unlocked notes" is visible to Medics only; only Admin can edit Employees & Roles.
        </p>
      </Card>
    </div>
  )
}

import { useState } from 'react'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  ListChecks,
  Pencil,
  Plus,
  ShieldCheck,
  Target,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import Card from '../components/Card'
import type { Employee, Goal } from '../types'
import { getEmployees, getRoles } from '../data/mockData'
import { formatValue } from '../lib/format'

interface Props {
  goals: Goal[]
  onGoalsChange: (goals: Goal[]) => void
}

type Section = 'menu' | 'goals' | 'employees' | 'roles' | 'metrics'

const BASE_ROLE_OPTIONS = [
  'Provider',
  'Physician Associate',
  'PCC',
  'New Patient Advisor',
  'Front Desk',
  'Medical Assistant',
  'Medic',
  'Nurse',
  'Technician',
  'Lab Draws',
  'Billing',
  'Operations Manager',
  'Admin',
  'Executive',
]

const ROLE_TO_ID: Record<string, Employee['roleId']> = {
  Provider: 'provider',
  'Physician Associate': 'pa',
  PCC: 'pcc',
  'New Patient Advisor': 'newPatient',
  'Front Desk': 'frontDesk',
  'Medical Assistant': 'ma',
  Medic: 'medic',
  Nurse: 'nurse',
  Technician: 'technician',
  'Lab Draws': 'labs',
  Billing: 'billing',
  'Operations Manager': 'ops',
  Admin: 'admin',
  Executive: 'exec',
}

const PERM_COLUMNS = ['View dashboards', 'Edit patients', 'Unlocked notes', 'Edit employees & roles', 'Manage goals']

const newPerms = (overrides: Partial<Record<string, boolean>> = {}) => ({
  'View dashboards': true,
  'Edit patients': false,
  'Unlocked notes': false,
  'Edit employees & roles': false,
  'Manage goals': false,
  ...overrides,
})

const DEFAULT_PERMISSIONS: Record<string, { label: string; perms: Record<string, boolean> }> = {
  provider: { label: 'Provider', perms: newPerms({ 'Edit patients': true }) },
  bakman: { label: 'Provider (Dr. Bakman)', perms: newPerms({ 'Edit patients': true }) },
  pa: { label: 'Physician Associate', perms: newPerms({ 'Edit patients': true }) },
  pcc: { label: 'PCC', perms: newPerms({ 'Edit patients': true }) },
  newPatient: { label: 'New Patient Advisor', perms: newPerms({ 'Edit patients': true }) },
  frontDesk: { label: 'Front Desk', perms: newPerms() },
  ma: { label: 'Medical Assistant', perms: newPerms({ 'Edit patients': true }) },
  medic: { label: 'Medic', perms: newPerms({ 'Edit patients': true, 'Unlocked notes': true }) },
  nurse: { label: 'Nurse', perms: newPerms({ 'Edit patients': true }) },
  technician: { label: 'Technician', perms: newPerms() },
  labs: { label: 'Lab Draws', perms: newPerms() },
  billing: { label: 'Billing', perms: newPerms() },
  ops: { label: 'Operations Manager', perms: newPerms({ 'Manage goals': true }) },
  admin: { label: 'Admin', perms: newPerms({ 'Edit patients': true, 'Edit employees & roles': true, 'Manage goals': true }) },
  exec: { label: 'Executive', perms: newPerms({ 'Manage goals': true }) },
}

const inputCls =
  'rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100'

export default function Admin({ goals, onGoalsChange }: Props) {
  const [section, setSection] = useState<Section>('menu')

  // ----- Goals -----
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [draft, setDraft] = useState({ label: '', area: '', value: '', target: '', lowerIsBetter: false })
  const offTarget = goals.filter((g) => (g.lowerIsBetter ? g.value > g.target : g.value < g.target)).length

  const addGoal = () => {
    const value = Number(draft.value)
    const target = Number(draft.target)
    if (!draft.label.trim() || !Number.isFinite(value) || !Number.isFinite(target) || target <= 0) return
    onGoalsChange([
      ...goals,
      { id: `custom-${Date.now()}`, label: draft.label.trim(), area: draft.area.trim() || 'Company', value, target, format: 'number', lowerIsBetter: draft.lowerIsBetter },
    ])
    setDraft({ label: '', area: '', value: '', target: '', lowerIsBetter: false })
    setShowGoalForm(false)
  }
  const deleteGoal = (id: string) => onGoalsChange(goals.filter((g) => g.id !== id))

  // ----- Employees -----
  const [employees, setEmployees] = useState(() => getEmployees(1))
  const [editingId, setEditingId] = useState<string | null>(null)
  const [edit, setEdit] = useState({ name: '', role: '', utilization: '' })
  const [showEmpForm, setShowEmpForm] = useState(false)
  const [empDraft, setEmpDraft] = useState({ name: '', role: BASE_ROLE_OPTIONS[0], utilization: '' })

  const startEdit = (id: string, name: string, role: string, utilization: number) => {
    setEditingId(id)
    setEdit({ name, role, utilization: String(utilization) })
  }
  const saveEdit = () => {
    const util = Number(edit.utilization)
    setEmployees((list) =>
      list.map((e) =>
        e.id === editingId
          ? { ...e, name: edit.name.trim() || e.name, role: edit.role, roleId: ROLE_TO_ID[edit.role] ?? e.roleId, utilizationPct: Number.isFinite(util) ? Math.max(0, Math.min(100, util)) : e.utilizationPct }
          : e,
      ),
    )
    setEditingId(null)
  }
  const addEmployee = () => {
    if (!empDraft.name.trim()) return
    const util = Number(empDraft.utilization)
    setEmployees((list) => [
      ...list,
      { id: `emp-${Date.now()}`, name: empDraft.name.trim(), role: empDraft.role, roleId: ROLE_TO_ID[empDraft.role] ?? 'ma', utilizationPct: Number.isFinite(util) && empDraft.utilization !== '' ? Math.max(0, Math.min(100, util)) : 0, revenue: 0, metrics: [] },
    ])
    setEmpDraft({ name: '', role: BASE_ROLE_OPTIONS[0], utilization: '' })
    setShowEmpForm(false)
  }
  const deleteEmployee = (id: string) => setEmployees((list) => list.filter((e) => e.id !== id))

  // ----- Roles & permissions (add role, toggle, delete) -----
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS)
  const [newRole, setNewRole] = useState('')
  const togglePerm = (roleId: string, perm: string) =>
    setPermissions((p) => ({ ...p, [roleId]: { ...p[roleId], perms: { ...p[roleId].perms, [perm]: !p[roleId].perms[perm] } } }))
  const addRole = () => {
    const label = newRole.trim()
    if (!label) return
    const id = `role-${Date.now()}`
    setPermissions((p) => ({ ...p, [id]: { label, perms: newPerms() } }))
    setMetricsByRole((m) => ({ ...m, [id]: [] }))
    setNewRole('')
  }
  const deleteRole = (roleId: string) =>
    setPermissions((p) => {
      const next = { ...p }
      delete next[roleId]
      return next
    })

  // ----- Metrics by role -----
  const [metricsByRole, setMetricsByRole] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(getRoles(1).map((r) => [r.id, r.metrics.map((m) => m.label)])),
  )
  const [metricRole, setMetricRole] = useState<string>('provider')
  const [newMetric, setNewMetric] = useState('')
  const roleLabel = (id: string) => permissions[id]?.label ?? getRoles(1).find((r) => r.id === id)?.name ?? id
  const addMetric = () => {
    const m = newMetric.trim()
    if (!m) return
    setMetricsByRole((prev) => ({ ...prev, [metricRole]: [...(prev[metricRole] ?? []), m] }))
    setNewMetric('')
  }
  const removeMetric = (label: string) =>
    setMetricsByRole((prev) => ({ ...prev, [metricRole]: (prev[metricRole] ?? []).filter((x) => x !== label) }))

  // ============================================================ MAIN MENU ===
  if (section === 'menu') {
    const MENU = [
      { id: 'goals' as const, icon: Target, title: 'Company goals', desc: 'Create and remove the targets that drive the Executive overview alerts.', stat: `${goals.length} goals`, warn: offTarget > 0 ? `${offTarget} off target` : undefined },
      { id: 'employees' as const, icon: Users, title: 'Employees', desc: 'Add, edit, or remove team members and their roles.', stat: `${employees.length} employees`, warn: undefined },
      { id: 'roles' as const, icon: ShieldCheck, title: 'Roles & permissions', desc: 'Add new roles and control what each role can see and do.', stat: `${Object.keys(permissions).length} roles`, warn: undefined },
      { id: 'metrics' as const, icon: ListChecks, title: 'Metrics by role', desc: 'Choose which metrics each role is measured by.', stat: `${Object.keys(metricsByRole).length} roles configured`, warn: undefined },
    ]
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MENU.map(({ id, icon: Icon, title, desc, stat, warn }) => (
            <button key={id} onClick={() => setSection(id)} className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700"><Icon className="h-5 w-5" /></span>
                <ChevronRight className="h-5 w-5 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
              </div>
              <p className="mt-4 text-base font-bold text-ink-900">{title}</p>
              <p className="mt-1 flex-1 text-sm leading-snug text-slate-500">{desc}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{stat}</span>
                {warn && <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">{warn}</span>}
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-400">Changes here are placeholder (in-memory) until the admin portal is connected to a backend.</p>
      </div>
    )
  }

  const SECTION_TITLES: Record<Exclude<Section, 'menu'>, string> = {
    goals: 'Company goals',
    employees: 'Employees',
    roles: 'Roles & permissions',
    metrics: 'Metrics by role',
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => setSection('menu')} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-brand-300 hover:text-brand-700">
          <ArrowLeft className="h-3.5 w-3.5" /> Admin menu
        </button>
        <span className="text-sm text-slate-400">Admin <span className="mx-1">/</span><span className="font-semibold text-ink-900">{SECTION_TITLES[section]}</span></span>
      </div>

      {/* ----- Goals ----- */}
      {section === 'goals' && (
        <Card title="Company goals" subtitle="Goals drive the alerts on the Executive overview" action={
          <button onClick={() => setShowGoalForm((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-ink-900 transition hover:bg-brand-400"><Plus className="h-3.5 w-3.5" /> Add goal</button>
        }>
          {showGoalForm && (
            <div className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-brand-200 bg-brand-50/50 p-3">
              <div><p className="mb-1 text-[11px] font-medium text-slate-500">Goal name</p><input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} placeholder="e.g. EBOOs per month" className={`w-44 ${inputCls}`} /></div>
              <div><p className="mb-1 text-[11px] font-medium text-slate-500">Area</p><input value={draft.area} onChange={(e) => setDraft({ ...draft, area: e.target.value })} placeholder="e.g. Nurses" className={`w-28 ${inputCls}`} /></div>
              <div><p className="mb-1 text-[11px] font-medium text-slate-500">Current</p><input value={draft.value} onChange={(e) => setDraft({ ...draft, value: e.target.value })} placeholder="0" inputMode="numeric" className={`w-20 ${inputCls}`} /></div>
              <div><p className="mb-1 text-[11px] font-medium text-slate-500">Target</p><input value={draft.target} onChange={(e) => setDraft({ ...draft, target: e.target.value })} placeholder="100" inputMode="numeric" className={`w-20 ${inputCls}`} /></div>
              <label className="flex items-center gap-1.5 pb-1.5 text-xs text-slate-500"><input type="checkbox" checked={draft.lowerIsBetter} onChange={(e) => setDraft({ ...draft, lowerIsBetter: e.target.checked })} /> Lower is better</label>
              <button onClick={addGoal} className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-ink-900 transition hover:bg-brand-400">Save goal</button>
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
                      <span className="truncate text-sm font-medium text-ink-900">{g.label} <span className="text-xs font-normal text-slate-400">· {g.area}</span></span>
                      <span className={`shrink-0 text-xs font-semibold ${breached ? 'text-rose-600' : 'text-emerald-600'}`}>{breached ? 'Off target' : 'On track'}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200"><div className={`h-full rounded-full ${breached ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} /></div>
                    <p className="mt-1 text-[11px] text-slate-400">{formatValue(g.value, g.format)} / target {formatValue(g.target, g.format)}{g.lowerIsBetter ? ' (lower is better)' : ''}</p>
                  </div>
                  <button onClick={() => deleteGoal(g.id)} className="shrink-0 rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600" title="Delete goal"><Trash2 className="h-4 w-4" /></button>
                </div>
              )
            })}
            {goals.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No goals yet — add the first one above.</p>}
          </div>
        </Card>
      )}

      {/* ----- Employees ----- */}
      {section === 'employees' && (
        <Card title="Employees" subtitle="Add, edit, or remove employees" action={
          <button onClick={() => setShowEmpForm((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-ink-900 transition hover:bg-brand-400"><Plus className="h-3.5 w-3.5" /> Add employee</button>
        }>
          {showEmpForm && (
            <div className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-brand-200 bg-brand-50/50 p-3">
              <div><p className="mb-1 text-[11px] font-medium text-slate-500">Name</p><input value={empDraft.name} onChange={(e) => setEmpDraft({ ...empDraft, name: e.target.value })} placeholder="e.g. Laura" className={`w-44 ${inputCls}`} /></div>
              <div><p className="mb-1 text-[11px] font-medium text-slate-500">Role</p><select value={empDraft.role} onChange={(e) => setEmpDraft({ ...empDraft, role: e.target.value })} className={inputCls}>{BASE_ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}</select></div>
              <div><p className="mb-1 text-[11px] font-medium text-slate-500">Utilization %</p><input value={empDraft.utilization} onChange={(e) => setEmpDraft({ ...empDraft, utilization: e.target.value })} placeholder="0" inputMode="numeric" className={`w-20 ${inputCls}`} /></div>
              <button onClick={addEmployee} className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-ink-900 transition hover:bg-brand-400">Save employee</button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400"><th className="pb-2 font-semibold">Employee</th><th className="pb-2 font-semibold">Role</th><th className="pb-2 text-right font-semibold">Utilization</th><th className="pb-2 text-right font-semibold">Actions</th></tr></thead>
              <tbody>
                {employees.map((e) => {
                  const isEditing = editingId === e.id
                  return (
                    <tr key={e.id} className="border-b border-slate-100 last:border-0">
                      <td className="py-2">{isEditing ? <input value={edit.name} onChange={(ev) => setEdit({ ...edit, name: ev.target.value })} className={`w-44 ${inputCls}`} /> : <span className="font-medium text-ink-900">{e.name}</span>}</td>
                      <td className="py-2">{isEditing ? <select value={edit.role} onChange={(ev) => setEdit({ ...edit, role: ev.target.value })} className={inputCls}>{BASE_ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}</select> : <span className="text-slate-600">{e.role}</span>}</td>
                      <td className="py-2 text-right tabular-nums text-slate-600">{isEditing ? <input value={edit.utilization} onChange={(ev) => setEdit({ ...edit, utilization: ev.target.value })} inputMode="numeric" className={`w-16 text-right ${inputCls}`} /> : `${e.utilizationPct}%`}</td>
                      <td className="py-2 text-right">{isEditing ? (
                        <span className="inline-flex gap-1"><button onClick={saveEdit} className="rounded-lg p-1.5 text-emerald-600 transition hover:bg-emerald-50" title="Save"><Check className="h-4 w-4" /></button><button onClick={() => setEditingId(null)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100" title="Cancel"><X className="h-4 w-4" /></button></span>
                      ) : (
                        <span className="inline-flex gap-1"><button onClick={() => startEdit(e.id, e.name, e.role, e.utilizationPct)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-brand-50 hover:text-brand-700" title="Edit"><Pencil className="h-4 w-4" /></button><button onClick={() => deleteEmployee(e.id)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600" title="Remove employee"><Trash2 className="h-4 w-4" /></button></span>
                      )}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ----- Roles & permissions ----- */}
      {section === 'roles' && (
        <Card title="Roles & permissions" subtitle="Add roles and set what each can see and do" action={
          <div className="flex items-center gap-2">
            <input value={newRole} onChange={(e) => setNewRole(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addRole()} placeholder="New role name" className={`w-40 ${inputCls}`} />
            <button onClick={addRole} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-ink-900 transition hover:bg-brand-400"><Plus className="h-3.5 w-3.5" /> Add role</button>
          </div>
        }>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400"><th className="pb-2 font-semibold">Role</th>{PERM_COLUMNS.map((p) => <th key={p} className="pb-2 text-center font-semibold">{p}</th>)}<th className="pb-2" /></tr></thead>
              <tbody>
                {Object.entries(permissions).map(([roleId, role]) => (
                  <tr key={roleId} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 font-medium text-ink-900">{role.label}</td>
                    {PERM_COLUMNS.map((p) => <td key={p} className="py-2 text-center"><input type="checkbox" checked={role.perms[p]} onChange={() => togglePerm(roleId, p)} className="h-4 w-4 cursor-pointer accent-brand-600" /></td>)}
                    <td className="py-2 text-right"><button onClick={() => deleteRole(roleId)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600" title="Delete role"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[11px] text-slate-400">e.g. "Unlocked notes" is on for Medics only; only Admin can edit Employees & Roles.</p>
        </Card>
      )}

      {/* ----- Metrics by role ----- */}
      {section === 'metrics' && (
        <Card title="Metrics by role" subtitle="Pick a role, then choose which metrics it is measured by">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-400">Role:</span>
            <select value={metricRole} onChange={(e) => setMetricRole(e.target.value)} className={inputCls}>
              {Object.keys(metricsByRole).map((id) => <option key={id} value={id}>{roleLabel(id)}</option>)}
            </select>
            <div className="ml-auto flex items-center gap-2">
              <input value={newMetric} onChange={(e) => setNewMetric(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addMetric()} placeholder="Add a metric to measure" className={`w-56 ${inputCls}`} />
              <button onClick={addMetric} className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-xs font-semibold text-ink-900 transition hover:bg-brand-400"><Plus className="h-3.5 w-3.5" /> Add metric</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {(metricsByRole[metricRole] ?? []).map((m) => (
              <span key={m} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-700">
                {m}
                <button onClick={() => removeMetric(m)} className="rounded-full p-0.5 text-slate-400 transition hover:bg-rose-100 hover:text-rose-600" title="Remove metric"><X className="h-3.5 w-3.5" /></button>
              </span>
            ))}
            {(metricsByRole[metricRole] ?? []).length === 0 && <p className="py-6 text-sm text-slate-400">No metrics yet — add the first one for this role.</p>}
          </div>
        </Card>
      )}
    </div>
  )
}

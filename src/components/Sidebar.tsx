import {
  Activity,
  CalendarClock,
  DollarSign,
  LayoutDashboard,
  Route,
  Stethoscope,
  Sun,
  UserCircle,
  Users,
} from 'lucide-react'
import { CLINIC_NAME } from '../data/mockData'

export type PageId =
  | 'today'
  | 'overview'
  | 'patients'
  | 'journey'
  | 'revenue'
  | 'team'
  | 'employees'
  | 'occupancy'

const NAV: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'today', label: 'Today', icon: Sun },
  { id: 'overview', label: 'Executive overview', icon: LayoutDashboard },
  { id: 'revenue', label: 'Revenue', icon: DollarSign },
  { id: 'patients', label: 'Patients', icon: Users },
  { id: 'journey', label: 'Patient Journey', icon: Route },
  { id: 'team', label: 'Team & Roles', icon: Stethoscope },
  { id: 'employees', label: 'Employees', icon: UserCircle },
  { id: 'occupancy', label: 'Occupancy', icon: CalendarClock },
]

interface Props {
  current: PageId
  onChange: (page: PageId) => void
}

export default function Sidebar({ current, onChange }: Props) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-ink-700 bg-ink-900 text-slate-300">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-ink-900">
          <Activity className="h-5 w-5" />
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-white">Helixona</p>
          <p className="text-[11px] text-slate-400">Operational Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {NAV.map(({ id, label, icon: Icon }) => {
          const active = current === id
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? 'bg-brand-500 font-semibold text-ink-900 shadow'
                  : 'text-slate-300 hover:bg-ink-700 hover:text-white'
              }`}
            >
              <Icon className="h-4.5 w-4.5" />
              {label}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-ink-700 px-5 py-4 text-[11px] text-slate-500">
        <p className="font-medium text-slate-400">{CLINIC_NAME}</p>
        <p className="mt-0.5">Demo data · placeholder</p>
      </div>
    </aside>
  )
}

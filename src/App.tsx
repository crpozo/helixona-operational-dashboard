import { useMemo, useState } from 'react'
import Sidebar, { type PageId } from './components/Sidebar'
import Header from './components/Header'
import Overview from './pages/Overview'
import Revenue from './pages/Revenue'
import Patients from './pages/Patients'
import Team from './pages/Team'
import Employees from './pages/Employees'
import Occupancy from './pages/Occupancy'
import type { PaymentType, Period } from './types'
import { formatPeriodLabel, getScale } from './data/mockData'

const PAGE_META: Record<PageId, { title: string; subtitle: string }> = {
  overview: { title: 'Executive overview', subtitle: 'The whole operation at a glance' },
  revenue: { title: 'Revenue', subtitle: 'Collections, payment mix, and ticket by modality' },
  patients: { title: 'Patients', subtitle: 'Funnel, new-patient pipeline, and modalities' },
  team: { title: 'Team & Roles', subtitle: 'KPIs by role and per-person performance' },
  employees: { title: 'Employees', subtitle: 'Per-employee metrics, revenue, and productivity' },
  occupancy: { title: 'Occupancy', subtitle: 'Unit usage and the daily curve' },
}

export default function App() {
  const [page, setPage] = useState<PageId>('overview')
  const [period, setPeriod] = useState<Period>({ kind: 'preset', preset: 'month' })
  const [payment, setPayment] = useState<PaymentType>('all')

  const scale = useMemo(() => getScale(period), [period])
  const meta = PAGE_META[page]
  const subtitle = `${meta.subtitle} · ${formatPeriodLabel(period)}`

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar current={page} onChange={setPage} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          title={meta.title}
          subtitle={subtitle}
          period={period}
          payment={payment}
          onPeriod={setPeriod}
          onPayment={setPayment}
        />

        <main className="flex-1 overflow-y-auto px-6 py-6">
          {page === 'overview' && <Overview scale={scale} payment={payment} />}
          {page === 'revenue' && <Revenue scale={scale} payment={payment} />}
          {page === 'patients' && <Patients scale={scale} payment={payment} />}
          {page === 'team' && <Team scale={scale} />}
          {page === 'employees' && <Employees scale={scale} />}
          {page === 'occupancy' && <Occupancy />}
        </main>
      </div>
    </div>
  )
}

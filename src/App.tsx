import { useMemo, useState } from 'react'
import Sidebar, { type PageId } from './components/Sidebar'
import Header from './components/Header'
import Today from './pages/Today'
import Overview from './pages/Overview'
import Revenue from './pages/Revenue'
import Billing from './pages/Billing'
import Patients from './pages/Patients'
import PatientJourney from './pages/PatientJourney'
import Marketing from './pages/Marketing'
import Team from './pages/Team'
import Employees from './pages/Employees'
import Treatments from './pages/Treatments'
import type { PaymentType, Period } from './types'
import { formatPeriodLabel, getScale } from './data/mockData'

const PAGE_META: Record<
  PageId,
  { title: string; subtitle: string; period: boolean; payment: boolean }
> = {
  today: { title: 'Today', subtitle: 'Live daily snapshot of the operation', period: false, payment: false },
  overview: { title: 'Executive overview', subtitle: 'The whole operation at a glance', period: true, payment: true },
  revenue: { title: 'Revenue', subtitle: 'Estimated vs collected, mix, and ticket by modality', period: true, payment: true },
  billing: { title: 'Insurance & Billing', subtitle: 'Claims, denials, and what payers owe', period: false, payment: false },
  patients: { title: 'Patients', subtitle: 'Funnel, new-patient pipeline, and modalities', period: true, payment: true },
  journey: { title: 'Patient Journey', subtitle: 'Where each patient is in the lifecycle', period: false, payment: false },
  marketing: { title: 'Marketing', subtitle: 'Channels, followers, web, and email campaigns', period: false, payment: false },
  team: { title: 'Team & Roles', subtitle: 'KPIs by role and per-person performance', period: true, payment: false },
  employees: { title: 'Employees', subtitle: 'Per-employee metrics, revenue, and productivity', period: true, payment: true },
  treatments: { title: 'Treatments', subtitle: 'Revenue or occupancy by treatment, and unit usage', period: true, payment: true },
}

export default function App() {
  const [page, setPage] = useState<PageId>('today')
  const [period, setPeriod] = useState<Period>({ kind: 'preset', preset: 'month' })
  const [payment, setPayment] = useState<PaymentType>('all')

  const scale = useMemo(() => getScale(period), [period])
  const meta = PAGE_META[page]
  // Only append the period label when the period filter applies to this page.
  const subtitle = meta.period ? `${meta.subtitle} · ${formatPeriodLabel(period)}` : meta.subtitle

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
          showPeriod={meta.period}
          showPayment={meta.payment}
        />

        <main className="flex-1 overflow-y-auto px-6 py-6">
          {page === 'today' && <Today />}
          {page === 'overview' && <Overview scale={scale} payment={payment} />}
          {page === 'revenue' && <Revenue scale={scale} payment={payment} />}
          {page === 'billing' && <Billing />}
          {page === 'patients' && <Patients scale={scale} payment={payment} />}
          {page === 'journey' && <PatientJourney />}
          {page === 'marketing' && <Marketing />}
          {page === 'team' && <Team scale={scale} />}
          {page === 'employees' && <Employees scale={scale} payment={payment} />}
          {page === 'treatments' && <Treatments scale={scale} payment={payment} />}
        </main>
      </div>
    </div>
  )
}

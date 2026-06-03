import { useState } from 'react'
import Sidebar, { type PageId } from './components/Sidebar'
import Header from './components/Header'
import Overview from './pages/Overview'
import Revenue from './pages/Revenue'
import Patients from './pages/Patients'
import Team from './pages/Team'
import Occupancy from './pages/Occupancy'
import type { PaymentType, Timeframe } from './types'

const PAGE_META: Record<PageId, { title: string; subtitle: string }> = {
  overview: { title: 'Resumen ejecutivo', subtitle: 'La operación completa de un vistazo' },
  revenue: { title: 'Revenue', subtitle: 'Cobranza, mix de pago y ticket por modalidad' },
  patients: { title: 'Pacientes', subtitle: 'Embudo, pipeline de nuevos y modalidades' },
  team: { title: 'Equipo & Roles', subtitle: 'KPIs por rol y rendimiento por persona' },
  occupancy: { title: 'Ocupación', subtitle: 'Uso de unidades y curva del día' },
}

export default function App() {
  const [page, setPage] = useState<PageId>('overview')
  const [timeframe, setTimeframe] = useState<Timeframe>('month')
  const [payment, setPayment] = useState<PaymentType>('all')

  const meta = PAGE_META[page]

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar current={page} onChange={setPage} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          title={meta.title}
          subtitle={meta.subtitle}
          timeframe={timeframe}
          payment={payment}
          onTimeframe={setTimeframe}
          onPayment={setPayment}
        />

        <main className="flex-1 overflow-y-auto px-6 py-6">
          {page === 'overview' && <Overview timeframe={timeframe} payment={payment} />}
          {page === 'revenue' && <Revenue timeframe={timeframe} payment={payment} />}
          {page === 'patients' && <Patients timeframe={timeframe} payment={payment} />}
          {page === 'team' && <Team timeframe={timeframe} />}
          {page === 'occupancy' && <Occupancy />}
        </main>
      </div>
    </div>
  )
}

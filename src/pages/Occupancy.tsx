import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Card from '../components/Card'
import { getHourlyOccupancy, getOccupancy } from '../data/mockData'
import { COLORS } from '../lib/colors'

function pctColor(pct: number): string {
  if (pct >= 90) return COLORS.rose
  if (pct >= 75) return COLORS.amber
  if (pct >= 50) return COLORS.insurance
  return COLORS.slate
}

export default function Occupancy() {
  const units = getOccupancy()
  const hourly = getHourlyOccupancy()

  const totalCapacity = units.reduce((s, u) => s + u.capacity, 0)
  const totalBooked = units.reduce((s, u) => s + u.booked, 0)
  const overall = Math.round((totalBooked / totalCapacity) * 100)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Ocupación global</p>
          <p className="mt-2 text-3xl font-bold text-ink-900">{overall}%</p>
          <p className="mt-1 text-xs text-slate-400">{totalBooked} de {totalCapacity} slots ocupados hoy</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Slots disponibles</p>
          <p className="mt-2 text-3xl font-bold text-emerald-600">{totalCapacity - totalBooked}</p>
          <p className="mt-1 text-xs text-slate-400">Capacidad libre para agendar hoy</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Unidades a tope (≥90%)</p>
          <p className="mt-2 text-3xl font-bold text-rose-600">
            {units.filter((u) => u.booked / u.capacity >= 0.9).length}
          </p>
          <p className="mt-1 text-xs text-slate-400">Considerar redistribuir demanda</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Ocupación por unidad */}
        <Card title="Ocupación por unidad" subtitle="Reservado vs capacidad (hoy)">
          <div className="space-y-3">
            {units.map((u) => {
              const pct = Math.round((u.booked / u.capacity) * 100)
              return (
                <div key={u.unit}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-600">{u.unit}</span>
                    <span className="tabular-nums text-slate-500">
                      {u.booked}/{u.capacity} · {pct}%
                    </span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: pctColor(pct) }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Ocupación por hora */}
        <Card title="Ocupación por hora" subtitle="Curva del día — identificar picos">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={hourly} margin={{ left: -16, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip formatter={(v: number) => `${v}%`} />
              <Bar dataKey="pct" radius={[6, 6, 0, 0]} barSize={22}>
                {hourly.map((h, i) => (
                  <Cell key={i} fill={pctColor(h.pct)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}

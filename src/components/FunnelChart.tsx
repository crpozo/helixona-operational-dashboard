import type { FunnelStage } from '../types'
import { CATEGORICAL } from '../lib/colors'

// Shared lead → first-appointment conversion funnel, used on the Patients tab
// and embedded in the New Patient Advisor (Marie) section of Team & Roles.
export default function FunnelChart({ funnel }: { funnel: FunnelStage[] }) {
  return (
    <div className="space-y-2.5">
      {funnel.map((stage, i) => {
        const pct = Math.round((stage.count / funnel[0].count) * 100)
        const prev = i > 0 ? funnel[i - 1].count : stage.count
        const stepConv = prev ? Math.round((stage.count / prev) * 100) : 100
        const denied = stage.stage.startsWith('Denied')
        return (
          <div key={stage.stage}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className={`font-medium ${denied ? 'text-rose-600' : 'text-slate-600'}`}>{stage.stage}</span>
              <span className="tabular-nums text-slate-500">
                {stage.count.toLocaleString()}
                {denied ? (
                  <span className="ml-2 text-xs text-rose-400">left the funnel</span>
                ) : (
                  i > 0 && <span className="ml-2 text-xs text-slate-400">({stepConv}% step)</span>
                )}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: denied ? '#e11d48' : CATEGORICAL[i % CATEGORICAL.length] }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

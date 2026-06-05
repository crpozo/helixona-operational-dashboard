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
import KpiCard from '../components/KpiCard'
import {
  getEmailCampaigns,
  getMarketingChannels,
  getMarketingKpis,
} from '../data/mockData'
import { CATEGORICAL } from '../lib/colors'

export default function Marketing() {
  const kpis = getMarketingKpis()
  const channels = getMarketingChannels()
  const campaigns = getEmailCampaigns()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <KpiCard key={k.id} kpi={k} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Leads by channel */}
        <Card title="Leads by channel" subtitle="Acquisition source">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={channels} margin={{ left: -16, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis dataKey="channel" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={0} angle={-12} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip formatter={(v: number) => `${v} leads`} />
              <Bar dataKey="leads" radius={[6, 6, 0, 0]} barSize={34}>
                {channels.map((_, i) => (
                  <Cell key={i} fill={CATEGORICAL[i % CATEGORICAL.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Followers by channel */}
        <Card title="Followers by channel" subtitle="Social audience">
          <div className="space-y-3 pt-2">
            {channels.filter((c) => c.followers > 0).map((c, i) => {
              const max = Math.max(...channels.map((x) => x.followers))
              const pct = Math.round((c.followers / max) * 100)
              return (
                <div key={c.channel}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-600">{c.channel}</span>
                    <span className="tabular-nums text-slate-500">{c.followers.toLocaleString()}</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: CATEGORICAL[i % CATEGORICAL.length] }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Email campaigns (Mailchimp) */}
      <Card title="Email campaigns" subtitle="Mailchimp · sent, engagement, leads">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-semibold">Campaign</th>
                <th className="pb-2 text-right font-semibold">Sent</th>
                <th className="pb-2 text-right font-semibold">Open rate</th>
                <th className="pb-2 text-right font-semibold">Click rate</th>
                <th className="pb-2 text-right font-semibold">Leads</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.name} className="border-b border-slate-100 last:border-0">
                  <td className="py-2.5 font-medium text-ink-900">{c.name}</td>
                  <td className="py-2.5 text-right tabular-nums text-slate-600">{c.sent.toLocaleString()}</td>
                  <td className="py-2.5 text-right tabular-nums text-slate-600">{c.openRate}%</td>
                  <td className="py-2.5 text-right tabular-nums text-slate-600">{c.clickRate}%</td>
                  <td className="py-2.5 text-right tabular-nums font-semibold text-ink-900">{c.leads}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

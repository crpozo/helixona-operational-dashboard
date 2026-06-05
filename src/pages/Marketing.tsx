import { useState } from 'react'
import {
  Area,
  AreaChart,
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
  getChannelTrend,
  getEmailCampaigns,
  getMarketingChannels,
  getMarketingKpis,
  MARKETING_CHANNEL_LABELS,
  type MarketingChannelKey,
} from '../data/mockData'
import { CATEGORICAL, COLORS } from '../lib/colors'
import { formatCompact } from '../lib/format'

const CHANNELS: MarketingChannelKey[] = ['all', 'web', 'instagram', 'facebook', 'email']

export default function Marketing() {
  const [channel, setChannel] = useState<MarketingChannelKey>('all')
  const kpis = getMarketingKpis(channel)
  const channels = getMarketingChannels()
  const campaigns = getEmailCampaigns()
  const trend = getChannelTrend(channel)
  const isAll = channel === 'all'

  return (
    <div className="space-y-6">
      {/* Channel filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-400">Channel:</span>
        {CHANNELS.map((c) => (
          <button
            key={c}
            onClick={() => setChannel(c)}
            className={`rounded-lg border px-3 py-1 text-xs font-semibold transition ${
              channel === c
                ? 'border-brand-500 bg-brand-500 text-ink-900'
                : 'border-slate-200 bg-white text-slate-500 hover:border-brand-400'
            }`}
          >
            {MARKETING_CHANNEL_LABELS[c]}
          </button>
        ))}
      </div>

      {/* KPIs (per channel) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <KpiCard key={k.id} kpi={k} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Channel trend */}
        <Card
          title={`${MARKETING_CHANNEL_LABELS[channel]} · ${trend.metric}`}
          subtitle="Month over month"
          className={isAll ? 'lg:col-span-2' : 'lg:col-span-3'}
        >
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={trend.points} margin={{ left: -16, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="gMktg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.cash} stopOpacity={0.35} />
                  <stop offset="95%" stopColor={COLORS.cash} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompact(v, 'number')} />
              <Tooltip formatter={(v: number) => [v.toLocaleString(), trend.metric]} />
              <Area type="monotone" dataKey="value" name={trend.metric} stroke={COLORS.cash} fill="url(#gMktg)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        {/* Leads by channel — only meaningful when comparing all */}
        {isAll && (
          <Card title="Leads by channel" subtitle="Acquisition source">
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={channels} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="channel" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={80} />
                <Tooltip formatter={(v: number) => `${v} leads`} />
                <Bar dataKey="leads" radius={[0, 6, 6, 0]} barSize={16}>
                  {channels.map((_, i) => (
                    <Cell key={i} fill={CATEGORICAL[i % CATEGORICAL.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>

      {/* Email campaigns — focus when Email channel is selected */}
      {(isAll || channel === 'email') && (
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
      )}

      {/* Followers by channel — social context, only on All */}
      {isAll && (
        <Card title="Followers by channel" subtitle="Social audience">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
      )}
    </div>
  )
}

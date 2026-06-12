import { useState } from 'react'
import {
  Facebook,
  Globe,
  Instagram,
  Layers,
  Mail,
  Music2,
  TrendingDown,
  TrendingUp,
  Twitter,
  Youtube,
} from 'lucide-react'
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
  getMarketingMetricTrend,
  getSocialPosts,
  MARKETING_CHANNEL_LABELS,
  type MarketingChannelKey,
} from '../data/mockData'
import { CATEGORICAL, COLORS } from '../lib/colors'
import { formatCompact } from '../lib/format'

const CHANNELS: MarketingChannelKey[] = ['all', 'web', 'instagram', 'facebook', 'tiktok', 'youtube', 'x', 'email']

const CHANNEL_ICONS: Record<MarketingChannelKey, typeof Layers> = {
  all: Layers,
  web: Globe,
  instagram: Instagram,
  facebook: Facebook,
  tiktok: Music2,
  youtube: Youtube,
  x: Twitter,
  email: Mail,
}

interface Props {
  scale: number
}

// KPI ids that are running totals or rates — they don't scale with the period.
const NO_SCALE = new Set([
  'followers', 'ig-followers', 'fb-followers', 'x-followers', 'tt-followers', 'yt-subs',
  'g-reviews', 'open-rate', 'em-open', 'em-click', 'ig-eng', 'fb-eng', 'x-eng', 'tt-eng',
  'web-bounce', 'web-dur',
])

export default function Marketing({ scale }: Props) {
  const [channel, setChannelRaw] = useState<MarketingChannelKey>('all')
  const [selectedKpi, setSelectedKpi] = useState<string | null>(null)
  const kpis = getMarketingKpis(channel).map((k) =>
    NO_SCALE.has(k.id) ? k : { ...k, value: Math.round(k.value * scale) },
  )
  const channels = getMarketingChannels()
  const campaigns = getEmailCampaigns()
  const isAll = channel === 'all'

  const setChannel = (c: MarketingChannelKey) => {
    setChannelRaw(c)
    setSelectedKpi(null)
  }

  // Trend: the clicked KPI block wins; otherwise the channel's default metric.
  const selected = selectedKpi ? kpis.find((k) => k.id === selectedKpi) ?? null : null
  const channelTrend = getChannelTrend(channel)
  const trend = selected
    ? { metric: selected.label, points: getMarketingMetricTrend(selected.id, selected.value) }
    : channelTrend

  return (
    <div className="space-y-6">
      {/* Channel filter */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-400">Channel:</span>
        {CHANNELS.map((c) => {
          const Icon = CHANNEL_ICONS[c]
          return (
            <button
              key={c}
              onClick={() => setChannel(c)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-semibold transition ${
                channel === c
                  ? 'border-brand-500 bg-brand-500 text-ink-900'
                  : 'border-slate-200 bg-white text-slate-500 hover:border-brand-400'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {MARKETING_CHANNEL_LABELS[c]}
            </button>
          )
        })}
      </div>

      {/* KPIs (per channel) — click a block to see its trend over time */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpis.map((k) => (
          <KpiCard
            key={k.id}
            kpi={k}
            active={selectedKpi === k.id}
            onClick={() => setSelectedKpi(selectedKpi === k.id ? null : k.id)}
          />
        ))}
      </div>
      <p className="-mt-3 text-xs text-slate-400">Click any block to see its trend over time.</p>

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

      {/* Social posts — highest to lowest performing */}
      {channel !== 'email' && channel !== 'web' && (
        <Card title="Post performance" subtitle="Social posts ranked by engagement — highest to lowest">
          <div className="space-y-1.5">
            {getSocialPosts()
              .filter((p) => isAll || MARKETING_CHANNEL_LABELS[channel] === p.channel)
              .map((p, i, arr) => {
                const top = i < Math.ceil(arr.length / 2)
                return (
                  <div key={p.title} className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2">
                    <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${top ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {top ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink-900">{p.title}</p>
                      <p className="text-xs text-slate-400">{p.channel} · {p.reach.toLocaleString()} reach</p>
                    </div>
                    <span className="shrink-0 text-sm font-bold tabular-nums text-ink-900">{p.engagement}%</span>
                  </div>
                )
              })}
          </div>
        </Card>
      )}

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

import {
  ArrowRight,
  DollarSign,
  FileText,
  Megaphone,
  Sparkles,
  Stethoscope,
  Syringe,
  Users,
} from 'lucide-react'
import Card from '../components/Card'
import type { PageId } from '../components/Sidebar'
import {
  getAiExecutiveSummary,
  getAiRecommendations,
  getAiSections,
  type AiTone,
} from '../data/mockData'

interface Props {
  onNavigate: (page: PageId) => void
}

const AREA_ICONS: Record<string, typeof DollarSign> = {
  revenue: DollarSign,
  billing: FileText,
  patients: Users,
  marketing: Megaphone,
  team: Stethoscope,
  treatments: Syringe,
}

const TONE_DOT: Record<AiTone, string> = {
  positive: 'bg-emerald-500',
  watch: 'bg-amber-500',
  risk: 'bg-rose-500',
}

export default function AiInsights({ onNavigate }: Props) {
  const summary = getAiExecutiveSummary()
  const sections = getAiSections()
  const recommendations = getAiRecommendations()

  return (
    <div className="space-y-6">
      {/* Executive summary */}
      <div className="rounded-2xl bg-ink-900 p-6 text-white shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500 text-ink-900">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-bold">AI executive summary</h2>
            <p className="text-xs text-slate-400">Generated across all dashboards · placeholder until wired to a live LLM</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-slate-200">{summary}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-1 font-semibold text-emerald-300">Revenue +8.4% MoM</span>
          <span className="rounded-full bg-rose-500/15 px-2.5 py-1 font-semibold text-rose-300">$412.9k outstanding A/R</span>
          <span className="rounded-full bg-amber-500/15 px-2.5 py-1 font-semibold text-amber-300">Conversion −4%</span>
          <span className="rounded-full bg-brand-500/20 px-2.5 py-1 font-semibold text-brand-300">EBOO at 92% capacity</span>
        </div>
      </div>

      {/* Recommended actions */}
      <Card title="Recommended actions" subtitle="What the AI suggests doing next, in priority order">
        <ol className="space-y-2">
          {recommendations.map((r, i) => (
            <li key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-900 text-xs font-bold text-brand-400">
                {i + 1}
              </span>
              <span className="flex-1 text-sm text-slate-700">{r.text}</span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  r.priority === 'high' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                }`}
              >
                {r.priority === 'high' ? 'High' : 'Medium'}
              </span>
            </li>
          ))}
        </ol>
      </Card>

      {/* Per-dashboard insights */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {sections.map((sec) => {
          const Icon = AREA_ICONS[sec.page] ?? Sparkles
          return (
            <Card
              key={sec.page}
              title={sec.area}
              subtitle={sec.summary}
              action={
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                  <Icon className="h-4 w-4" />
                </span>
              }
            >
              <ul className="space-y-2">
                {sec.insights.map((ins, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${TONE_DOT[ins.tone]}`} />
                    <span className="text-slate-600">{ins.text}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => onNavigate(sec.page as PageId)}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 transition hover:gap-2.5"
              >
                Open {sec.area} dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

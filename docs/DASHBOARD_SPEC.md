# Helixona Operational Dashboard — Full Replication Spec

Everything needed to rebuild this dashboard from an empty folder: stack, design
system, app shell, every screen, every metric, the data contract, and the seed
content. Written so a developer (or an AI agent) can reproduce it faithfully
without reading the original source.

Companion docs: [`STYLE.md`](../STYLE.md) (visual language) ·
[`TIMELINE.md`](TIMELINE.md) (plan to connect real data).

---

## 1. What this is

An internal operational dashboard for **Helixona Wellness**, an IV-therapy /
functional-medicine clinic. It exists so the founder can be a *magnifying glass*
over the business: monitor staff, understand revenue, and read the whole
operation through metrics.

**All data is placeholder**, isolated in `src/data/mockData.ts`. The UI never
computes business data itself — it only renders what the data layer returns.
That boundary is the whole point: swapping mock for real integrations (ECW, 8x8,
billing, marketing APIs) touches one file.

Single-tenant, no auth, no backend, no router. State lives in React `useState`.

---

## 2. Stack and setup

```jsonc
// package.json
{
  "name": "helixona-operational-dashboard",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "lucide-react": "^0.453.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "recharts": "^2.13.3"
  },
  "devDependencies": {
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.14",
    "typescript": "^5.6.3",
    "vite": "^5.4.11"
  }
}
```

Bootstrap: `npm create vite@latest . -- --template react-ts`, then add Tailwind,
Recharts and lucide-react. `npm run dev` → http://localhost:5173.

### Configs

**`vite.config.ts`** — `base` only applies on build, because GitHub Pages serves
under `/<repo>/`; dev stays at `/` so the local server doesn't break.

```ts
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/helixona-operational-dashboard/' : '/',
  plugins: [react()],
  server: { host: true, port: 5173 },
}))
```

**`tsconfig.json`** — strict, `noUnusedLocals` and `noUnusedParameters` on
(unused imports fail the build), `jsx: react-jsx`, `noEmit`, bundler resolution.

**`tailwind.config.js`** — content globs `./index.html` and
`./src/**/*.{js,ts,jsx,tsx}`; extends `colors.brand`, `colors.ink` and
`fontFamily.sans` (see §4).

**`postcss.config.js`** — `tailwindcss` + `autoprefixer`.

**`index.html`** — preconnects Google Fonts and loads Inter 400–800; mounts
`<div id="root">` and `/src/main.tsx`.

**`src/index.css`** — the three `@tailwind` directives plus: `color-scheme: light`,
`html/body/#root { height: 100% }`, body background `#f4f6fb`, text `#0b1220`,
Inter font stack, antialiasing, and thin 8px scrollbars with `#cbd5e1` thumbs.

### Deployment

GitHub Actions (`.github/workflows/deploy.yml`) builds on push to the working
branch and publishes `dist/` to GitHub Pages.

> ⚠️ The Pages site is **public**. Before any real patient data is wired in, this
> deploy must be disabled or fenced to a mock-only branch — see `TIMELINE.md`.

---

## 3. File tree

```
index.html
tailwind.config.js · postcss.config.js · vite.config.ts · tsconfig.json
STYLE.md · README.md · docs/TIMELINE.md · docs/DASHBOARD_SPEC.md
.github/workflows/deploy.yml
src/
  main.tsx                 React root
  App.tsx                  shell, page switch, global filter state
  index.css                Tailwind + base styles
  types.ts                 every shared type (the data contract)
  data/mockData.ts         ALL data — the single swap point (~1,480 lines)
  lib/
    colors.ts              chart palette
    format.ts              formatValue / formatCompact
    csv.ts                 downloadCsv
  components/
    Sidebar.tsx            nav + PageId union
    Header.tsx             title + period/payment filters
    Card.tsx               the default container
    KpiCard.tsx            metric block with delta pill
    TrendPanel.tsx         6-month trend shown on KPI click
    FunnelChart.tsx        shared lead→appointment funnel
  pages/
    Today.tsx  Overview.tsx  AiInsights.tsx  Revenue.tsx  Billing.tsx
    Patients.tsx  PatientJourney.tsx  Marketing.tsx  Team.tsx
    Employees.tsx  Treatments.tsx  Admin.tsx
```

---

## 4. Design system

Full detail in `STYLE.md`. The essentials:

### Tokens (`tailwind.config.js`)

```js
colors: {
  brand: { 50:'#faf7f0', 100:'#f3ebd9', 200:'#e8d7b4', 300:'#dfc699',
           400:'#d9bf8d', 500:'#d6b981', 600:'#c2a163', 700:'#9c7e44',
           800:'#7c6537', 900:'#66532f' },
  ink:   { 600:'#2b2b2b', 700:'#1c1c1c', 800:'#111111', 900:'#000000' },
},
fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
```

Brand = **gold `#d6b981` + near-black + white**, a luxe clinical look.
Semantic colors keep their meaning: emerald = good, rose = critical, amber =
watch, slate = muted.

### Chart palette (`src/lib/colors.ts`)

```ts
export const COLORS = {
  cash: '#d6b981',       // brand gold
  insurance: '#1c1c1c',  // near-black
  accent: '#b08d4f',     // bronze
  amber: '#f59e0b', rose: '#e11d48', slate: '#9ca3af',
}
export const CATEGORICAL =
  ['#d6b981','#1c1c1c','#b08d4f','#8a6d3b','#cbb892','#6b7280']
```

**Cash = gold, Insurance = near-black**, everywhere, without exception.
Categorical charts cycle `CATEGORICAL` (gold → bronze → charcoal — never a
rainbow).

### Typography

Inter throughout. Page title `text-lg font-bold text-ink-900` · card title
`text-sm font-semibold` · KPI value `text-2xl font-bold tracking-tight` · big
stat `text-3xl font-bold` · labels `text-xs text-slate-400` · hints
`text-[11px]`. **Every number carries `tabular-nums`** so columns align.

### Layout

Fixed black sidebar `w-60` + scrollable main. Page background `#f4f6fb`. Sticky
header `bg-white/80 backdrop-blur`. Vertical rhythm `space-y-6`, grids
`gap-4`/`gap-6`, responsive `grid-cols-1 → sm:grid-cols-2 → lg:grid-cols-3/4`.

### Components

| Component | Classes / behavior |
|---|---|
| **Card** | `rounded-2xl border border-slate-200 bg-white p-5 shadow-sm`; optional `title`, `subtitle`, and an `action` slot top-right (toggles, export buttons) |
| **KpiCard** | `rounded-2xl border p-4 shadow-sm hover:shadow-md`; label + delta pill + value + hint. Clickable variant gets `cursor-pointer`, and when active `border-brand-500 ring-2 ring-brand-100` |
| **Delta pill** | emerald when good, rose when bad, with `ArrowUpRight`/`ArrowDownRight`/`Minus`. "Good" flips when `lowerIsBetter` |
| **Primary button** | `bg-brand-500 text-ink-900 hover:bg-brand-400` (gold with black text) |
| **Active chip/tab** | `bg-brand-500 text-ink-900`; inactive `bg-white text-slate-500 hover:border-brand-400` |
| **Sidebar item** | active `bg-brand-500 text-ink-900 font-semibold`; inactive `text-slate-300 hover:bg-ink-700 hover:text-white` |
| **Table** | header `border-b text-xs uppercase tracking-wide text-slate-400`; rows `border-b border-slate-100`, numbers right-aligned + `tabular-nums` |
| **Pills** | `rounded-full text-xs font-semibold` with soft semantic backgrounds |

### Charts (Recharts)

`axisLine={false} tickLine={false}`, grid `strokeDasharray="3 3" stroke="#eef2f7"`,
axis text 11–12px `#94a3b8`. Areas use a gradient from the series color at 35% →
0%. Bars have rounded outer corners. Currency axes render `$Xk`.

---

## 5. App shell

`App.tsx` holds three pieces of global state and passes them down:

```tsx
const [page, setPage]     = useState<PageId>('today')
const [period, setPeriod] = useState<Period>({ kind: 'preset', preset: 'month' })
const [payment, setPayment] = useState<PaymentType>('all')
const [goals, setGoals]   = useState<Goal[]>(() => getGoals())  // Admin edits → Overview alerts
const scale = useMemo(() => getScale(period), [period])
```

Page switching is a plain conditional render (no router). `PAGE_META` declares
each page's title, subtitle, and **which filters apply** — the header only shows
a filter on pages where it changes the data:

| PageId | Title | Subtitle | period | payment |
|---|---|---|:--:|:--:|
| `today` | Today | Live daily snapshot of the operation | — | — |
| `overview` | Executive overview | The whole operation at a glance | ✅ | ✅ |
| `insights` | AI Insights | AI summary and insights across every dashboard | — | — |
| `revenue` | Revenue | Estimated vs collected, mix, and ticket by modality | ✅ | ✅ |
| `billing` | Insurance & Billing | Claims, denials, and what payers owe | ✅ | — |
| `patients` | Patients | Funnel, new-patient pipeline, and modalities | ✅ | ✅ |
| `journey` | Patient Journey | Where each patient is in the lifecycle | — | — |
| `marketing` | Marketing | Channels, followers, web, and email campaigns | ✅ | — |
| `team` | Team & Roles | KPIs by role and per-person performance | ✅ | — |
| `employees` | Employees | Per-employee metrics, revenue, and productivity | ✅ | ✅ |
| `treatments` | Treatments | Revenue or occupancy by treatment, and unit usage | ✅ | ✅ |
| `admin` | Admin | Company goals, employees, and roles & permissions | — | — |

When `period` applies, the subtitle gets ` · <period label>` appended.

### Sidebar

Logo block (gold `Activity` icon chip + "Helixona / Operational Dashboard"), the
12 nav items in the order above, and a footer with `CLINIC_NAME` and
"Demo data · placeholder". Icons (lucide): `Sun`, `LayoutDashboard`, `Sparkles`,
`DollarSign`, `FileText`, `Users`, `Route`, `Megaphone`, `Stethoscope`,
`UserCircle`, `Syringe`, `Settings`.

### Header

Title + subtitle on the left (`mr-auto` pushes controls right), then the payment
chip group, then the period chip group. Choosing **Custom** reveals two inline
`<input type="date">` fields bound to the range, each clamped by the other
(`max`/`min`).

---

## 6. Global filters — the math

### Period → `scale`

Every volume metric is multiplied by a scale factor where **1 = one month**:

```ts
const TIMEFRAME_SCALE = {
  today: 1 / 30.42,   // one day
  week: 0.25,
  month: 1,
  quarter: 3,
  ytd: 5.4,
}
const DAYS_PER_MONTH = 30.42
getScale(period) = preset ? TIMEFRAME_SCALE[preset]
                          : rangeDays(from, to) / DAYS_PER_MONTH
```

`rangeDays` is an inclusive day count between two ISO dates (min 1).
`formatPeriodLabel` renders either the preset label or
`"Jun 1, 2026 – Jun 30, 2026 (30 days)"`.

Labels: `Today · This week · This month · Quarter · Year (YTD)`.

> This multiplier is a *simulation*. With real data these become
> date-partitioned queries — see `TIMELINE.md`.

### Payment

`all | cash | insurance` → labels `Cash + Insurance · Cash only · Insurance only`.

Two helpers apply it:
- `paymentMultiplier` → `{cash:1, insurance:0}` etc., used to zero out a series
  in trend charts.
- `paymentShare` → `cash: 0.57`, `insurance: 0.43`, `all: 1`, used to scale a
  single revenue number.

Collection factors (billed → collected): `cash 0.96`, `insurance 0.58`.

### Deterministic noise

```ts
function seeded(n, salt) {
  const x = Math.sin((n + 1) * 12.9898 + salt * 78.233) * 43758.5453
  return x - Math.floor(x)
}
```

Used so generated trends and deltas stay stable across re-renders instead of
flickering with `Math.random()`.

---

## 7. Data contract (`src/types.ts`)

```ts
type Timeframe   = 'today' | 'week' | 'month' | 'quarter' | 'ytd'
type PaymentType = 'all' | 'cash' | 'insurance'
type Trend       = 'up' | 'down' | 'flat'
interface DateRange { from: string; to: string }          // ISO yyyy-mm-dd
type Period = { kind:'preset'; preset:Timeframe }
            | { kind:'custom'; range:DateRange }

interface Kpi {
  id: string; label: string; value: number
  format: 'number'|'currency'|'percent'|'minutes'|'days'
  deltaPct: number; trend: Trend
  lowerIsBetter?: boolean; hint?: string
}

interface TimePoint    { label: string; cash: number; insurance: number }
interface FunnelStage  { stage: string; count: number }
interface RoleMetric   { label: string; value: number; format: Kpi['format']
                         target?: number; lowerIsBetter?: boolean }
interface EmployeePerformance { name: string; metric: number; format: Kpi['format'] }

type RoleId = 'provider'|'bakman'|'pa'|'pcc'|'patientGuide'|'newPatient'
            |'frontDesk'|'ma'|'charlene'|'medic'|'nurse'|'technician'
            |'labs'|'billing'|'ops'|'admin'|'exec'

interface Role     { id: RoleId; name: string; summary: string; source: string
                     headcount: number; metrics: RoleMetric[]
                     leaderboard: EmployeePerformance[] }
interface Employee { id, name, role: string; roleId: RoleId
                     utilizationPct: number; revenue: number; metrics: RoleMetric[] }
interface TodayEmployee { id, name, role; onShift: boolean; patients: number
                          revenue: number; target: number; perfPct: number
                          status: 'ahead'|'on-track'|'behind'|'off' }

type PatientStatus = 'on-track'|'active'|'waitlist'|'declined'
interface PatientRecord { id, name; stageIndex: number; status: PatientStatus
                          modality, coordinator, source, createdAt: string
                          nextAppt?: string; revenue: number; phone, email: string
                          stageDates: (string|undefined)[]; declineReason?: string }

interface Goal { id, label, area: string; value: number; target: number
                 format: 'number'|'currency'|'percent'; lowerIsBetter?: boolean }

interface PayerClaims    { payer; claims; billed; allowable; paid; outstanding
                           avgDaysToPay; denialRate }
interface DenialCategory { category: string; denials: number }
interface AgingRow       { payer; claims; b0_30; b31_60; b61_90; b90plus }
interface MarketingChannel { channel: string; followers: number; leads: number }
interface EmailCampaign  { name; sent; openRate; clickRate; leads }
interface Treatment      { name; treatments; occupancyPct; revenue; capacity; booked }
interface ModalityBreakdown { modality: string; patients: number; revenue: number }
interface OccupancyUnit  { unit: string; capacity: number; booked: number }
interface Alert { id; severity: 'info'|'warning'|'critical'; message; area }
```

### Data-layer API (`src/data/mockData.ts`)

Every function the UI may call. **This is the contract to reimplement against a
real backend.**

```ts
// constants & period
CLINIC_NAME, TIMEFRAME_LABELS, PAYMENT_LABELS
rangeDays(from, to) · getScale(period) · formatPeriodLabel(period)

// executive / revenue
getExecutiveKpis(scale, payment): Kpi[]
getRevenueTrend(payment, mode: 'estimated'|'collected'): TimePoint[]
getRevenueSummary(payment): { estimated, collected, collectionRate, collectedToday }
getModalityBreakdown(scale, payment): ModalityBreakdown[]
getPatientFunnel(scale): FunnelStage[]
getPrograms(): { name, patients }[]

// team & people
getRoles(scale): Role[]
getEmployees(scale, payment): Employee[]
getEmployeesToday(): TodayEmployee[]
getEmployeeTrend(id)

// today
asOfLabel() · getTodayKpis(): Kpi[] · getTodayHourly()
getOccupancy(): OccupancyUnit[] · getHourlyOccupancy()

// patients
PATIENT_STAGES · getPatients(): PatientRecord[] · getNewPatientTeam()
getPatientPopulation(scale) · getSuccessfulLeadSources(scale)
getNewPatientPipeline(scale) · getInactivePatients()

// goals & alerts
getGoals(): Goal[] · getAlerts(goals): Alert[]

// billing
getInsuranceKpis(scale): Kpi[] · getClaimsByPayer(): PayerClaims[]
getDenials() · getDenialsByCpt() · getWriteOffDetail()
getAgingByPayer(): AgingRow[] · getBillingTrend()

// marketing
MARKETING_CHANNEL_LABELS · getMarketingKpis(channel): Kpi[]
getChannelTrend(channel) · getMarketingChannels() · getSocialPosts()
getEmailCampaigns() · getMarketingMetricTrend(metricId, current)

// treatments
getTreatments(scale, payment): Treatment[] · getTreatmentTrend(name)

// trends & AI
getMetricTrend(seedKey, current)   // powers TrendPanel
getAiExecutiveSummary(): string · getAiSections() · getAiRecommendations()
```

### Formatting rules (`src/lib/format.ts`)

```
currency → $1,234   (en-US, 0 decimals)
percent  → 86%      (rounded)
days     → 4.6 d
minutes  → 4.2 min
number   → 1,234
```

`formatCompact` for chart axes/tooltips: `$1.2M`, `$12k`, `1.2k`.

`downloadCsv(filename, headers, rows)` (`src/lib/csv.ts`) builds a CSV with
proper quote-escaping and triggers a Blob download.

---

## 8. Screens

### 8.1 Today — live daily snapshot

No filters (it's always "now"). `asOfLabel()` renders "as of 2:45 PM" with a
pulsing green LIVE dot.

**8 KPIs** (`getTodayKpis`): Patients in today `38` (of 52 scheduled) · Revenue
today `$11,050` (cash $6,240 · insurance $4,810) · Appointments left `14` · New
patients today `5` · Occupancy now `78%` · No-shows today `3` *(lower is better)*
· IVs today `47` · EBOOs today `6`.

**Arrivals by hour** — bar chart, arrivals per hour 8am–5pm with shape
`[3,5,6,7,4,5,6,5,4,2]`; only hours already past show actuals (revenue ≈
arrivals × $290). Clinic hours 8–18.

**Appointments today** — donut: completed / remaining / no-show.

**Team on shift — performance today** — table from `getEmployeesToday()`: patients
seen, revenue, daily target, % vs target, and a status pill.
Status thresholds: **≥100% ahead · ≥85% on-track · else behind**; anyone not in
the shift map is `off`.

Shift map (id → patients / revenue / target): e1 18/4800/4500 · e2 16/3600/3400 ·
e3 14/2900/2800 · e4 9/1900/2000 · e5 11/1400/1300 · e6 24/2100/2400 ·
e8 12/980/900 · e10 16/1450/1300 · e13 7/3100/2800 · e14 11/720/800.

### 8.2 Executive overview

Filters: period + payment. KPIs from `getExecutiveKpis(scale, payment)`:

| id | Label | Value | Format | Δ | Notes |
|---|---|---|---|---|---|
| `revenue` | Total revenue | cash + insurance | currency | +8.4% | |
| `rev-per-employee` | Revenue / Employee | revenue ÷ headcount | currency | +5.1% | |
| `active-patients` | Active patients | 1,280 | number | +3.2% | seen in last 90 days |
| `rev-per-patient` | Revenue / Patient (mo) | revenue ÷ active | currency | +2.7% | monthly ticket |
| `new-patients` | New patients | 96 × scale | number | +12.5% | |
| `avg-wait` | Wait for next appt. | 4.6 | days | −6.0% | lower is better |
| `occupancy` | Unit occupancy | 82 | percent | +4.0% | |
| `ivs` | IVs administered | 1,540 × scale | number | +6.8% | |

**Cards:** Monthly revenue (stacked area, cash vs insurance) · Operational alerts
(dismissible, derived from breached goals) · Patient funnel · Revenue by modality
· Goals grid (progress bars, edited in Admin).

Alerts come from `getAlerts(goals)`: a goal is breached when
`lowerIsBetter ? value > target : value < target`; severity scales with the gap.

### 8.3 AI Insights

Executive summary banner (black `ink-900` background), then one card per area —
**Revenue · Insurance & Billing · Patients · Marketing · Team & Roles ·
Treatments** — each with bullet insights toned `positive | watch | risk`, and a
**Recommended actions** card with `high`/`medium` priorities. Cards link back to
the relevant page via `onNavigate`.

### 8.4 Revenue

Filters: period + payment. Mode toggle **estimated ↔ collected**.

Tiles: Estimated (billed) · Revenue collected · Collection rate · Collected today.
Charts: Monthly revenue (stacked bars, cash vs insurance, reacting to mode) ·
Payment mix (pie) · **Revenue and patients by modality** table with per-row share
bar and **CSV export**.

Base monthly revenue (`getRevenueTrend`, gross):

| | Jan | Feb | Mar | Apr | May | Jun |
|---|---|---|---|---|---|---|
| Cash | 142,000 | 151,000 | 163,400 | 158,900 | 174,200 | 184,500 |
| Insurance | 118,000 | 121,500 | 128,900 | 133,200 | 139,700 | 142,300 |

Collected = gross × `{cash: 0.96, insurance: 0.58}`.

### 8.5 Insurance & Billing

Filter: period only (payment doesn't apply — it's all insurance).

**Payer filter chips**: All · BlueShield · Aetna · Cigna · UnitedHealthcare ·
Medicare · Humana. Selecting one re-scopes every number on the page.

**Revenue-recognition row** (4 tiles, colored on purpose):
Estimated (billed) `amber` — "not money yet" · Expected (allowable) `white` ·
Revenue (collected · in the bank) `emerald` · Appealing Denial Clawback `rose`.

**13 KPIs** (`getInsuranceKpis`): Billed `$291,800` · **Pending claims** `12`
*(lower better — claims created but not yet sent)* · Avg days to submit `1.8 d` ·
Avg days to pay `38 d` · Total denial rate `11%` · Unlocked claims `12` *(open
money until the provider closes the claim)* · Appeals sent in period `41` ·
Unique claims appealed `34` · VOBs completed `286` · Open disputes `12` ·
Write-offs `$14,200` · Claims paid `612` · Outstanding A/R `$412,900`.

**Click-through drill-downs** — the defining interaction of this page:
- **Total denial rate** → *Denials by CPT code* table (CPT, description, denials,
  denial %; ≥12% in rose). Answers "10% denied — but which code?"
- **Write-offs** → *Write-offs by reason* with share bars.
- **Any other KPI** → *Insurance company weight*: how much each payer contributes
  to that metric (additive metrics show %, ratios show relative bars).
- Each drill-down sits beside a `TrendPanel` for that metric.

**Charts/tables:** Billed vs collected month-over-month · Denials by category ·
Claims by payer (with **billed/allowable** toggle for "owed", CSV export) ·
**A/R aging by insurance** (stacked 0-30/31-60/61-90/90+ with a table, CSV export).

Seed — claims by payer:

| Payer | Claims | Billed | Allowable | Paid | Outstanding | Days to pay | Denial % |
|---|---|---|---|---|---|---|---|
| BlueShield | 182 | 248,000 | 152,000 | 121,000 | 127,000 | 182 | 9 |
| Aetna | 134 | 176,500 | 110,300 | 92,400 | 84,100 | 46 | 12 |
| Cigna | 98 | 132,400 | 82,900 | 70,100 | 62,300 | 39 | 8 |
| UnitedHealthcare | 121 | 158,900 | 96,200 | 74,800 | 84,100 | 52 | 14 |
| Medicare | 156 | 121,300 | 88,700 | 81,900 | 39,400 | 28 | 6 |
| Humana | 64 | 71,200 | 44,100 | 35,200 | 36,000 | 41 | 10 |

Denied CPTs: `96365` IV infusion initial 41/18% · `20552` Trigger point 14/12% ·
`99204` New patient visit 12/6% · `36415` Venipuncture 9/4% · `97110` Therapeutic
exercise 7/5% · `99214` Established visit 3/2%.

Write-off reasons: Contractual adjustment $6,400 · Timely filing $3,100 ·
Non-covered service $2,400 · Patient bad debt $1,500 · Small balance $800.

Denials by category: Office visits 18 · IVs 41 · Diagnostics 27 · Procedures 33 ·
Labs 15.

### 8.6 Patients

Filters: period + payment.

**KPI row (3):** Active patients · New patients · Wait for next appt.

**Patient population card** — 6 uniform cells, ratios carry a slim meter:
Total patients `3,240` · IV patients `412` · **Active IV patients / IV scripts
`128/164 · 78%`** (gold accent) · Following plan of care `438 · 34% of active` ·
Total calls `1,720` · Waitlisted `58`.

**Inactive patients** — 90+ days without a visit; click the counter to open a
staff call list with `tel:` links.

**Bottom 2×2 grid:** Conversion funnel · **What's working** (lead sources of
still-active patients: Referral 46 · EBOO landing page 28 · Instagram 22 · Ad
spend 18 · Google/SEO 12) · Program tracks (Wellness & Longevity 600 · Chronic
Illness 412) · Patients by modality.

Funnel base counts: Leads 420 → Contacted 318 → Onboarding 204 → Patients 132 →
1st appt. booked 96, plus Denied/declined 44 rendered in rose as "left the
funnel". Each step shows its own conversion %.

### 8.7 Patient Journey

No filters. Tiles for Active / In pipeline / Waitlist / Declined, then a
searchable patient table (name, stage, modality, coordinator, next appt, days in
pipeline). Clicking a row opens a **6-stage tracker with a date per stage**:
`Lead → Contacted → Onboarding → Patient → First appointment → Active`, plus
source, coordinator, lifetime revenue, contact info, and — when declined — the
reason (e.g. *"Cost — chose not to proceed after pricing"*, *"Insurance not
accepted (out-of-network)"*, *"Unresponsive after 3 outreach attempts"*).

14 seeded patients (`p1`–`p14`) spanning every stage and status.

> This is the only screen that renders PHI (names, phones, emails). With real
> data it needs its own access control — see `TIMELINE.md`.

### 8.8 Marketing

Filter: period. **Channel selector**: All · Web · Instagram · Facebook · X ·
TikTok · YouTube · Email — each channel swaps the entire KPI set:

- **Instagram / Facebook / X**: Followers, New followers, Engagement rate,
  Impressions, Posts, Leads.
- **TikTok**: same but Video views instead of Impressions.
- **YouTube**: Subscribers, New subscribers, Video views, Watch time (hrs),
  Videos, Leads.
- **Web**: Sessions, Users, Bounce rate, Avg session, Conversions, Leads.
- **Email**: Emails sent, Open rate, Click rate, Leads.
- **All**: Total followers, New followers, Website sessions, Emails sent, Email
  open rate, Leads from marketing, Google reviews.

Cards: channel trend (month over month) · Leads by channel · **Post performance**
(social posts ranked by engagement, best → worst) · Email campaigns ·
Followers by channel.

Channels: Instagram 24,800 / 96 leads · Facebook 14,200 / 64 · Google-SEO 0 / 78 ·
TikTok 18,600 / 64 · X 8,900 / 28 · YouTube 6,300 / 36 · Email 9,200 / 38 ·
Referral 0 / 10.

Email campaigns: EBOO awareness 6,200 sent / 42% open / 7.1% click / 88 leads ·
June IV specials 5,400 / 39 / 5.8 / 54 · HRT re-engagement 3,900 / 34 / 4.2 / 31 ·
New patient welcome 3,400 / 51 / 9.4 / 42.

### 8.9 Team & Roles

Filter: period. A chip per role (with headcount badge) + total employee count.
Selecting a role shows its metric grid — metrics with a `target` render a
progress bar that turns emerald when on track, amber when off (inverted for
`lowerIsBetter`) — plus a **Team roll-up** table (role, headcount, highlighted
metric, source).

There is **no per-role "Top performers" leaderboard** (deliberately removed).
The one exception to the single-card layout: selecting **Marie** also renders the
shared **Conversion funnel** beside her metrics.

#### The 16 roles and their metrics

| Role | Source | HC | Metrics |
|---|---|---|---|
| **Provider · Dr. Drannikov** | ECW | 1 | Total appointments 540 · NP appts 96 · NP follow-up appts 88 · Follow-up appts 356 · Established New Patient 72 · Pellets Female 44 · Pellets Male 31 · HRT 58 · PRP 34 · Prolozone 48 · TPI 62 · Acupuncture 84 · Microcurrent 52 · Telemed 76 · TOCPT 18 · Locked charts 512 · Unlocked charts 14 ↓ |
| **Provider · Dr. Bakman** | ECW | 1 | Total appointments 110 · FPE appts (excl. Medicare) 72 · Medicare FPE 38 · **Initial Cairo (DCINTX) 26** · **Regular Cairo (DCTX) 118** · POC reviews 96 · Unlocked charts 11 ↓ |
| **Physician Associate · Brooke** | ECW | 1 | Total appointments 386 · Treatment services appointments 164 · Procedures 248 · TOCPT 22 · Follow-ups 212 · Locked charts 340 · Unlocked charts 9 ↓ |
| **PCC · Patient Care Coordinator** | ECW appt types + 8x8 | 1 | PCC appointments 412 · Follow-up calls NPS 180 · NP f/u 150 · General f/u 220 · MEAD f/u 64 |
| **New Patient Advisor · Marie** | 8x8 + CRM | 1 | Total calls 1,720 · Inbound 540 · Outbound 1,180 · Total leads 420 · Total onboarded 132 · Waitlisted 58 |
| **Patient Guide** | 8x8 + ECW | 1 | Outbound calls 680 · Inbound calls 540 · Patient cases 212 |
| **Front Desk** | ECW + 8x8 (by extension) | 3 | Cash service sales $42,700 *(target 45k)* · Copays & deductibles $18,300 · Inbound calls 2,140 · Calls answered 1,840 · Missed calls 300 ↓ · Voicemails 180 · % inbound answered 86% *(target 90)* · Avg call duration 4.2 min |
| **Medical Assistants** | ECW | 1 | Vitals taken 2,310 · MA Visits 1,140 · Injections 1,480 · Patient messages 1,120 · Extension calls 560 |
| **Virtual MA · Charlene** | ECW | 1 | Chart preps 340 · POP 120 · Care plans 220 · Patient messages 590 |
| **Medics** | ECW | 3 | IV starts 1,620 · IV misses 74 ↓ *(target 50)* · Cost of misses ($3.20/miss) ↓ · IVs administered 1,540 · IVs booked 1,720 · Unlocked notes 21 ↓ |
| **Nurses · Nick** | ECW | 1 | EBOOs performed 188 · EBOO booked 212 · Ratio 3 · Upsells $12,400 · Port access/deaccess 86 |
| **Technician · Kyle** | ECW | 1 | Laser appointments 186 · Locked laser notes 8 ↓ · Diagnostics appointments 248 · Same-day results uploaded 94% *(target 100)* · BioCharger sessions 96 · Locked BioCharger notes 5 ↓ · Unlocked notes (all) 13 ↓ |
| **Lab Draws** | ECW + Lab portals | 0 | Quest draws 180 · MDL draws 96 · Processed by Kyle 210 · Processed by Bea 140 |
| **Billing** | ECW Billing | 2 | Insurance collections $98,400 *(target 110k)* · VOBs 286 · Pending claims 12 ↓ · Avg days to submit 1.8 ↓ · Claims denied 86 ↓ · Denial rate 11% ↓ *(target 8)* · Appeals sent 41 · Unique claims appealed 34 · Open disputes 12 ↓ · Write-offs $14,200 ↓ · Claims paid 612 · **Unlocked encounters 9 ↓** · **Encounters without claims 17 ↓** |
| **Operations Manager · Karina** | ECW | 1 | Avg days of appts per provider 6.2 · Active patients w/o next appt 214 ↓ · Revenue per employee $23,300 · Days to next patient visit (new) 4.6 ↓ |
| **Admin · Shibani** | Admin portal | 1 | Schedule fill rate 84% *(target 85)* · Unit occupancy 82% *(target 80)* · No-shows 96 ↓ · Company goals tracked 7 |

*(↓ = `lowerIsBetter`. Nurses' "# of supplies" is deliberately absent — inventory
is entered manually in the EMR inventory module. MAs' "Plan of care releases" is
likewise hidden. Lab Draws' time-spent metrics and MDL kits are hidden because
that time can't be pulled from the source.)*

### 8.10 Employees

Filters: period + payment. Tiles: Employees shown · Attributed revenue · Avg
utilization · Top performer. Then a table with **search, role filter, sortable
columns, expandable detail rows and CSV export**.

The 18-person roster:

| id | Name | Role | Utilization | Revenue |
|---|---|---|---|---|
| e1 | Dr. Drannikov | Provider | 96% | $96,400 |
| e2 | Dr. Bakman | Provider | 94% | $71,200 |
| e3 | Brooke | Physician Associate | 91% | $58,200 |
| e4 | Marie | New Patient Advisor | 92% | $24,000 |
| e5 | Bee | PCC | 90% | $18,900 |
| e6 | Yazmin | Front Desk | 94% | $24,100 |
| e7 | Haylee | Front Desk | 86% | $18,600 |
| e8 | Charlene (Virtual) | Virtual MA | 91% | $14,200 |
| e9 | Wesley | Medical Assistant | 88% | $12,800 |
| e10 | Bea | Medic | 93% | $30,400 |
| e11 | Juan | Medic | 87% | $24,100 |
| e12 | Nate | Medic | 82% | $20,900 |
| e13 | Nick | Nurse | 95% | $41,600 |
| e14 | Kyle | Technician | 89% | $18,400 |
| e15 | Vignesh | Billing | 93% | $52,300 |
| e16 | Kamalesh | Billing | 88% | $46,100 |
| e18 | Karina | Operations Manager | 90% | $0 |
| e19 | Shibani | Admin | 90% | $0 |

*(`e17` is intentionally absent — that employee was removed; ids are stable, not
sequential.)*

### 8.11 Treatments

Filters: period + payment. Toggle **revenue ↔ occupancy**; clicking a treatment
opens its 6-month trend. Cards: By treatment/modality · Occupancy by unit (booked
vs capacity today) · Occupancy by hour (daily curve 8am–6pm).

**Service catalog** — the single source for treatments, modality breakdowns and
occupancy:

| Service | Patients | Treatments | Occupancy | Revenue | Capacity | Booked |
|---|---|---|---|---|---|---|
| IV Therapy | 540 | 1,540 | 84% | 96,400 | 25 | 21 |
| EBOO | 188 | 212 | 92% | 121,300 | 8 | 7 |
| Platelet-Rich Plasma (PRP) | 64 | 88 | 61% | 78,200 | 6 | 4 |
| Erchonia Laser Therapy | 142 | 410 | 68% | 31,800 | 10 | 7 |
| Neuromuscular Therapy | 132 | 360 | 66% | 26,800 | 10 | 7 |
| LymphStar LET Therapy | 110 | 320 | 63% | 22,100 | 8 | 5 |
| BEMER Therapy | 96 | 280 | 55% | 18,400 | 8 | 4 |
| BioCharger | 88 | 240 | 52% | 14,600 | 6 | 3 |
| SCENAR Therapy | 74 | 190 | 49% | 12,600 | 6 | 3 |
| Biomodulator Therapy | 68 | 160 | 47% | 11,200 | 6 | 3 |
| Chiro | 184 | 520 | 72% | 28,400 | 14 | 10 |
| MEAD Analysis | 96 | 96 | 44% | 6,200 | 6 | 3 |

Units: IV Suite A 7/8 · IV Suite B 6/8 · EBOO Room 1 4/4 · EBOO Room 2 3/4 ·
Exam Room 1 5/6 · Exam Room 2 4/6 · Laser/PRP 4/5.

Occupancy intensity coloring: ≥90% black · ≥75% gold · ≥50% light gold · else slate.

### 8.12 Admin

No filters. A hub of section cards; clicking one drills in with a back button.

- **Company goals** — add / edit / delete. Goals live in `App` state and drive the
  Overview alerts, so edits are visible immediately.
- **Employees** — add, edit, remove.
- **Roles & permissions** — add roles, set what each can see and do.
- **Metrics by role** — pick a role, choose which metrics it's measured by.

Default goals: POC penetration 64/70% · Monthly revenue $326,800/$340,000 ·
Medic misses 96/60 ↓ · Outbound calls 960/1,200 · Claim denial rate 11/8% ↓ ·
Unit occupancy 82/80% · New patients 96/90.

---

## 9. Interaction patterns to preserve

1. **Contextual filters** — a filter only appears on pages where it changes data.
2. **Click-to-trend** — any KPI block opens a 6-month `TrendPanel`; the active
   card gets a gold ring. Billing KPIs open richer drill-downs instead.
3. **Hub → detail** — Admin is a menu of cards with back navigation.
4. **Live cues** — Today shows a pulsing LIVE dot and "as of HH:MM".
5. **Dismiss / expand** — alerts dismiss with an `X`; employee rows expand.
6. **Export where the data is a list** — Revenue, Employees, Claims by payer and
   A/R aging all have CSV export.
7. **Shared components over copies** — the funnel appears on both Patients and
   Marie's role section via one `FunnelChart`.

---

## 10. Content conventions

- **Voice:** English, concise, operational. Labels are nouns ("Inbound calls",
  "Unlocked claims"); hints are short clarifiers ("Open money until the provider
  closes the claim").
- **Revenue recognition is explicit and never blurred:** *Estimated (billed)* ≠
  *Revenue (collected · in the bank)*. Billed amounts are an estimate — insurers
  can deny, delay or claw back until it's in the bank.
- **`lowerIsBetter`** inverts delta coloring and target logic for misses, denial
  rates, wait times, unlocked charts, no-shows.
- **Stock vs flow:** counts that describe a state (total patients, A/R,
  waitlist) must not be multiplied by `scale`; only volumes over the period are.
- Every number in a column gets `tabular-nums`.

---

## 11. Replacing mock data with real sources

The UI needs **no changes**. Reimplement the `get*` functions in
`src/data/mockData.ts` against real sources, preserving the signatures in §7.

Expected mapping (detailed plan in `TIMELINE.md`):

| Data | Real source |
|---|---|
| Patients, appointments, procedures, occupancy | **ECW (eClinicalWorks)** |
| Charges, payments, claims, denials, A/R | **ECW Billing** |
| Calls per agent (inbound/outbound/missed) | **8x8** Analytics for Work API, mapped by extension |
| Followers, engagement, web, email | **Meta Graph API · GA4 · Mailchimp** |
| Leads, funnel stages, targets, tallies | **No system of record yet** — needs a capture surface |

Two practical notes carried over from the integration research:

- `scale` stops being a multiplier and becomes date-partitioned queries; every
  record needs an event timestamp and a cash/insurance tag.
- KPI deltas (`deltaPct`) need a snapshot store — no source provides
  "vs previous period" natively.

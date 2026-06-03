# Helixona · Operational Dashboard

Operational dashboard for a clinic (IV therapy / wellness) built so the founder
can be a **"magnifying glass"** over the business: monitor employees, understand
revenue, and read the whole operation through data, metrics, and KPIs.

> ⚠️ **All current data is placeholder / demo.** It is isolated in
> [`src/data/mockData.ts`](src/data/mockData.ts) so it is trivial to replace
> with real integrations without touching the UI.

## What's included

6 views, with global filters in the header for **reporting period** and
**payment type** (cash / insurance / all):

| View | What it shows |
|------|---------------|
| **Executive overview** | Live KPIs (revenue, revenue/employee, active patients, ticket/patient, new patients, wait for next appt., occupancy, IVs), cash-vs-insurance revenue trend, patient funnel, revenue by modality, and dismissible operational alerts. |
| **Revenue** | Stacked monthly revenue, cash/insurance payment mix, and a revenue + ticket-by-modality table with **CSV export**. |
| **Patients** | Lead → onboarding → patient → 1st booking funnel, new-patient pipeline (pending / onboarded / waitlist / declined), and modality mix. |
| **Team & Roles** | KPIs per role with targets and per-person leaderboards: Front Desk, Medical Assistants, PCC, Nurses, Medics, New Patient Team. Includes a manager roll-up. |
| **Employees** | Per-employee metrics with **search, role filter, sortable columns, expandable detail rows, and CSV export**. |
| **Occupancy** | Unit usage (chairs/beds) vs capacity and an hourly occupancy curve. |

### Filters that actually drive the data
- **Period:** quick presets (This week / month / quarter / YTD) **plus a custom
  exact date range** picker. The selected range rescales all volume-based metrics.
- **Payment:** Cash + Insurance, Cash only, or Insurance only.

## Metrics per role (from the operation notes)

- **Front Desk** — insurance collections, cash sales, calls answered/outbound
- **Medical Assistants** — inquiries, vitals, procedures, Rx refills
- **PCC** — POC appointments, follow-ups, cash sales, POC penetration, % dripping
- **Nurses** — EBOOs, sticks, misses, EBOO booked, upsells ($)
- **Medics** — starts, misses ($3.20/miss), appointments booked, upsells, EOD lockbox
- **New Patient Team** — leads, outbound calls, onboarded, waitlist, declined

## Stack

- React 18 + TypeScript + Vite
- Tailwind CSS
- Recharts (charts)
- lucide-react (icons)

## Development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
npm run lint     # type-check (tsc --noEmit)
```

## Deployment

Pushing to the working branch auto-deploys to GitHub Pages via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):
**https://crpozo.github.io/helixona-operational-dashboard/**

## Connecting real data

Expected sources (per notes): **ECW (eClinicalWorks)** for patients,
appointments, and procedures; **8x8** for calls; and **billing** for collections.

To go live, replace the `get*` functions in `src/data/mockData.ts` with calls to
your API, keeping the same type signatures from [`src/types.ts`](src/types.ts).
The UI layer needs no changes.

### Theming / brand colors

Colors are centralized in two places so they're easy to swap to the Helixona
brand palette: the `brand`/`ink` scales in
[`tailwind.config.js`](tailwind.config.js) and the chart colors in
[`src/lib/colors.ts`](src/lib/colors.ts).

### Suggested next steps (from the notes)

- Dedicated **EBOO** landing page (high demand)
- Email funnel for new leads
- Track lead → patient "distance"/time
- Per-unit/site reports and cross-clinic comparison

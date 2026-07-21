# Helixona Operational Dashboard — Style Guide

The visual language of the Helixona dashboard: a **luxe gold / black / white**
clinical aesthetic. Calm, dense-but-legible, data-first.

---

## 1. Brand colors

The brand palette is gold `#d6b981` + near-black + white. Defined in
`tailwind.config.js` (`brand`, `ink`) and `src/lib/colors.ts` (charts).

### Brand gold (`brand`)
| Token | Hex | Use |
|---|---|---|
| `brand-50` | `#faf7f0` | tints, hover backgrounds |
| `brand-100` | `#f3ebd9` | icon chips, soft fills |
| `brand-200` | `#e8d7b4` | borders on highlighted blocks |
| `brand-400` | `#d9bf8d` | hover borders |
| `brand-500` | `#d6b981` | **primary brand** — active states, buttons |
| `brand-600` | `#c2a163` | hover on gold |
| `brand-700` | `#9c7e44` | gold text on white (active chip text) |

### Ink / near-black (`ink`)
| Token | Hex | Use |
|---|---|---|
| `ink-900` | `#000000` | sidebar background, AI summary banner |
| `ink-800` | `#111111` | dark surfaces |
| `ink-700` | `#1c1c1c` | borders on dark, chart "insurance" series |
| `ink-900` (text) | `#000000` | primary headings/values |

### Semantic (kept on purpose for meaning)
| Color | Hex | Use |
|---|---|---|
| Emerald | `#22c55e` / `bg-emerald-50/500` | positive deltas, "On track", good |
| Rose | `#e11d48` / `bg-rose-50/500` | critical alerts, "Off target", denials, risk |
| Amber | `#f59e0b` / `bg-amber-50/500` | warnings, "watch", estimated (billed) |
| Slate | `#94a3b8`, `#64748b`, `#cbd5e1` | secondary text, axes, muted UI |

### Chart palette (`src/lib/colors.ts`)
```ts
COLORS = { cash:'#d6b981', insurance:'#1c1c1c', accent:'#b08d4f',
           amber:'#f59e0b', rose:'#e11d48', slate:'#9ca3af' }
CATEGORICAL = ['#d6b981','#1c1c1c','#b08d4f','#8a6d3b','#cbb892','#6b7280']
```
- **Cash vs Insurance** = gold vs near-black.
- Categorical charts use a gold → bronze → charcoal family (on-brand, not rainbow).

---

## 2. Typography

- **Font:** Inter (`font-sans`), loaded from Google Fonts; system-ui fallback.
- **Headings / page titles:** `text-lg font-bold text-ink-900`.
- **Card titles:** `text-sm font-semibold text-ink-900`.
- **KPI values:** `text-2xl font-bold tracking-tight text-ink-900`.
- **Big stat numbers:** `text-3xl font-bold tabular-nums`.
- **Labels / metadata:** `text-xs text-slate-400` (or `text-[11px]` for hints).
- **Numbers:** always `tabular-nums` so columns line up.
- **Body copy:** `text-sm text-slate-600`.

---

## 3. Layout

- **Shell:** fixed black sidebar (`w-60`, `bg-ink-900`) + scrollable main area.
- **Page background:** `#f4f6fb` (very light slate-blue).
- **Header:** sticky, `bg-white/80 backdrop-blur`, holds the page title +
  contextual filters (period / payment), shown only where they apply.
- **Content rhythm:** vertical stacks use `space-y-6`; grids use `gap-4`/`gap-6`.
- **Breakpoints:** `grid-cols-1` → `sm:grid-cols-2` → `lg:grid-cols-3/4`.

---

## 4. Core components

### Card (`src/components/Card.tsx`)
The default container.
```
rounded-2xl border border-slate-200 bg-white p-5 shadow-sm
```
- Optional `title`, `subtitle`, and an `action` slot (top-right) for toggles,
  export buttons, or icon chips.

### KPI card (`src/components/KpiCard.tsx`)
```
rounded-2xl border border-slate-200 bg-white p-4 shadow-sm
hover:shadow-md
```
- Label (top-left) + delta pill (top-right) + big value + hint.
- **Delta pill:** emerald when good, rose when bad; arrow up/down/flat.
- **Clickable variant:** add `onClick`/`active` → cursor-pointer, gold ring when
  active (`border-brand-500 ring-2 ring-brand-100`). Opens a trend panel.

### Buttons
- **Primary action:** `bg-brand-500 text-ink-900 hover:bg-brand-400` (gold w/
  black text for contrast).
- **Secondary / outline:** `border border-slate-200 bg-white text-slate-600
  hover:border-brand-300 hover:text-brand-700`.
- **Active filter chip / tab:** `bg-brand-500 text-ink-900` (gold + black).
- **Inactive chip:** `bg-white text-slate-500 hover:border-brand-400`.

### Inputs
```
rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm
outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100
```

### Sidebar nav item
- **Active:** `bg-brand-500 text-ink-900 font-semibold` (gold).
- **Inactive:** `text-slate-300 hover:bg-ink-700 hover:text-white`.

### Tables
- Header row: `border-b border-slate-200 text-xs uppercase tracking-wide
  text-slate-400`.
- Body rows: `border-b border-slate-100`, numbers `text-right tabular-nums`.
- Rows are clickable where there's a detail/expand (hover `bg-slate-50`).

### Pills & status chips
- Rounded-full, `text-xs font-semibold`, soft semantic background:
  `bg-emerald-50 text-emerald-700` (good), `bg-rose-50 text-rose-700` (bad),
  `bg-amber-50 text-amber-700` (watch), `bg-brand-50 text-brand-700` (brand).

---

## 5. Iconography

- **Library:** [lucide-react](https://lucide.dev), `h-4 w-4` / `h-3.5 w-3.5`.
- **Icon chips:** `h-8 w-8 rounded-lg bg-brand-100 text-brand-700` (section
  accents), or `h-11 w-11 rounded-xl` on Admin menu cards.
- One icon per nav item and per AI/section card.

---

## 6. Charts (Recharts)

- **No chart borders/gridlines noise:** axes have `axisLine={false}
  tickLine={false}`, grid is light dashed `stroke="#eef2f7"`.
- **Axis text:** `fontSize 11–12, fill #94a3b8`.
- **Area charts:** gradient fill from the series color at 35% → 0%.
- **Bars:** rounded outer corners (`radius={[6,6,0,0]}` or `[0,6,6,0]`).
- **Currency axes:** `$Xk`; tooltips use `formatCompact`.
- Cash = gold, Insurance = near-black; categorical bars cycle `CATEGORICAL`.
- **Occupancy intensity:** ≥90% black, ≥75% gold, ≥50% light gold, else slate.

---

## 7. Interaction patterns

- **Contextual filters:** period (Today/week/month/quarter/YTD + custom range)
  and payment (cash/insurance) appear in the header only on pages where they
  change the data.
- **Click-to-trend:** KPI blocks are clickable → a 6-month trend panel.
  Billing KPIs open a richer drill-down (insurance weight, CPT denials,
  write-off reasons).
- **Hub → detail:** the Admin page is a menu of section cards; click one to
  drill in, with a back button + breadcrumb.
- **Live cues:** the Today page uses a pulsing green "LIVE" dot + "as of HH:MM".
- **Dismissible / expandable:** alerts dismiss with an `X`; tables expand rows
  for per-item detail.

---

## 8. Number & label formatting

- Money: `$1,234` (no cents) via `Intl.NumberFormat`; compact `$12k` / `$1.2M`
  in charts.
- Percent: whole numbers `86%`. Days: `4.6 d`. Minutes: `4.2 min`.
- "Lower is better" metrics (misses, denial rate, wait time) invert the
  good/bad coloring.

---

## 9. Voice

- English, concise, operational. Labels are nouns ("Inbound calls", "Unlocked
  claims"), hints are short clarifiers ("Open money until the provider closes
  the claim").
- Revenue recognition language is explicit: **Estimated (billed)** ≠ **Revenue
  (collected · in the bank)**.

---

*Source of truth: `tailwind.config.js`, `src/lib/colors.ts`, `src/lib/format.ts`,
and the components in `src/components/`. Update this doc when those change.*

# Timeline · Real-data integration — Helixona Operational Dashboard

**Goal:** connect the dashboard (today 100% mock) to the operation's real data:
**ECW (eClinicalWorks)** as the primary source via an extraction bot, plus **8x8** (calls),
**billing/claims** and **marketing** (Instagram, Facebook, Web, Email).

**Prepared:** July 14, 2026
**Start:** Monday, July 20, 2026
**Launch target: Friday, September 25, 2026** (end of week 10), with a contingency week
through **October 2**.

> **How a September deadline works.** The full scope, realistically estimated (with
> setback multipliers and an adversarial review of the estimates), takes ~18 weeks. End of
> September is 10 weeks away. The honest way to hit it is **date-fixed, scope-flex**: the
> launch date does not move; anything that slips drops into the **October depth phase**
> instead of moving the date. What ships on Sep 25 and what lands in October is defined
> below — up front, not discovered in week 9.

---

## 1. Executive summary

| Milestone | When | What it includes |
|---|---|---|
| **M1 · First real data** | Week 4–5 (≈ Aug 14–21) | Today + Overview with ECW data on the private dashboard, via *any* ingestion path (manual CSV downloads count) |
| **M2 · Calls & marketing** | Week 7–8 (≈ Sep 4–11) | 8x8 via official API + Meta/GA4/Mailchimp live |
| **M3 · Billing v1** | Week 9 (≈ Sep 18) | Revenue, payments, A/R and approximate denials from standard reports |
| **M4 · Launch** | **Week 10 (Fri Sep 25)** | Launch scope live (see below); funnel/tallies and insurance metrics <45 days flagged **"provisional"** |

Buffers still apply where they can: ×1.5 on our own dev estimates, ×2–3 calendar on
anything gated on third parties — which is why **nothing ECW-gated sits on any milestone's
critical path** (not eBO, not the EHI export, not report scheduling). eClinicalWorks
support runs at ~3.3/5 CSAT with documented months-long ticket anecdotes; we plan around
them, never through them.

### What ships September 25 vs. what lands in October

| ✅ Launch scope (Sep 25) | 🔜 October depth phase (weeks 11–16) |
|---|---|
| Today + Overview with real ECW data | eBO claims-level detail (allowable, real denial codes) — if signed |
| Revenue basics: revenue, payments, cash/insurance mix, A/R | Denials-by-category detail (launch has approximate mapping only) |
| Team & Employees with real 8x8 call metrics | Patient Journey full mini-app (per-user login, RBAC, PHI access log) |
| Marketing view live (Meta, GA4, Mailchimp) | PCC / Nurses / Medics team sections + the 2 Overview goals that reference them |
| Patients funnel from the new lead capture — **flagged provisional** (~7 weeks of history) | Funnel maturity; staff-adoption exit criterion (≥90% two straight weeks) |
| Patient Journey **descoped v1**: initials + MRN + coordinator, no contact info | Bot hardening; retiring any remaining human-in-the-loop CSV downloads |
| 6 months of historical backfill | Remaining 6 months of backfill; EHI export enrichment when ECW delivers it |
| Insurance figures live but **provisional** | Insurance validated against the September month-end close with the biller (early Oct) |

### The conditions this date depends on (the deal)

1. **2 developers, full-time, from day 1** — with one dev this plan does not exist in 10
   weeks in any form.
2. **Week-1 gates resolve in week 1:** ECW admin access exists (or the support ticket is
   open on day 1), the 8x8 X4 seat is confirmed or purchased, dev BAA signed, the public
   GitHub Pages deploy neutralized.
3. **Founder decisions within 48 hours** — the decision table below has dates and
   defaults; at this pace the default applies immediately, no grace period.
4. **eBO is out of launch scope, definitively.** Quote it anyway (it feeds October), but
   nothing waits for it.
5. **Scope flexes, the date doesn't.** When week 7–9 gets tight (it will), the flex order
   is pre-agreed: denials detail → Patient Journey v1 → marketing niceties → backfill
   depth. Core ECW + revenue + calls never flex.

### Assumptions and capacity math

- **2 developers with named lanes** (the phase-weeks only fit if nobody rides two lanes
  at once):
  - **Dev A — ECW lane:** P2 ingest (W2–5) → P3 RPA bot (W5–9) → billing report depth
    rides the same parser pipeline (W7–9, incremental — and it is the first thing to flex).
  - **Dev B — platform lane:** P1 infra + hosting (W2–3) → P8 serving skeleton +
    Today/Overview (W3–4) → P4 8x8 (W4–6) → P5 marketing (W6–7) → P8 remaining views (W7–10).
  - **P7 manual capture:** office manager as operational owner + shared dev hours.
- **Weeks 7–9 are the crunch zone.** Four workstreams converge; the contingency week and
  the pre-agreed flex order exist precisely for this.
- ECW assumed **cloud** (worst case). If it turns out self-hosted/on-prem there is direct
  MySQL access and the ECW lane compresses ~3–4 weeks — at this deadline, that's the
  difference between tight and comfortable (ask on day 1).
- **Clinic-side hours committed up front:** founder 2–4 h/wk (48-h decision SLA);
  **office manager 3–5 h/wk** on P0, P7 and P9; **biller** 2 h in P0 (denial-code and
  cash-vs-insurance mapping) + 2–4 h at the September close (early Oct); front desk
  ~10 min/day for CSV downloads until the bot takes over.
- Budget for: one 8x8 X4 seat if missing, BAA-covered cloud hosting, Google
  Workspace/M365 mailbox for report delivery.

---

## 2. What depends on each source

From the metric-by-metric inventory of the dashboard:

| Source | % of dashboard | What it provides | Extraction method | Risk |
|---|---|---|---|---|
| **ECW clinical/schedule** | ~40% | Patients, appointments, no-shows, procedures (IVs, EBOOs…), occupancy | CSVs (manual → scheduled if license allows → **Playwright bot**) | High (legacy UI, MFA, version updates) |
| **ECW billing/claims** | ~25–30% | Charges, payments, claims by payer, denials, A/R, cash vs insurance | Standard reports; **eBO** (Cognos) as post-launch upgrade | High (ECW/license-gated) |
| **8x8** | ~5–8% | Inbound/outbound/missed calls per agent, duration | **Official API** (Analytics for Work, `/extsum` + `/cdr`) | Low–medium (needs one X4+ seat) |
| **Marketing** | ~10% | Followers, engagement, web sessions, email campaigns | **Official APIs**: Meta Graph (internal app), GA4, Mailchimp | Low |
| **Manual / no system** | ~20% | **Leads (no system of record exists!)**, targets, stars/misses, upsells, lockbox, capacities, rosters | Capture forms + config tables | High (discovery + habit change) |

> ⚠️ **The two datasets that can never be recovered later:** (1) **leads** — they live in
> no system, so every week without capture is funnel history lost forever; (2) Meta
> **followers** — the API has no backfill. Both start in weeks 2–3, not when their phase
> "comes up."

---

## 3. Plan by phase

```
Week:                1  2  3  4  5  6  7  8  9  10 11
P0 Discovery         ██ ██
P1 Infra + hosting      ██ ██                          Dev B
P2 ECW v1 ingest        ██ ██ ██ ██                    Dev A
P3 ECW RPA bot                   ██ ██ ██ ██ ██  →Oct  Dev A
P4 8x8                        ██ ██ ██                 Dev B
P5 Marketing                        ██ ██              Dev B
P6 Billing v1                       ██ ██ ██ ██        biller→Dev A
P7 Lead capture            ██ ██ ██ ██ ██ ██ ██  →Oct  office mgr
P8 Dashboard wiring        ██ ██ ██ ██ ██ ██ ██ ██     Dev B
P9 Validation                                 ██ ██
Contingency                                        ██
                                 ▲M1       ▲M2 ▲M3 ▲M4=LAUNCH Sep 25
```

Week 11 (Sep 28 – Oct 2) is the named contingency: absence, accumulated break-fix, late
decisions. If it arrives empty, we're simply a week early into the October depth phase.

### P0 — Discovery, access & compliance (weeks 1–2 · Jul 20–31)

The phase that answers "we don't always know where things are." Everything here is cheap
and unblocks the rest. **At this deadline, P0 slippage is unrecoverable — it gets daily
follow-up, not weekly.**

**⛔ Day-1 task (hard gate, blocks M1):** the repo currently **auto-publishes every push
to a public GitHub Pages site**. Before a single real datum exists: neuter `deploy.yml`
(delete it or chain it to a mock-only `demo` branch) and put in writing that **no real
data lands in any branch that feeds Pages**. A careless push with patient data on a public
site is a reportable incident, not a bug.

**Discovery checklist (week 1) — with evidence, not promises:**
1. Is ECW cloud or self-hosted? *(the single most important fork — self-hosted = direct
   SQL and a comfortable September)*
2. **Who holds ECW admin rights?** If nobody, open the ECW support ticket **today** (their
   queue is measured in weeks). Create the least-privilege "reporting" service user with
   TOTP and **manually verify it can open every target report** (billing reports are
   often gated by security class).
3. Can recurring reports be **scheduled** (CSV by email) on our license tier?
   **Verify by actually scheduling one** — screenshot as the deliverable. Public evidence
   suggests this is eBO-gated on many tiers; the plan does NOT depend on the answer being yes.
4. Ask the ECW account manager: **eBO quote** (for October, nothing waits on it), and
   whether **read-only DB access** is purchasable (~$200/mo/provider — they have offered
   it; ask).
5. Request the **EHI population export** (free) — strictly October+ enrichment; with
   ECW's track record, expect months.
6. Is there an 8x8 user with an **X4+ license** and "Analytics for 8x8 Work"? **Who can
   log into the Admin Console** (sometimes an MSP/reseller runs it)? If the seat is
   missing, buy it now (+1–2 weeks procurement). Without X4 there is **no 8x8 data path
   at all**, not even the CSV interim.
7. Which **Business Manager** owns the Instagram/Facebook accounts (an agency?) and do we
   have admin? Start Meta **Business Verification** now.
8. Where do **leads** live today? Who captures waitlist, declines and reasons?
9. Do **cash** sales run through ECW billing or a separate POS (Square/Stripe)? If POS:
   API integration ~1 week or an EOD reconciliation sheet (2 days), inside P6.
10. Does ECW have **room/resource scheduling** configured? (without it there is no real
    occupancy)
11. Where do **SMS** counts come from (8x8 vs ECW messaging), are **program tracks** coded
    in ECW or manual tags, and does any report export **open slots** (or is that an RPA
    target)?
12. Definitions session with the founder (week 1–2, defaults pre-written): "revenue
    today" (billed or collected?), "wait for next appt", "missed call" (ring groups
    overcount), **Today-view refresh cadence** (hourly bot run / 3× daily / daily with an
    "as of HH:MM" badge), and **revenue-attribution rules per employee** (politically
    sensitive — it will be re-litigated in P9; a formal revision slot exists).

**Compliance lane (parallel; owner: founder + office manager):**
- If the devs are contractors: **dev↔clinic BAA signed in week 1**, before touching the
  first PHI-bearing CSV (standard template, 1 day of work — but it needs the founder's
  signature).
- Inventory every vendor touching PHI (VM, mailbox, backups, error tracking) and each
  one's BAA status. The **report mailbox must be a clinic-domain Workspace/M365 account
  under BAA** — a personal Gmail cannot receive patient-level CSVs — with 30-day
  auto-purge post-ingestion.
- Update the practice's **Security Risk Analysis** (new system, bot credential inside the
  EHR, PHI landing zone), signed by a **named Security Officer** — at this clinic size
  probably the founder or office manager, who may not know they hold the role. Includes a
  30-minute tabletop: "the CSV went to the wrong recipient."

**Founder decisions — week 1:** 8x8 X4 seat budget · authorize eBO quote · sign dev BAA ·
OK to neutralize Pages.
**Founder decisions — week 2:** where leads are captured (default: our own structured
form) · metric definitions · Today cadence · attribution defaults · **Patient Journey
launch scope** (descoped v1 is the default at this deadline).

**Deliverable:** decisions doc + confirmed metric→source→method matrix.

### P1 — Infrastructure & private hosting (weeks 2–3 · Jul 27–Aug 7 · Dev B)

Compressed to 2 weeks by buying instead of building where possible (managed Postgres,
managed secrets).

- Single host (BAA-covered cloud VM), Docker Compose: Postgres (raw `jsonb` landing +
  mart tables), scheduler (cron/pg-boss — Temporal/Airflow are overkill), Playwright
  worker, dashboard output.
- **The React dashboard is served from this host behind authentication** (reverse proxy +
  TLS + SSO/basic-auth). This replaces GitHub Pages and **is an M1 prerequisite**.
- Secrets via SOPS or a managed secrets store (never a plaintext `.env` in git).
- **Monitoring from day 1:** dead-man's-switch per job (Healthchecks.io), data-quality
  tripwires (row count vs trailing average, not-null on key fields, report footer total vs
  parsed rows — selector drift and row caps produce *silently empty or truncated data*,
  not crashes), per-source freshness badge on the dashboard. Alerts carry **job status
  only, never data**.
- **Generic daily stock-metric snapshot job (week 3)** — everything that is a
  point-in-time value and can't be recomputed later: Meta followers (first registration —
  the internal app from P0 exists; every day without a snapshot is lost), outstanding A/R,
  waitlist, active-patients-90d. Every later phase registers its stock metrics the week
  its ingestion starts.
- **Config tables v0, seeded from P0 answers** (weeks 2–3; ~25 static rows, not
  engineering): identity mapping **ECW user ↔ 8x8 extension ↔ roster**, service-code →
  modality catalog (14 services), capacity per room/unit. Edit surfaces come later; the
  data exists now. **Roster + mapping v0 are M1 prerequisites.**
- HIPAA hardening: AES-256 at rest, TLS 1.2+, MFA/RBAC, audit logs. The aggregate
  dashboard sees only counts and rates; PHI-bearing rows stay in the landing zone.

**Deliverable:** dashboard privately served + skeleton pipeline with one monitored job +
snapshots running + config v0 loaded.

### P2 — ECW v1: report ingestion (weeks 2–5 · Jul 27–Aug 21 · Dev A)

**M1's official path is the humble one:** front desk downloads 4–5 CSVs
(schedule/appointments, claims/AR, payments, CPT, registry) to a shared folder starting
week 2 (~10 min/day). The parser ingests from the folder **identically** whether the CSV
arrived by human, scheduled email, SFTP or bot — so M1 survives any ECW answer about
scheduling. If P0 confirmed schedulable reports, connect them and the human leaves the
loop; if not, the P3 bot replaces them.

- **Per-report parsers, not generic ones** (0.5–1 day each × 5): ECW exports carry title
  blocks, footer totals, merged-cell Excel layouts and per-report date formats.
  Truncation detection on every load.
- Idempotent loads into Postgres; A/R and other stock metrics registered in the snapshot job.
- **Historical backfill without waiting on ECW:** the same reports accept date ranges —
  run them month-by-month backwards. **Launch target: 6 months** (fills Overview trends
  and deltas); the remaining 6 months land in October. The EHI export, whenever it
  arrives, only enriches.
- Implement the **Today cadence decided in P0** (if intraday: a lightweight
  schedule/check-in export every 30–60 min during clinic hours).

**🏁 MILESTONE M1 (week 4–5):** Today + Overview with real ECW data on the private
dashboard. Honest freshness label ("data as of HH:MM"). Charts with partial history say
so on screen.

### P3 — RPA bot on ECW (weeks 5–9 · Aug 17–Sep 18 · Dev A dedicated · hardening continues into October)

For non-schedulable reports and to retire the human from daily downloads. Commercially
proven (ECW's own blog promotes RPA bots) but the most fragile piece of the project.
**At this deadline the bot's job is to cover what manual downloads can't; full automation
of everything is an October goal — it is acceptable to launch with some human-in-the-loop
downloads still standing.**

- Playwright: login + TOTP (pyotp) in short login→export→logout bursts (ECW session
  timeouts are short). **ECW is single-session:** a human logging into the bot account
  kills the bot's session and looks like flakiness — "nobody logs in as the bot" goes in
  the runbook. Stable egress IP (ask ECW about allowlisting); every bot click lands in
  ECW's audit trail under the service user — documented in the SRA.
- Legacy JSP UI with iframes: selectors by label/ARIA, never generated IDs. Prefer
  **native CSV download buttons** over screen-reading tables.
- Browser artifacts (screenshots, traces, HAR) **disabled or scrubbed**: they capture PHI.
- Verify with whoever holds the ECW contract that there is no clause against automated
  access.

### P4 — 8x8 (weeks 4–6 · Aug 10–28 · Dev B)

- Official **Analytics for 8x8 Work** API: `GET /extsum` returns exactly what
  Team/Employees need (Inbound_Answered, Inbound_Missed, Outbound_Total per extension) in
  one call per window; `/cdr` for drill-down. 30-min tokens → refresh in the ETL.
- The extension ↔ employee mapping already exists (P1 config v0).
- Low-effort interim if the API drags: a scheduled daily CSV report from 8x8 (**same X4
  license prerequisite** — there is no path without the seat; and schedules die silently
  if the owning user is removed).
- Backfill: up to 2 years **or since Analytics was enabled per extension**, whichever is
  shorter.

### P5 — Marketing (weeks 6–7 · Aug 24–Sep 4 · Dev B, serialized after P4)

- Meta Graph API with a **System User token** (never expires; user tokens die at 60 days
  or on password changes — alert on error 190 and on freshness). The follower snapshot has
  been running since P1.
- GA4 Data API (service account) and Mailchimp Reports API: ~1 week combined.
- **GA4 event tagging on the website** (booking/contact form submits as key events,
  consistent UTMs): its own task — feeds "conversions" and P7's lead attribution.
- "Leads by channel" requires UTMs flowing into lead capture (P7).

**🏁 MILESTONE M2 (week 7–8):** 8x8 + marketing live in Team/Employees and Marketing.

### P6 — Billing v1 (weeks 6–9 · Aug 24–Sep 18 · biller first, Dev A incrementally)

- Week 6 is biller mapping (denial codes → categories, cash vs insurance, payer master)
  and report configuration — low dev load while Dev A is deep in P3.
- **Billing v1 = the plan's default:** standard reports + RPA, riding the same parser
  pipeline as P2/P3 (incremental work, not a new build). Revenue, payments,
  cash/insurance mix, A/R, approximate denials.
  If cash runs through a separate POS, its integration or EOD sheet lands here.
- **eBO is an October upgrade, never a dependency.** Honest math: quote (2–4 wks) +
  decision + contract + provisioning (4–10 wks) + Cognos curve = post-launch in every
  scenario. **Founder decision week 4: sign or kill** — signed in week 4 puts claims-level
  detail in late October.
- **This phase's depth is the first thing that flexes** when weeks 7–9 crunch: denials
  detail drops to October before anything else does.
- **🏁 MILESTONE M3 (week 9):** Revenue + a basics-level Insurance & Billing view with
  real *standard-report* data.

### P7 — Lead capture & manual data (weeks 3–9 · Aug 3–Sep 18 · office manager + shared dev · adoption continues into October)

What no bot can scrape because **the system doesn't exist** — and half of the real
critical path:

- **Week 3: interim lead-capture form in production** (Google Form/Airtable/Tally →
  nightly import to Postgres) with the funnel fields: stage with timestamps (Lead →
  Contacted → Onboarding → Patient → 1st appt), coordinator, source, decline reason. The
  tool decision was made in week 2 (default: our own form). Every week before this is
  unrecoverable funnel history.
- **Adoption runs on an exit criterion, not a date:** weekly compliance metric — entries
  logged vs actual ECW procedures (the denominator is computable!) — reviewed with the
  founder; exit = **≥90% two consecutive weeks**. At a Sep 25 launch there will be ~7
  weeks of capture history: **the funnel launches flagged "provisional"** and the exit
  criterion most likely completes in October. That is the honest version.
- Founder must communicate **before** rollout: does manual capture affect anyone's
  performance evaluation? If staff suspect it does, they'll game the numbers.
- Capture surfaces: targets per role/employee and goals (with an owner), tallies
  (stars/misses, upsells, % dripping, lockbox — attached to existing rituals: the EOD
  lockbox count already happens; stars/misses where the MA already documents the stick),
  shift roster, weekly-review tracker, and admin surfaces for the P1 config tables.

### P8 — Continuous dashboard wiring (weeks 3–10 · Aug 3–Sep 25 · Dev B)

**Not a final phase: a continuous lane, view by view, from week 3** (this is how M1 and
M2 are possible). Order: serving skeleton + Today + Overview (W3–4) → Team/Employees with
8x8 (W6–7) → Marketing (W7–8) → Revenue/Billing (W8–9) → Patients funnel (W9) → Patient
Journey descoped v1 (W9–10).

- **The frontend has no data plumbing today:** the `get*` functions in
  `src/data/mockData.ts` are synchronous and called directly in render — no fetch, no
  loading, no error states, no auth. The first deliverable (W3–4, ~1.5–2 dev-weeks) is
  the skeleton: async data layer with loading/error states + the first wired view. The
  type contract in `src/types.ts` is preserved.
- Filters go from fake multipliers to real queries: date-partitioned ranges, real
  cash/insurance per record. Deltas read the snapshots accumulating since week 3.
- **Patient Journey at launch is the descoped v1**: initials + MRN + coordinator, no
  patient contact info — names/phones/emails as a static JSON behind a shared password is
  not acceptable, and the proper mini-app (per-user login, role scoping, PHI access log)
  is October work.
- **PCC / Nurses / Medics sections are October work** (they are new UI construction on
  top of P7 tally data); the 2 Overview goals that reference them are explicitly descoped
  from launch.

### P9 — Validation & stabilization (weeks 9–10 · Sep 14–25)

- Parallel run validating **by data type**: cash/operational against the founder's and
  office manager's known reality (day's revenue, appointments, calls) — this is what
  gates the launch.
- **Insurance metrics cannot be fully validated before Sep 25** — payer payments lag 2–6+
  weeks. They launch flagged **provisional** and get reconciled against the **September
  month-end close with the biller in early October** (2–4 h). Denial-rate validation
  needs 60–90 day windows and completes in October. We say this on the dashboard, not in
  a footnote.
- Permanent product feature: insurance figures under **45 days show "provisional"**.
- Runbooks: broken scraper, credential rotation, MFA re-auth, "nobody logs in as the bot."
- **🏁 MILESTONE M4 — LAUNCH (Friday, September 25).**

### Contingency (week 11 · Sep 28–Oct 2)

Named for what this plan knows exists: absence, accumulated break-fix, late decisions.
If launch slipped, it lands here; if not, October depth work starts a week early.

### October depth phase (weeks 11–16)

Everything in the right-hand column of the launch-scope table: bot hardening and full
automation, denials detail (or eBO if signed in week 4), the Patient Journey mini-app
with RBAC and access logging, PCC/Nurses/Medics sections, remaining backfill, funnel and
tally maturity, insurance validation against the September close, and the formal
revenue-attribution revision session once staff have seen their numbers on screen.

---

## 4. Top risks and plan B

| # | Risk | Prob. | Impact | Mitigation / Plan B |
|---|---|---|---|---|
| R1 | ECW turns out **self-hosted** (positive risk!) | Medium | −3–4 wks | Direct MySQL; the ECW lane compresses and September gets comfortable |
| R2 | ECW reports **not schedulable** on our license | **High** | None on M1 | M1's official path is already the manual download; the bot automates later |
| R3 | **Week 7–9 crunch** (4 workstreams converge) | **High** | Scope, not date | Pre-agreed flex order: denials detail → Journey v1 → marketing niceties → backfill depth |
| R4 | ECW update **breaks the bot** (recurring) | High | 1–2 days per event | Robust selectors, empty/truncated-data tripwires; contingency week absorbs it |
| R5 | No 8x8 **X4+ seat** (without it there is NO 8x8 path) | Medium | +1–2 wks | Buy in week 1; it's the first checklist question |
| R6 | **Nobody has ECW admin** / insufficient security class | Medium | +2–6 wks — the one risk that can genuinely kill Sep 25 | Identify day 1; ECW ticket in week 1; if unresolved by week 3, re-baseline the date honestly |
| R7 | Staff **don't adopt** lead/tally capture | Med–high | Funnel launches thin | <30-sec forms tied to rituals, weekly compliance metric; funnel is provisional at launch by design |
| R8 | **BAA/SRA paperwork stalls** on the founder's signature | Medium | Blocks PHI access (wk 2–3) | Dates + defaults in the decision table; templates ready week 1 |
| R9 | Careless push publishes **real data on public Pages** | — | Reportable incident | Deploy neutralized day 1 (M1 gate); CI fails the public build if it references a real API |
| R10 | ECW reports with **silent row caps/truncation** | Medium | Invisible partial data | Footer-total vs parsed-rows tripwire; exports split by date range |
| R11 | Third-party accounts held by an **agency/MSP** (Meta BM, 8x8 admin) | Medium | +days–weeks | Ownership questions in week 1; claim/migrate assets as an owned task |
| R12 | ECW MFA/session policy changes | Medium | +2–5 days | Dedicated service account, re-enrollable TOTP, documented human-in-the-loop |
| R13 | **Absence/sickness** across August/September | High | ~1–1.5 wks per dev | Contingency week + flex order; single-owner lanes avoid cross-blocking |
| R14 | General underestimation (planning fallacy) | — | — | ×1.5 own dev, ×2–3 calendar on third parties; date-fixed/scope-flex absorbs the rest |

## 5. After launch: maturation and maintenance

This doesn't end on September 25:

- **October (weeks 11–16):** the depth phase above. "Provisional" labels fall off as
  history matures.
- **2–5 h/week** steady-state maintenance (the industry underestimates this 4–6×).
- **1–2 day spikes** whenever ECW ships a version update or Meta deprecates metrics
  (both recurring; Meta has deprecation waves already announced).
- Every source migrated from scraping to an official API/report (eBO, FHIR gaining
  coverage) roughly **halves** its share of the maintenance tax.

## 6. Founder decisions (with date and default)

| Week | Decision | Default if undecided |
|---|---|---|
| 1 | 8x8 X4 seat budget · authorize eBO quote · sign dev BAA · OK to neutralize Pages | Without the seat there is no 8x8 data (gap accepted); Pages gets neutralized regardless (non-negotiable with PHI) |
| 2 | Where leads are captured · metric definitions · Today cadence · attribution v0 · Patient Journey launch scope | Own form; team's proposed definitions; Today daily with freshness badge; simple attribution by rendering provider; Journey descoped to initials + MRN |
| 4 | Sign or kill **eBO** (for October delivery) | eBO dead (billing v1 stands) |
| 9–10 | Launch sign-off (cash/ops validation) — insurance reconciles vs September close in early Oct | No default: no sign-off, no launch |

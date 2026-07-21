# Timeline · Real-data integration — Helixona Operational Dashboard

**Goal:** connect the dashboard (today 100% mock) to a **usable** version of the
operation's real data: **ECW (eClinicalWorks)**, **8x8** (calls), billing basics, and
marketing (Instagram, Facebook, Web, Email).

**Prepared:** July 14, 2026
**Start:** Monday, July 20, 2026
**Target: 6 weeks — launch Friday, August 28, 2026.**

> ⚠️ **This estimate has one condition.** Six weeks assumes the clinic hands over
> **access and answers fast, starting week 1** — who has ECW admin rights, whether an
> 8x8 X4 seat exists, where cash sales are recorded, where leads live, and so on.
> **Every day the team takes to get us this data — or to even figure out where it
> lives — adds a day (often more) to the 6 weeks.** This is a best-case timeline for
> fast cooperation on data/access, not a guarantee independent of it.

A visual-only Gantt of this plan is published as an artifact; ask for the link if you
need it again. This document is the source of truth for what's in and out of scope.

---

## What "usable in 6 weeks" means

At this pace we are not attempting the full integration (that realistically runs
~18 weeks end-to-end — see the phase notes below for what's deferred). Six weeks buys a
dashboard that replaces the mock data for the metrics that don't depend on systems that
don't exist yet:

**In scope for week 6:**
- Today + Overview with real ECW data (appointments, procedures, patients — via manual
  CSV downloads, not yet an automated bot)
- 8x8 call metrics per employee (if a licensed seat is confirmed in week 1)
- Marketing view (Instagram, Facebook, GA4, email campaigns) via official APIs
- Revenue basics: revenue, payments, cash/insurance mix, A/R from standard reports

**Explicitly out of scope for week 6** (not because they don't matter — because rushing
them produces bad data):
- The patient funnel and Patient Journey view — there is **no system of record for
  leads today**; that has to be built and adopted by staff before this data means
  anything
- Claims-level billing detail (eBO) — separate licensing/procurement timeline
- PCC / Nurses / Medics team sections
- Full historical backfill (only a partial window in 6 weeks)
- RPA-bot automation of ECW — week 1–6 relies on manual CSV downloads; the bot that
  removes that manual step is later hardening work

## Assumptions

- **2 developers, full-time.** With 1 dev, 6 weeks is not realistic — the lanes below
  don't compress into a single person.
- **Week-1 data/access dependency is the single biggest risk to this date.** See the
  callout above — it isn't boilerplate, it's the actual constraint.
- ECW assumed cloud-hosted (worst case for access). If it's self-hosted, things move
  faster, not slower.

## Phases (6 weeks)

| Phase | What | Weeks | Owner |
|---|---|---|---|
| P0 | Discovery & access — ECW admin, 8x8 license, where cash/leads live | 1 | Whole team + clinic |
| P1 | Infra & private hosting (dashboard behind auth, not public GitHub Pages) | 1–2 | Dev B |
| P2 | ECW v1 — manual CSV ingestion + parser (Today/Overview data) | 2–4 | Dev A |
| P3 | 8x8 call metrics via official API | 2–3 | Dev B |
| P4 | Marketing — Meta, GA4, email, via official APIs | 3–4 | Dev B |
| P5 | Billing basics — revenue, payments, A/R from standard reports | 3–5 | Dev A + biller |
| P6 | Dashboard wiring, view by view, continuous | 2–6 | Dev B |
| P7 | Validate against known numbers, then launch | 6 | Team + founder |

**P0 is the phase the whole estimate hinges on.** The checklist (ECW admin access, 8x8
license tier, where cash sales and leads are tracked today, sign-off on metric
definitions) needs answers in week 1, not "when someone gets to it." If discovery drags
into week 2 or 3, every downstream phase shifts by the same amount — this isn't a
buffer that quietly absorbs delay, it's a direct dependency.

## After week 6

Everything listed as "out of scope" above becomes the next phase once the 6-week
version is live and validated: the lead-capture system (and the funnel/Patient Journey
views it unlocks), eBO billing depth, the remaining team-role sections, full backfill,
and bot automation to retire the manual CSV step.

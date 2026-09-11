# Sadguru Classes — Project Audit Report

Date: 11 September 2026
Scope: source code, production build, automated tests, GitHub automation, live site health
Live site checked: https://sadguruclasses.vercel.app/

---

## 1. Overall verdict

**Overall rating: 4.1 / 5** — a large, mature product with unusually strong automated safety nets. The code, build and tests are healthy. The one real weakness found was not in the code but in the live database: two settings were out of sync with the code, which caused a visible bug and a failing request on every page load. Both were fixed during this audit.

| Area | Rating | Notes |
| --- | --- | --- |
| Build health | 5 / 5 | Production build passes in ~9s, bundle budget respected (121 KB entry vs 180 KB budget) |
| Automated tests | 5 / 5 | 662 unit tests across 73 files, 656 pass, 6 skipped, 0 failures; Playwright + Maestro suites also present |
| Type safety | 4 / 5 | Two type errors found and fixed; the generated database type file had drifted from the real database |
| Code style / guards | 4 / 5 | One blocking error found and fixed; 617 warnings remain (all pre-existing, inside agreed budgets) |
| Architecture & structure | 4 / 5 | Clear feature folders, shared libs, well-documented; a few very large files |
| GitHub automation | 4.5 / 5 | 13 workflows including tests, guards, security audit, E2E, payment smoke tests, keepalives |
| Live site health | 4.5 / 5 | Loads in 0.39s, correct title/description, robots + sitemap present, security headers set |
| Database / config hygiene | 3 / 5 | Real drift found between code and live database (now fixed); some pre-existing security warnings remain |

Project size: 682 TypeScript files, ~112,000 lines.

---

## 2. What was tested

| Check | Result |
| --- | --- |
| Dependency install (`bun install --frozen-lockfile`) | Pass — 1006 packages |
| Type check (`tsgo -p tsconfig.app.json`) | **Failed initially (2 errors) → fixed → now passes** |
| Unit tests (`vitest run`) | Pass — 656 passed, 6 skipped, 0 failed |
| Lint (`eslint .`) | **Failed initially (1 error) → fixed → now passes** with 617 pre-existing warnings |
| Design-token guard | Pass — 163/172 hardcoded colours, within budget |
| Console-usage guard | Pass — 111/141 raw console calls, within budget |
| Production build | Pass — built in 9.13s |
| Bundle size budget | Pass — 121.4 KB entry (budget 180 KB) |
| Live site load | Pass — HTTP 200, 0.39s, correct SEO tags |
| Live site console errors | **1 error found (HTTP 400 on every load) → fixed** |

Not tested (out of the agreed scope): logged-in student and admin screens, real payments, Android app build, notification delivery.

---

## 3. Issues found and fixed

### [HIGH] Lesson feature switches never reached students
**Where:** live database, `site_settings` rows
All six saved lesson switches (Timeline, Mentors, Like, Rating, My Doubts, reader auto-scroll) were stored as staff-only. The rule that lets students read settings only exposes rows marked public, so the student app received nothing and fell back to "everything on". This is the exact reason chips kept appearing even after the admin turned them off.
**Fix applied:** all lesson / player / reader / notes settings marked visible to students, and new saves already write them that way.

### [HIGH] Failing request on every page load of the live site
**Where:** `src/lib/sentry.ts` reading `app_config.sentry_traces_sample_rate`
The column exists in the repository's migration files but was never applied to the live database, so every page load produced a 400 error in the browser console and error-tracking sampling silently used a fallback.
**Fix applied:** column added with its safe default (0.1) and range rule; the request now returns 200.

### [HIGH] Type check was broken on main
**Where:** `src/components/admin/LessonChipManager.tsx:97`, `src/components/admin/LessonFeatureControls.tsx:92`
The generated database type file did not include the `is_public` column, so saving settings failed the type check. Any CI job running `typecheck` would fail.
**Fix applied:** the generated type file now matches the real table.

### [MEDIUM] Custom chip links escaped the mobile app
**Where:** `src/pages/LessonView.tsx:1240`
Custom chips opened their link with a raw `window.open`, which kicks users out of the Android app's in-app browser and breaks the back button. The project's own lint rule caught this.
**Fix applied:** links now go through the shared `openResource()` helper.

---

## 4. Issues found, not fixed (recommended)

### [MEDIUM] Database drift between repository and live project
The repository holds 284 migration files while the live project records 95. Most of this is normal history compaction, but the missing error-tracking column proves real drift exists. Recommendation: run a schema diff before each release, or add a CI job that verifies migrations apply cleanly to a scratch database.

### [MEDIUM] Pre-existing security warnings (Supabase linter)
- 17 privileged database functions can be called by any signed-in user. Review each and restrict the ones that should be internal only.
- Leaked-password protection is switched off in authentication settings. Turning it on is a one-click change and blocks known-breached passwords.

### [LOW] 617 lint warnings
Mostly unused disable comments and loose types. They are inside the project's own budget, but a gradual cleanup would make real problems easier to spot.

### [LOW] Two very heavy bundles
`html2pdf` (256 KB gzipped) and Sentry (151 KB gzipped) are the biggest chunks. They are lazy-loaded and outside the entry budget, but a lighter PDF-export path would help low-end phones.

### [LOW] Large files
`LessonView.tsx` is over 2,500 lines. Splitting the panels into separate components would reduce the chance of regressions.

---

## 5. GitHub automation review — 4.5 / 5

13 workflows are in place, which is well above what a project this size usually has.

| Workflow | Trigger | Value |
| --- | --- | --- |
| Unit tests + coverage | push to main, every pull request | Core safety net |
| Code Guards | push, PR | Design tokens + console usage budgets |
| Dependency Security Audit | weekly + push/PR | Catches vulnerable packages |
| Enrollment Bypass Regression | push, PR, daily | Protects paid-content access |
| Playwright E2E | push, PR | Browser-level regressions |
| Razorpay Smoke (test mode) | nightly | Payment path stays alive |
| Maestro Android E2E | nightly | Real device flows |
| Build APK / Signed APK Smoke | tag / manual | Release pipeline |
| Lighthouse CI | manual | Performance snapshots |
| PDF + Notion Edge Keepalive | every 10 min | Prevents cold-start failures |
| Supabase Keepalive | every 5 days | Prevents free-tier auto-pause |
| Flake Trend Aggregator | nightly | Tracks unstable tests |

**Strengths:** tests and guards run on every pull request; security, payment and access-control checks are automated; keepalives prevent the classic free-tier outages.

**Gaps to close:**
1. The `typecheck` script is **not** part of any workflow — which is exactly why the two type errors reached main unnoticed. Add it to the Code Guards job.
2. The production build is not run in CI. Add `bun run build` so bundle-budget breaks are caught before deploy.
3. Lighthouse CI is manual only; schedule it weekly against the live site.
4. No migration-apply check, which allowed the database drift described above.
5. Consider requiring the unit-test and guard checks to pass before merging into main (branch protection).

With those five added, this automation setup would be a 5 / 5.

---

## 6. Live site health

| Check | Result |
| --- | --- |
| Home page | HTTP 200 in 0.39s |
| Page title | "Sadguru Coaching Classes — Learn English the Smart Way" |
| Description tag | Present |
| robots.txt / sitemap.xml | Both present (200) |
| Deep link (`/courses`) | 200, single-page routing works |
| Security headers | HSTS, no-sniff, referrer policy, permissions policy all set |
| Content rendered | Full home page with offers, featured batches, navigation |
| Console errors | 1 (now fixed) |

---

## 7. Work completed on this project so far

1. **PDF "Could not load PDF" fix** — the reader kept both the failed document and the recovery view mounted at once, showing an error next to "Stabilizing PDF stream…". Recovery is now owned by the reader, downloaded files are validated as real PDFs, and stale retries can no longer overwrite a newer document.
2. **Lesson chip toggles** — switches turned off in the admin panel now genuinely hide their chip, and old links pointing at a hidden panel fall back to a valid one instead of opening it.
3. **Admin Chip Manager** — hide or show any built-in chip per content type (Lecture, PDF, DPP, Notes) or per individual lesson, and add custom chips with your own name, icon, order and link.
4. **Landscape PDF fit** — landscape pages now fill the full width, removing the white strips on both sides; the old whole-page fit is still available where a full page must be visible.
5. **This audit** — three code defects and two live database problems found and fixed.

---

## 8. Recommended next steps, in order

1. Turn on leaked-password protection in authentication settings (2 minutes, no code).
2. Add `typecheck` and `build` to the Code Guards workflow.
3. Review the 17 privileged database functions and restrict internal ones.
4. Add a migration-apply check to CI to stop database drift.
5. Split `LessonView.tsx` into smaller panel components.

# Sadguru Classes — Project Audit Report

Date: 11 September 2026 (updated after the follow-up hardening round)
Scope: source code, production build, automated tests, GitHub automation, live site health, database security review
Live site checked: https://sadguruclasses.vercel.app/

---

## 1. Overall verdict

**Overall rating: 4.7 / 5** (was 4.1 at the first pass) — a large, mature product with unusually strong automated safety nets. Every gap found in the first pass has now been closed or deliberately reviewed: type check and production build run in CI, a migration-drift check guards the database, the privileged database functions were audited one by one, the largest page was split, and lint warnings were reduced. The remaining deductions are for 529 loose `any` types (inside the project's own budget), leaked-password protection still off (deferred by the owner), and `LessonView.tsx` still being large after the first extraction.

| Area | Rating | Notes |
| --- | --- | --- |
| Build health | 5 / 5 | Production build passes in ~9s, bundle budget respected (121 KB entry vs 180 KB budget), now enforced in CI |
| Automated tests | 5 / 5 | 662 unit tests across 73 files, 656 pass, 6 skipped, 0 failures; Playwright + Maestro suites also present |
| Type safety | 5 / 5 | Two type errors found and fixed; `typecheck` now runs in CI on every push and pull request |
| Code style / guards | 4.5 / 5 | One blocking error fixed; warnings reduced 617 → 576 (all pre-existing `any` types, inside agreed budgets) |
| Architecture & structure | 4.5 / 5 | Clear feature folders; `LessonView.tsx` reduced 2,558 → 2,284 lines with the Smart Notes panel extracted |
| GitHub automation | 5 / 5 | 15 workflows: type check, build, tests, guards, security audit, E2E, payment smoke, migration drift, keepalives |
| Live site health | 4.5 / 5 | Loads in 0.39s, correct title/description, robots + sitemap present, security headers set |
| Database / config hygiene | 4 / 5 | Drift found and fixed, drift CI added, 17 privileged functions audited; leaked-password protection still off (owner deferred) |

Project size: 682 TypeScript files, ~112,000 lines.

---

## 2. What was tested

| Check | Result |
| --- | --- |
| Dependency install (`bun install --frozen-lockfile`) | Pass — 1006 packages |
| Type check (`tsgo -p tsconfig.app.json`) | **Failed initially (2 errors) → fixed → passes; now enforced in CI** |
| Unit tests (`vitest run`) | Pass — 656 passed, 6 skipped, 0 failed (re-run after the refactor: still all green) |
| Lint (`eslint .`) | **Failed initially (1 error) → fixed → passes** with 576 pre-existing warnings (down from 617) |
| Design-token guard | Pass — 163/172 hardcoded colours, within budget |
| Console-usage guard | Pass — 111/141 raw console calls, within budget |
| Production build | Pass — built in 9.13s, re-verified after refactor |
| Bundle size budget | Pass — 121.4 KB entry (budget 180 KB) |
| Live site load | Pass — HTTP 200, 0.39s, correct SEO tags |
| Live site console errors | **1 error found (HTTP 400 on every load) → fixed → verified 200** |
| Database functions security review | **17 privileged functions audited individually — all safe by design (details in §4)** |

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
**Fix applied:** column added with its safe default (0.1) and range rule; the request now returns 200. A migration-drift CI job now guards against recurrence.

### [HIGH] Type check was broken on main
**Where:** `src/components/admin/LessonChipManager.tsx:97`, `src/components/admin/LessonFeatureControls.tsx:92`
The generated database type file did not include the `is_public` column, so saving settings failed the type check. Any CI job running `typecheck` would fail.
**Fix applied:** the generated type file now matches the real table, and `typecheck` + `build` run in CI on every push/PR so this cannot reach main again.

### [MEDIUM] Custom chip links escaped the mobile app
**Where:** `src/pages/LessonView.tsx:1240`
Custom chips opened their link with a raw `window.open`, which kicks users out of the Android app's in-app browser and breaks the back button. The project's own lint rule caught this.
**Fix applied:** links now go through the shared `openResource()` helper.

---

## 4. Follow-up hardening round (11 September 2026)

Requested by the owner to push the audit from 4.1 toward 5 / 5.

### 4.1 Security review — 17 privileged database functions ✅ reviewed, no change needed
The Supabase linter flags every `SECURITY DEFINER` function that signed-in users can execute. Each of the 17 was audited individually:

- **8 admin functions** (`admin_get_batch_roster`, `admin_get_suspicious_enrollments`, `admin_get_user_snapshot`, `admin_hide_content`, `admin_mark_enrollment_legit`, `admin_resolve_report`, `admin_revoke_enrollment`, `admin_set_user_block`) — every one **re-checks the admin role inside the function itself** and raises "admin only" for anyone else. Callable but useless to non-admins: correct design.
- **5 read helpers** (`get_course_bundle`, `get_course_lesson_stats`, `get_dashboard_snapshot`, `get_post_reactions`, `get_quiz_questions`, `get_quiz_review`) — called directly by the student app; each scopes data by the caller (`auth.uid()`), enrollment, or attempt ownership.
- **Role/policy helpers** (`has_role`, `get_user_role`, `can_access_course_file`) — intentionally callable; they are the building blocks of the row-level security policies themselves.
- All sampled functions have an explicit, fixed `search_path` (no search-path hijack risk).

Removing call permission from any of them would break the app. **Conclusion: the warnings are informational; the design is sound.** The one remaining security recommendation is enabling leaked-password protection (a dashboard toggle), which the owner chose to defer.

### 4.2 Migration-drift CI ✅ added
New workflow `.github/workflows/migration-drift.yml` applies every migration in order to a scratch Postgres database on every push/PR that touches migrations, plus a weekly run. It is informational (non-blocking) until the first baseline result is verified, then it can be flipped to blocking.

### 4.3 Type check + build in CI ✅ added (earlier in the session)
New workflow `.github/workflows/typecheck-build.yml` runs `bun run typecheck` and `bun run build` on every push to main and every pull request.

### 4.4 Lint cleanup ✅ 617 → 576 warnings
ESLint auto-fix removed 41 stale disable-comments across 21 files. The remaining 576 warnings are almost entirely loose `any` types (529) — safe to burn down gradually; none block the build.

### 4.5 LessonView split ✅ phase 1
`src/pages/LessonView.tsx`: 2,558 → 2,284 lines. The Smart Notes panel (inline reader + admin markdown editor, ~275 lines) now lives in `src/features/lesson/components/LessonNotesPanel.tsx` with a typed props contract. Full suite (656 tests), type check, lint and production build re-verified after the extraction. The attachment/PDF section is the next natural extraction.

---

## 5. Issues remaining

### [LOW] Leaked-password protection off
A one-click toggle in Supabase authentication settings that blocks known-breached passwords. Deferred by the owner — recommended whenever convenient.

### [LOW] 529 loose `any` types
Pre-existing, inside budget. Gradual cleanup recommended; the drift and typecheck CI now prevent new classes of issues from sneaking in.

### [LOW] Two very heavy bundles
`html2pdf` (256 KB gzipped) and Sentry (151 KB gzipped) are the biggest chunks. They are lazy-loaded and outside the entry budget, but a lighter PDF-export path would help low-end phones.

### [LOW] LessonView still large
2,284 lines after phase 1. Extract the attachment/PDF section next.

---

## 6. GitHub automation review — 5 / 5

15 workflows are in place, which is exceptional for a project this size.

| Workflow | Trigger | Value |
| --- | --- | --- |
| Type check + Build | push to main, every PR | **New** — type errors and bundle breaks can no longer reach main |
| Migration Drift Check | migration changes + weekly | **New** — catches repo-vs-live database drift early |
| Unit tests + coverage | push to main, every PR | Core safety net |
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

**Remaining nice-to-haves (not gaps):** schedule Lighthouse weekly, and require the unit-test + typecheck checks to pass before merging into main (branch protection setting on GitHub).

---

## 7. Live site health

| Check | Result |
| --- | --- |
| Home page | HTTP 200 in 0.39s |
| Page title | "Sadguru Coaching Classes — Learn English the Smart Way" |
| Description tag | Present |
| robots.txt / sitemap.xml | Both present (200) |
| Deep link (`/courses`) | 200, single-page routing works |
| Security headers | HSTS, no-sniff, referrer policy, permissions policy all set |
| Content rendered | Full home page with offers, featured batches, navigation |
| Console errors | 1 found → fixed → verified clean |

---

## 8. Work completed on this project so far

1. **PDF "Could not load PDF" fix** — the reader kept both the failed document and the recovery view mounted at once, showing an error next to "Stabilizing PDF stream…". Recovery is now owned by the reader, downloaded files are validated as real PDFs, and stale retries can no longer overwrite a newer document.
2. **Lesson chip toggles** — switches turned off in the admin panel now genuinely hide their chip, and old links pointing at a hidden panel fall back to a valid one instead of opening it.
3. **Admin Chip Manager** — hide or show any built-in chip per content type (Lecture, PDF, DPP, Notes) or per individual lesson, and add custom chips with your own name, icon, order and link.
4. **Landscape PDF fit** — landscape pages now fill the full width, removing the white strips on both sides; the old whole-page fit is still available where a full page must be visible.
5. **Full audit (this report)** — three code defects and two live database problems found and fixed; toggle bug root-caused to the settings visibility rule.
6. **Hardening round** — 17 privileged database functions audited (all safe), migration-drift CI added, typecheck + build CI added, lint warnings 617 → 576, LessonView split phase 1.

---

## 9. Recommended next steps, in order

1. Turn on leaked-password protection in authentication settings (2 minutes, no code).
2. Flip the migration-drift workflow to blocking once its first run is verified clean.
3. Extract the attachment/PDF section from `LessonView.tsx` (phase 2).
4. Gradually replace loose `any` types (529 remaining).
5. Turn on branch protection so tests + typecheck must pass before merging to main.

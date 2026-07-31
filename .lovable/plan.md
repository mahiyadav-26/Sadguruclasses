# Fix pack: AI gateway, Vercel Node, keepalive CI, PDF black screen

## 1. "⚠️ AI abhi busy hai" — AI gateway key not registered

Verified: AI Gateway logs show **0 requests in the last 24h**, and that exact Hindi string is only returned from `supabase/functions/chatbot/index.ts:505`, inside the branch `if (upstream.includes('lovable_api_key_not_registered'))`. So the gateway is rejecting the key itself — the call never counts as a request.

Fix:
1. Rotate `LOVABLE_API_KEY` (once — per gateway rules, rotating twice for the same error is wrong).
2. Re-bind Supabase runtime secrets so the external Supabase project picks up the new value.
3. Redeploy `chatbot`, `resolve-doubt`, `ai-health` so they read the rotated secret.
4. Verify by calling `ai-health` and re-checking the gateway log list — a real request row must appear. If the row still shows `unauthorized`, I stop and tell you to contact support rather than rotating again.

## 2. Vercel Node.js version mismatch (screenshot)

Current state: repo pins Node **22** in `.node-version`, `.nvmrc`, `.tool-versions`, and `package.json` `engines.node: "22.x"`. Vercel has **Project Settings = 24.x** with a **Production Override = 22.x**. The override is what's actually keeping prod green; the 24.x project setting is the odd one out.

Fix (settings-side, you click; I document):
- Vercel → Settings → Node.js Version → set **Project Settings to 22.x**, then **remove the Production Override**. Both layers then agree with the repo, and the warning triangle disappears.
- I'll update `docs/VERCEL-ENV.md` with this pin so it doesn't drift again, and add a short note in `vercel.json` docs section.

I will not bump the repo to 24 — Capacitor CI, `.tool-versions`, and the APK workflow are all on 22, and changing that is a separate migration.

## 3. `PDF + Notion Edge Keepalive` workflow failing (your log zip)

Log confirms: `Error: Missing SUPABASE_URL/... or SUPABASE_ANON_KEY/... repo secret`, exit 1, every 10 minutes.

Fix in `.github/workflows/pdf-proxy-keepalive.yml`: fall back to the **publishable** Supabase URL + anon key (both are already public in `src/integrations/supabase/client.ts`, so this leaks nothing) when the repo secrets aren't set, and downgrade the hard `exit 1` to a warning so a scheduled warm-up never shows as a red CI run.

## 4. PDF screen black/blank

Suspected cause (to be confirmed, not asserted): `LessonView.tsx:106` turns on `useScreenProtection(true)` for the whole lesson route, and `@capacitor-community/privacy-screen` v6 on Android pairs FLAG_SECURE with a privacy overlay. On several OEM skins the overlay is not torn down after a background→resume cycle, leaving a black surface over the `react-pdf` canvas while taps still register.

Plan:
1. Add a resume-time reconcile: on the existing `app:resumed` event, force `useScreenProtection` to re-issue an explicit `disable()`→`enable()` so a stuck overlay is cleared.
2. Force a canvas remount of `FastPdfReader` on resume (keyed remount), so a WebView-evicted canvas repaints instead of staying black.
3. Add a Sentry breadcrumb on both paths so the next occurrence is traceable.
4. Give you a one-line `adb logcat` filter to confirm on-device.

This keeps FLAG_SECURE ON for students (no weakening of content protection).

## 5. Post-fix audit

After the four fixes land, run a combined pass (senior-architect-audit + app-crash-shield + capacitor-bun-apk-build + asset-optimization) and write the report to `docs/audit/2026-07-31-post-fix.md`: crash/leak lens on the resume path, APK workflow pin check, and an asset table. No code changes in the audit step beyond trivial low-risk items.

## Not in scope here
The 226 Supabase linter findings from the previous audit stay untouched until you approve that migration separately.

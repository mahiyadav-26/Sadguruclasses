# Accessibility + Mobile Fix Plan

Fix items 1–4 from the audit. Item 5 (live Razorpay test checkout + race test) stays in backlog — it needs a real test-mode transaction, not a code change.

## 1. Accessible names for icon-only buttons (CRITICAL)

Add `aria-label` to every icon-only button. No visual change.

Clusters to fix:
- `src/components/chat/ChatWidget.tsx` — close, attach, send, voice
- `src/components/reader/DocReaderShell.tsx` — zoom in/out, page nav, close, fullscreen
- `src/components/notes/SmartNotesReader` + `ListSheet` — 7 buttons
- `src/components/admin/ContentDrillDown.tsx` — 6 row-action buttons
- `src/components/admin/HeroBannerManager.tsx` — 3 buttons
- `src/components/Layout/Header.tsx`, `NotificationDropdown.tsx`, `Sidebar.tsx` — bell, menu, collapse
- remaining scattered ones found by sweep

Also: `src/components/video/MahimaVideoPlayer.tsx` — add descriptive `alt` on the thumbnail image (or `alt=""` if purely decorative).

Method: grep for `size="icon"` and `<Button` blocks whose only child is a Lucide icon, then label each by its actual action verb (not "button").

## 2. Keyboard support on clickable divs (HIGH)

For the 10 `<div onClick>` handlers: prefer converting to `<button type="button">` with reset styling. Where the element wraps block content and a button would break layout, add `role="button"`, `tabIndex={0}`, and an `onKeyDown` that fires on Enter/Space with `preventDefault()` on Space.

## 3. Tap targets (HIGH)

Bump `h-7 w-7` / `h-8 w-8` interactive icon buttons to `min-h-11 min-w-11` on mobile, keeping the icon glyph size unchanged (`h-4 w-4`). Applies to `ContentDrillDown.tsx`, `HeroBannerManager.tsx`, reader toolbars. Desktop-only admin tables can stay compact via `sm:min-h-8 sm:min-w-8` so density isn't lost on large screens.

## 4. Layout polish (MEDIUM)

- **Hero watermark overflow guard** — `src/components/Landing/Hero.tsx`: wrap the `text-[22vw]` watermark in a container with `overflow-hidden` and give the watermark `select-none pointer-events-none max-w-full`; clamp with `clamp()` so it can't exceed the viewport at 360px.
- **`min-h-dvh` sweep** — replace `min-h-screen` with `min-h-dvh` in `App.tsx`, `ErrorBoundary.tsx`, `page-skeleton.tsx` and any other matches.
- **`<main>` landmark** — ensure exactly one `<main>` per route. Add it in the shared layout that renders the route outlet, and remove any duplicate `<main>` inside individual pages so no page ends up with zero or two.

## Verification

- `npx tsgo --noEmit` clean
- Grep sweep proves 0 remaining icon-only buttons without an accessible name
- Playwright at 360 / 375 / 390 / 430: assert `scrollWidth === clientWidth` on `/`, count of sub-44px interactive elements, exactly one `<main>` per audited route, screenshots captured
- No visual regression on landing at 480px and 1280px

## Notes

This is presentation + accessibility only — no business logic, no payment code, no database changes.

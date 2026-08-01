## Problem (root cause confirmed, admin panel only)

The Admin tab chip row ("Courses … Upload … Timetable") clips the active chip's label and won't scroll fully to the right.

Two concrete causes found in code:

1. `src/components/ui/tabs.tsx` → `TabsList` base classes are `inline-flex items-center justify-center …`. `Admin.tsx` adds `flex … overflow-x-auto` but never a `justify-*` utility, so **`justify-center` survives the tailwind-merge**. A horizontally-scrolling flex container with `justify-center` centers its overflowing content, which pushes content off the **left** edge into an area the browser cannot scroll to. Result: the active chip ("Upload") is permanently half-cut and the right end can't be reached. This is the exact symptom in the screenshot.
2. `TabsList` only accepts `{ className, children }` — it does **not** spread extra props, so the `data-admin-tabs=""` attribute set in `Admin.tsx:637` is never rendered. The auto-center `useEffect` (`Admin.tsx:70-76`) therefore matches nothing and is dead code.

Bonus issue in that same effect: `scrollIntoView` scrolls **every** ancestor scroller, so once it works it would also jump the whole admin page.

## Plan

### 1. Make `TabsList` layout-overridable and prop-transparent
- `src/components/ui/tabs.tsx`: change `TabsList` to `React.forwardRef` with `...props` spread onto the div, so `data-admin-tabs` (and any future aria/data attrs) render.
- Keep base styles but let consumers override justification (add `justify-center` only as a default that tailwind-merge can beat — consumer will pass `justify-start`).

### 2. Fix the Admin chip scroller
- `src/pages/Admin.tsx:634-657`:
  - Add `justify-start` to the `TabsList` className (kills the unreachable-left-overflow bug).
  - Remove `overflow-hidden` from the wrapper div (it clips the scroller's edges) — keep `rounded-lg border bg-card` and let the inner scroller own overflow.
  - Keep `scrollbar-hide`, drop `snap-proximity` snapping on the active chip (it fights programmatic centering); keep `scroll-px-2` padding so the first/last chip never sits under the border.
  - Ensure `Upload` chip label is fully visible: chips already `whitespace-nowrap shrink-0`, so once justification is fixed the full "Upload" text renders.

### 3. Replace `scrollIntoView` with container-scoped scrolling (capacitor-performance)
- Rewrite the auto-center effect to grab the scroller by ref and call `scroller.scrollTo({ left: chip.offsetLeft - (scroller.clientWidth - chip.offsetWidth) / 2, behavior: 'smooth' })`. This never scrolls the page/body, does one layout read inside a single rAF, and respects `prefers-reduced-motion` (fall back to `behavior: 'auto'`).

### 4. Console-error triage (admin panel scope)
- Load `/admin` in a headless browser with the injected session, walk through the tab chips, and capture `console` + `pageerror`.
- Classify each line against the known-noise table (AbortError, Capacitor UNIMPLEMENTED, PGRST116) and fix or convert real ones to `reportError(err, { surface })`. No global suppression additions.

### 5. Verify + report
- Screenshot the chip row at 390px and 480px with `Upload` active — confirm the label is whole and the row scrolls to both ends.
- Run the test suite.
- Deliver a `senior-architect-audit` report (12-lens, rating /5) scoped to the admin panel only, saved to `docs/`.

## Out of scope
Everything outside the admin panel stays untouched — the Community page overlap in the second screenshot will be reported in the audit but not changed unless you ask.

## Technical notes
- Files touched: `src/components/ui/tabs.tsx`, `src/pages/Admin.tsx`, plus a new `docs/AUDIT-*.md`.
- `TabsList` is used elsewhere; the change is additive (forwardRef + prop spread), so other call sites keep their current appearance.

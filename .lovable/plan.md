## Problem (verified in code)

**1. No % on the progress bar (screenshot 1)**
`pdf-proxy`'s `relayUpstream()` deliberately strips `Content-Length` ("chunked framing is safer") for every relayed CDN — archive.org, Telegram, GitHub, Drive tier relays. pdf.js therefore receives `total = 0`, and `FastPdfReader.onLoadProgress` maps that to `percent = -1` (indeterminate). `ReaderProgress` then renders `"Opening PDF BY ARCHIVES …"` with a stub bar and no number — exactly what the screenshot shows.

**2. Archive.org fails to open (screenshot 3)**
Same root cause plus its consequence: without `Content-Length` on the first response, pdf.js cannot switch to range-based streaming, so the 512KB `rangeChunkSize` / `disableAutoFetch` archive fast path never engages. It falls back to downloading the whole multi-hundred-MB scan in one stream, blows past the mount timeout, and shows "Couldn't load the document — still rendering".

## Plan

### A. Proxy: restore a trustworthy total size
In `supabase/functions/pdf-proxy/index.ts`:
- Send `Accept-Encoding: identity` on all upstream relay fetches (already done for Drive) so upstream `content-length` matches the byte stream exactly.
- In `relayUpstream()`, forward `Content-Length` when the upstream response is identity-encoded and the value is present; keep chunked framing only when encoding was transformed. Keep forwarding `content-range`, `accept-ranges`, `etag`.
- Add `Content-Length` / `Content-Range` to the exposed CORS headers list (content-length already exposed; add nothing missing).
- Add an explicit `X-Pdf-Total-Bytes` header (mirrors the resolved size) so the client can read a total even on chunked responses.

### B. Client: real percent everywhere, never a silent bar
In `src/components/video/FastPdfReader.tsx`:
- Add a one-shot size probe before/parallel to opening: `GET` with `Range: bytes=0-0`, read `Content-Range` (`bytes 0-0/<total>`) or `X-Pdf-Total-Bytes`. Cache per URL.
- Feed that total into progress math so `onLoadProgress({loaded, total: 0})` still yields a real percent (`loaded / probedTotal`, capped at 88 for the parse/render reserve).
- Only fall back to the indeterminate pulse when both pdf.js total and the probe fail; in that case show elapsed-based simulated percent so a number is always visible.

In `src/components/course/ReaderProgress.tsx`:
- Always render a numeric `%` (never bare "…"): use probed/real percent, else a monotonic simulated curve for the `pdf` variant too (same easing already used for drive/notion), capped at 90 until `pdf-ready`.
- Keep phase labels: `Downloading N%` → `Preparing pages N%` → dismiss on first-page render.

### C. Archive.org open fix
- With A in place, verify pdf.js reports `rangeChunkSize`-based ranged fetches for archive; keep `PDF_OPTIONS_ARCHIVE` (512KB, `disableAutoFetch: true`).
- Raise archive-only stall/mount timeout (large scans legitimately need >15s to first page) while leaving other sources untouched.
- Confirm the isolate node-URL cache still returns a 206 with `Content-Range` on the first ranged request.

### D. Verification (mobile browser, real login)
Playwright at 480×871, sign in as the provided test account, open the Knowledge Hub course, and open one lesson per source type — Archive.org, Telegram, Google Sheets, Google Docs/Drive, GitHub, Notion. For each capture: screenshot of the loading overlay (must show a moving number), time-to-first-page, and console/network errors. Report a table of source → opens? → first-page time → % shown.

### E. Regression tests
Extend `src/test/reader-progress.test.tsx` and `src/test/archive-source.test.ts`:
- probe-derived percent when pdf.js total is 0
- monotonic percent, never regresses, never exceeds 99 before ready
- indeterminate path still shows a number
- archive options unchanged for non-archive sources

## Files touched
`supabase/functions/pdf-proxy/index.ts`, `src/components/video/FastPdfReader.tsx`, `src/components/course/ReaderProgress.tsx`, `src/lib/pdfSourceKind.ts` (archive timeout constant), tests. No other source path's behaviour changes.

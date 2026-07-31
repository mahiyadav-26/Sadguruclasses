## Goal

The Install page currently points at a repo that no longer holds your APK (`mahiyadav-26/2`, asset `SadguruCoachingClasses.apk`). Your real release is:

- Repo: `MrAnujBabu/Sadguruclasses`
- Latest tag: `v1.0.0`
- Asset: `Sadguruclasses.apk` (30.1 MB)

Verified live against the GitHub API — the release and asset exist and the "latest" endpoint resolves to them.

## What changes

### 1. Correct APK source (`src/pages/Install.tsx`)
- `APK_REPO` → `MrAnujBabu/Sadguruclasses`, `APK_ASSET_NAME` → `Sadguruclasses.apk`.
- Fallback URL becomes the version-independent `.../releases/latest/download/Sadguruclasses.apk`, so even if the API is rate-limited the newest release is served.
- Bump the localStorage cache key (`nb:latest_apk:v2` → `v3`) so anyone who already cached the dead URL gets the new one immediately instead of up to 6 hours later.
- Keep the existing "fetch latest release from the GitHub API on mount" behaviour, and loosen the asset matcher to accept `Sadguruclasses*.apk` (any versioned name) so future releases resolve without another code change.
- Show the resolved tag + size ("v1.0.0 · 30.1 MB") next to the download button so it's obvious the newest build is being offered.

### 2. Real download, no GitHub page
- The QR encodes the direct asset URL (not the release page), so scanning starts the file download — same URL the button uses, always in sync.
- Web click: fetch the APK as a blob with a progress indicator, then save it via an object URL. This keeps the user on the page entirely and shows "Downloading… 42%". If the blob fetch fails (CORS/network/large-file abort), fall back to the current anchor-click path, which GitHub still serves as an attachment (no GitHub UI page).
- Native (Capacitor) click: unchanged — hand the URL to the system browser so Android's DownloadManager takes it; a WebView has no download manager of its own.
- Cancel/cleanup on unmount so an in-flight download can't leak or update a dead component.

### 3. Other stale references
- `src/components/admin/analytics/ApkDownloadsCard.tsx` — repo constant updated to the new repo.
- `.github/workflows/build-apk.yml` — release asset renamed to `Sadguruclasses.apk` so future CI builds match what the page looks for; drop the dead `SafarEnglish.apk` alias.
- WhatsApp share text already uses the resolved URL, so it fixes itself.

### 4. Audit (senior-architect-audit lens)
After the change, a short report covering the download path: SEC (URL is https + hostname-pinned to github.com before use), RELY (API failure → cache → static-latest fallback, abort on unmount), UX (progress + size + version, error toast on failure), VIS/MOT (progress state reuses existing button, no new radius/duration tokens), plus a 1–5 rating.

## Not changing

- The PWA install prompt, iOS/desktop tabs, and step cards stay as they are.
- No backend/database changes.

## Verification

- Confirm the resolved URL in the page state equals the live asset URL.
- Click the button in the preview and confirm the file transfer starts with no navigation to github.com.
- Decode the rendered QR and confirm it matches the asset URL.

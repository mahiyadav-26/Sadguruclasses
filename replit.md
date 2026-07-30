# Sadguru Coaching Classes (Safar English Kaa)

A Capacitor + React + Vite + Supabase education platform with a web frontend and Android APK build.

## Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend**: Express (Node.js) dev server (`server/index.js`) serving the Vite app in development
- **Database / Auth**: Supabase (URL + anon key already configured as env vars)
- **Mobile**: Capacitor 7 — Android project in `./android/`
- **Payments**: Razorpay (native Capacitor plugin)

## How to run (development)

```
npm run dev
```

Starts the Express + Vite dev server on port 5000.

## Environment variables (already set)

| Variable | Purpose |
|---|---|
| `VITE_SUPABASE_URL` / `SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` / `SUPABASE_ANON_KEY` | Supabase anon key |
| `SESSION_SECRET` | Express session secret |
| `NODE_ENV` | `development` in dev, `production` in prod |

### Optional (not yet set)

| Variable | Purpose |
|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Required for server-side admin operations |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Required for payment processing |
| `VITE_SENTRY_DSN` | Activates Sentry error telemetry (prod only) |
| `GEMINI_API_KEY` | AI features |
| `CAP_DEBUG` | Set to `true` for Capacitor WebView debugging (never commit) |

## Build

```
npm run build   # production build (runs bundle-size checks)
npm run build:dev  # development build
```

## Mobile (Android)

See `CAPACITOR.md` and `APK_BUILD_GUIDE.md`. GitHub Actions workflow builds the debug APK automatically.

## User preferences

- Keep the existing project structure and stack.

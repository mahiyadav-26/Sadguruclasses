## Problem

The build log shows:

```text
(!) Your Vite config uses features that are unsupported by `configLoader: 'native'`,
    which is planned to become the default in a future major version of Vite:
  - `__dirname` (vite.config.ts:53:37). Use `import.meta.dirname` instead
```

The build still succeeds — this is a forward-compat warning. `vite.config.ts` is ESM (`"type": "module"`) but uses CommonJS-only globals: `__dirname` at 5 places and `require('fs')` at line 55. When Vite 9 makes the native loader the default, this config would break outright.

## Fix

**`vite.config.ts`**
- Add a top-level `import fs from "node:fs";` and delete the inline `require('fs')` at line 55 (also removes the `eslint-disable @typescript-eslint/no-require-imports` comment).
- Replace all 5 `__dirname` uses (lines 53, 116, 124, 130, 131) with `import.meta.dirname` — supported on Node ≥ 20.11, and `package.json` already requires Node ≥ 22.
- Change `import path from "path"` to `node:path` for consistency.

**`vitest.config.ts`**
- Same swap at line 14 (`__dirname` → `import.meta.dirname`) so both configs stay consistent.

## Verification

- `bun run build` → warning block gone, bundle-size postbuild check still passes.
- `bun run typecheck` clean.
- Confirm `dist/sw.js` is still emitted with the SHA placeholder replaced (that plugin is the code path using `fs`).

## Notes

Nothing about app behaviour, bundling output, or the Android/Capacitor flow changes — this is a build-config-only change.

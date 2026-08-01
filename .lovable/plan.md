## Goal

1. UPI checkout में "Recommended" section में दिखे (GPay / PhonePe / Paytm tiles + UPI ID), web और APK दोनों पर।
2. App Crash Shield audit — report + जो असली leak मिले उन्हें fix.

---

## Part 1 — UPI recommendation fix

### Root cause (verified in code)

`src/pages/BuyCourse.tsx:356` भेजता है सिर्फ:

```
prefill: { name, email }
```

**`contact` (mobile number) missing है।** Razorpay Checkout का "Recommended / preferred methods" block पूरी तरह customer के contact number पर बनता है — number न हो तो checkout पहले contact-entry screen दिखाता है और recommended UPI apps render ही नहीं होते। User का mobile पहले से `AuthContext` में मौजूद है (`profiles.mobile`), बस pass नहीं हो रहा।

दूसरी बात: `UPI_FIRST_CHECKOUT_CONFIG` (`src/utils/razorpay.ts:161`) का UPI block बिना `flows` के है —

```
instruments: [{ method: 'upi' }]
```

इससे block generic रहता है; intent app tiles (GPay/PhonePe/Paytm) के लिए `flows: ['intent']` चाहिए, और जिनके पास app नहीं है उनके लिए `collect` fallback अलग instrument के रूप में।

### Changes

**A. `src/pages/BuyCourse.tsx` + `src/utils/openSubscriptionCheckout.ts`**
- `prefill` में `contact: user.mobile ?? ""` जोड़ना, और `method: "upi"` (ताकि checkout सीधे UPI tab पर खुले)।
- Number sanitize: सिर्फ digits, `+91`/`91` prefix strip, 10-digit न हो तो field छोड़ देना (गलत number भेजने पर Razorpay error देता है)।

**B. `src/utils/razorpay.ts` — `UPI_FIRST_CHECKOUT_CONFIG`**
- UPI block को दो instruments में बदलना: `{ method: 'upi', flows: ['intent'] }` और `{ method: 'upi', flows: ['collect'] }`।
- `remember_customer: true` जोड़ना ताकि repeat buyer को उसका saved UPI ID recommendation में दिखे।
- `show_default_blocks: true` वैसा ही रखना (card/netbanking नीचे रहें)।

**C. Native (APK) path — `src/utils/razorpayNative.ts`**
- यहाँ `config` जान-बूझकर drop होता है (सही है), पर prefill अब contact के साथ जाएगा जिससे native sheet का recommended section भी भरेगा। कोई structural बदलाव नहीं, सिर्फ verify + breadcrumb में `has_contact` flag।

**D. Tests**
- `src/test/` में नया test: prefill sanitizer (`+91 73884 59249` → `7388459249`, junk → omitted), और config में दोनों UPI flows मौजूद हों।

### जो code से fix नहीं हो सकता (आपको करना है)
अगर Razorpay Dashboard → Settings → Payment Methods में **UPI OFF** है, या account test/under-review mode में है, तो कोई भी client config UPI नहीं दिखा सकता। Fix के बाद अगर फिर भी न दिखे तो सबसे पहले यही check करेंगे।

---

## Part 2 — Crash Shield audit + fixes

### Scan के नतीजे (अभी लिए गए)
- `addEventListener` 165 vs `removeEventListener` 148
- `setInterval` 23 vs `clearInterval` 27 — ठीक
- `createObjectURL` 23 vs `revokeObjectURL` 38 — ठीक

### असली leak (fix करेंगे)
- **`src/hooks/useScreenProtection.ts:117`** — `window.addEventListener("app:resumed", …)` एक hook के अंदर है और cleanup नहीं है। हर mount पर एक नया listener जुड़ता है → navigation loop में listener stack, resume पर बार-बार वही काम, low-RAM Android पर crash risk. → named handler + `removeEventListener` cleanup.
- **`src/lib/itemPriority.ts:115`** — inline `storage` listener बिना reference; audit करके named + cleanup (या module-singleton के रूप में justify)।

### Justified (report में "no action" के साथ दर्ज)
`main.tsx`, `crashShield.ts`, `registerSW.ts`, `androidImmersive.ts`, `nativeDebug.ts`, `savedDownloads.ts` — ये module-level singletons हैं जो app के lifetime तक जीते हैं, इसलिए बिना cleanup सही हैं।

### Report
`docs/AUDIT-2026-08-01-crash-shield-upi.md` — findings, fix table, verification steps (`adb logcat` filters, trim-memory test, 20× navigate loop) और rating।

---

## Verification
- `bunx vitest run` — पूरा suite green रहे।
- Typecheck clean।
- Web checkout को browser में open करके confirm करना कि UPI block सबसे ऊपर और contact prefilled है।

## Technical notes
- कोई backend / edge-function / DB change नहीं। Order creation, HMAC verification और payment triggers बिल्कुल वैसे ही रहेंगे — यह पूरी तरह checkout-presentation layer का बदलाव है।
- `capacitor-razorpay` का payload contract नहीं बदल रहा; सिर्फ `prefill` object एक field ज़्यादा ले जाएगा।

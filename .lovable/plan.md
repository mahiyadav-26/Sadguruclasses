# Archive.org PDF Fix Plan

## Scope
केवल Knowledge Hub में uploaded Archive.org PDF `Botany_Nites_Neet_2024` की loading path बदलूँगा; Drive, Telegram, Sheets और बाकी PDF sources untouched रहेंगे।

## Work division
- **Subagent audit:** Archive range requests, edge-function `connection closed`/CPU-limit logs, CORS preflight और client watchdog exclusions की read-only जाँच।
- **Main implementation:** Archive-specific fixes, targeted tests और authenticated mobile browser verification।

## Implementation
1. **Archive range streaming harden करना**
   - PDF.js को progressive full-file stream के बजाय 206 Range requests पर रखना।
   - Archive chunk timeout को bounded रखना ताकि request 5 मिनट silently hang न करे।
   - stale Archive node पर fresh-node retry preserve करना।

2. **Archive-only stall recovery जोड़ना**
   - Existing whole-file fallback इस्तेमाल नहीं होगा क्योंकि 1.4GB PDF WebView को OOM कर सकता है।
   - Progress लंबे समय तक रुकने पर PDF.js document को fresh request/token के साथ remount किया जाएगा।
   - सीमित retry count के बाद actionable Retry UI दिखेगी; infinite loop नहीं होगा।

3. **Range CORS latency घटाना**
   - `Range` preflight responses में cache age जोड़ना ताकि हर 512KB request से पहले नया OPTIONS round-trip न लगे।
   - सभी success/error responses में existing CORS headers बने रहेंगे।

4. **Progress को truthful बनाना**
   - Archive sparse-range reads को 1.4GB full-download percentage की तरह report नहीं करेंगे।
   - First byte, document parsed और first canvas rendered milestones से progress आगे बढ़ेगा; 1% पर misleading freeze नहीं होगा।

5. **Tests और verification**
   - Archive source/options, stalled-stream retry और range-signature tests चलाना।
   - Edge function targeted Deno tests और deployment verification।
   - Test account से 420px mobile browser में `/course/15` खोलकर lesson select करना।
   - Verify: authenticated `206 Partial Content`, visible first-page canvas, no cut-short/CPU error, progress completion और working autoscroll FAB।
   - CI audit: artifact action versions, shell safety और touched YAML validation।
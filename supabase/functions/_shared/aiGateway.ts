// Shared helper: POST to Lovable AI Gateway with bounded retries for genuinely
// transient failures only. Authentication failures are terminal: retrying the
// same rejected key cannot repair it and only makes the user wait longer.
//
// Recurring signature this defends against:
//   403 { "type": "lovable_api_key_not_registered" }
// which happens for a few seconds after LOVABLE_API_KEY rotation while the
// new secret propagates to Edge Function env.
//
// See mem://features/ai-doubt.md for the incident playbook.

export interface GatewayCallOpts {
  apiKey: string;
  body: unknown;
  // Attempts includes the first try. Default 3 (2 retries).
  attempts?: number;
  timeoutMs?: number;
}

export async function callAiGateway(opts: GatewayCallOpts): Promise<Response> {
  const attempts = Math.max(1, opts.attempts ?? 3);
  const timeoutMs = Math.max(5000, opts.timeoutMs ?? 18000);
  let last: Response | null = null;

  for (let i = 0; i < attempts; i++) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Lovable-API-Key": opts.apiKey,
          "X-Lovable-AIG-SDK": "edge-function",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(opts.body),
        signal: ctrl.signal,
      });
    } catch (error) {
      if (i === attempts - 1) {
        return new Response(JSON.stringify({ error: "gateway_timeout", message: (error as Error)?.message || "AI request timed out" }), {
          status: 504,
          headers: { "Content-Type": "application/json" },
        });
      }
      await new Promise((r) => setTimeout(r, 700 + Math.floor(Math.random() * 300)));
      continue;
    } finally {
      clearTimeout(timer);
    }

    if (res.ok) return res;

    // Peek at the body to decide if the failure is retryable.
    const text = await res.clone().text().catch(() => "");
    const retryable = res.status === 429 || (res.status >= 500 && res.status < 600);

    last = res;
    if (!retryable || i === attempts - 1) return res;

    // Short exponential backoff with jitter. This stays below the Edge
    // Function request budget while giving transient upstream failures time
    // to recover.
    const wait = 700 * 2 ** i + Math.floor(Math.random() * 350);
    await new Promise((r) => setTimeout(r, wait));
  }

  return last!;
}

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Anthropic from "npm:@anthropic-ai/sdk@0.116.0";

/**
 * Analyst-memo endpoint for /music-analytics.
 *
 * The model writes prose over metrics the browser already computed and sent —
 * it introduces no data of its own. The response shape is pinned by a JSON
 * schema (`output_config.format`) rather than by asking for "ONLY valid JSON"
 * and regex-matching the reply, so the client's `isAnalysisResult` guard can
 * never be handed a half-parsed memo.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/**
 * The endpoint is public, so every field below reaches the prompt as
 * untrusted text. Capping length is the cheap half of the defence; the
 * expensive half is free — a schema-constrained response can't be talked
 * into a different shape, whatever the input says.
 */
const clamp = (value: unknown, max: number): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

const MEMO_SCHEMA = {
  type: "object",
  properties: {
    investmentSummary: {
      type: "string",
      description: "2-3 sentence executive summary of catalog investment potential.",
    },
    growthOutlook: {
      type: "string",
      description: "2-3 sentence forward-looking growth assessment.",
    },
    riskAssessment: {
      type: "string",
      description:
        "2-3 sentence risk analysis covering market, trend, and catalog-specific risks.",
    },
    catalogType: {
      type: "string",
      enum: ["front", "mid", "back"],
      description:
        "Catalog age classification: front (recent), mid, or back (established).",
    },
    recommendedStrategy: {
      type: "string",
      description:
        "2-3 sentence actionable recommendation — acquire, hold, pass, or monitor.",
    },
  },
  required: [
    "investmentSummary",
    "growthOutlook",
    "riskAssessment",
    "catalogType",
    "recommendedStrategy",
  ],
  additionalProperties: false,
} as const;

const SYSTEM_PROMPT =
  `You are a senior music catalog investment analyst at a publishing acquisition firm, ` +
  `writing an internal analyst memo. Be concise and decision-oriented, and use professional ` +
  `financial language. Ground every claim in the streaming figures supplied with the request; ` +
  `where a figure is missing, say the assessment is directional rather than inventing one.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const artistName = clamp(body.artistName, 120);
    if (!artistName) return json({ error: "artistName is required" }, 400);

    const genre = clamp(body.genre, 60) || "unspecified";
    const catalogSize = Number(body.catalogSize);
    const catalogLine = Number.isFinite(catalogSize) && catalogSize > 0
      ? `approximately ${Math.min(Math.round(catalogSize), 100_000)} tracks`
      : "unspecified";

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY is not configured");
      return json({ error: "AI analysis is not configured on this deployment." }, 503);
    }

    const s = body.streamingData;
    const contextBlock = s
      ? `\nStreaming context (computed in the browser from the demonstration dataset):` +
        `\n- Total streams: ${s.totalStreams}` +
        `\n- Month-over-month growth: ${s.momGrowth}%` +
        `\n- Volatility: ${s.volatility}` +
        `\n- Catalog segment: ${s.segment}`
      : "\nNo streaming context was supplied.";

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      // Short, tightly-scoped generation behind a button press — low effort
      // keeps the memo fast without disabling thinking, which on Opus 5 is
      // the setting that causes stray internal markup in the visible text.
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: MEMO_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content:
            `Evaluate the catalog of ${artistName} for potential acquisition or portfolio inclusion.` +
            `\nGenre: ${genre}. Catalog size: ${catalogLine}.${contextBlock}` +
            `\n\nCover growth outlook, risk assessment, catalog classification, and recommended strategy.`,
        },
      ],
    });

    // Check why generation stopped before reading content: a refusal returns
    // HTTP 200 with an empty content array, and a max_tokens stop returns a
    // truncated one. Either way there is no memo to parse.
    if (message.stop_reason === "refusal") {
      console.error("model declined the request:", message.stop_details);
      return json({ error: "The model declined to analyze this request." }, 422);
    }
    if (message.stop_reason === "max_tokens") {
      console.error("memo truncated at max_tokens");
      return json({ error: "AI analysis was truncated. Please try again." }, 502);
    }

    const text = message.content.find((block) => block.type === "text")?.text ?? "";
    const parsed = JSON.parse(text);

    return json(parsed);
  } catch (e) {
    // Typed SDK errors, most specific first — the client shows these verbatim,
    // so each one has to be true and useful on its own.
    if (e instanceof Anthropic.RateLimitError) {
      return json({ error: "Rate limited. Please try again in a moment." }, 429);
    }
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
      console.error("catalog-analyzer credential rejected:", e.status, e.message);
      return json({ error: "AI analysis is not configured on this deployment." }, 503);
    }
    if (e instanceof Anthropic.APIError) {
      console.error("catalog-analyzer upstream error:", e.status, e.message);
      return json({ error: "AI analysis failed upstream. Please try again later." }, 502);
    }
    console.error("catalog-analyzer error:", e);
    return json({ error: "AI analysis failed. Please try again later." }, 500);
  }
});

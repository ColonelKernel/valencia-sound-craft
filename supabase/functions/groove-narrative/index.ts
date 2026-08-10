import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Anthropic from "npm:@anthropic-ai/sdk@0.116.0";

/**
 * Groove narrative for the Groove Atlas feel-space lab.
 *
 * Every number in the prompt is measured from the drum-performance dataset by
 * the browser before the call — the model describes the groove, it does not
 * characterise it. Callers treat any failure as "narrative unavailable" and
 * hide the panel, so a missing key degrades the page rather than breaking it.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const clamp = (value: unknown, max: number): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

/** Normalised 0–1 features render as percentages; anything else reads "unknown". */
const pct = (value: unknown): string =>
  typeof value === "number" && Number.isFinite(value)
    ? `${(value * 100).toFixed(0)}%`
    : "unknown";

const SYSTEM_PROMPT =
  `You are a musicologist-poet who writes vivid, concise groove analyses. Given a groove's ` +
  `parameters, write 2-3 sentences that blend analytical insight with evocative imagery. ` +
  `Reference specific musical traditions, body movements, or cultural contexts when relevant. ` +
  `Be specific about what makes this groove feel the way it does — mention timing, weight, ` +
  `breath, tension. Every word should reveal something about the rhythm's character. ` +
  `Keep it under 60 words, and reply with the narrative alone: no preamble, no headings.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const genre = clamp(body.genre, 60);
    if (!genre) return json({ error: "genre is required" }, 400);
    const substyle = clamp(body.substyle, 60);

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      console.error("ANTHROPIC_API_KEY is not configured");
      return json({ error: "Narrative generation is not configured on this deployment." }, 503);
    }

    const client = new Anthropic({ apiKey });

    const message = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      // A 60-word caption fetched while the visitor browses grooves: low effort
      // keeps it responsive, and leaving thinking at its default avoids the
      // stray internal markup that disabling it can produce.
      output_config: { effort: "low" },
      messages: [
        {
          role: "user",
          content:
            `Groove profile:` +
            `\n- Genre: ${genre}${substyle ? ` (${substyle})` : ""}` +
            `\n- Tempo: ${body.bpm} BPM` +
            `\n- Duration: ${body.duration}s` +
            `\n- Note density: ${pct(body.density)} (how busy)` +
            `\n- Swing: ${pct(body.swing)} (timing displacement)` +
            `\n- Syncopation: ${pct(body.syncopation)} (off-beat emphasis)` +
            `\n- Velocity variance: ${pct(body.velocity)} (dynamic range)` +
            `\n\nWrite a poetic-analytical narrative for this groove.`,
        },
      ],
    });

    if (message.stop_reason === "refusal") {
      console.error("model declined the request:", message.stop_details);
      return json({ error: "The model declined to describe this groove." }, 422);
    }

    const narrative = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    return json({ narrative });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) {
      return json({ error: "Rate limited, try again shortly." }, 429);
    }
    if (e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError) {
      console.error("groove-narrative credential rejected:", e.status, e.message);
      return json({ error: "Narrative generation is not configured on this deployment." }, 503);
    }
    if (e instanceof Anthropic.APIError) {
      console.error("groove-narrative upstream error:", e.status, e.message);
      return json({ error: "Narrative generation failed upstream." }, 502);
    }
    console.error("groove-narrative error:", e);
    return json({ error: "Narrative generation failed." }, 500);
  }
});

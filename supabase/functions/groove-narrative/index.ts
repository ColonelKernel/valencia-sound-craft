import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { genre, bpm, duration, density, swing, syncopation, velocity, substyle } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a musicologist-poet who writes vivid, concise groove analyses. 
Given a groove's parameters, write 2-3 sentences that blend analytical insight with evocative imagery. 
Reference specific musical traditions, body movements, or cultural contexts when relevant.
Be specific about what makes this groove feel the way it does — mention timing, weight, breath, tension.
Never use generic filler. Every word should reveal something about the rhythm's character.
Keep it under 60 words.`,
          },
          {
            role: "user",
            content: `Groove profile:
- Genre: ${genre}${substyle ? ` (${substyle})` : ""}
- Tempo: ${bpm} BPM
- Duration: ${duration}s
- Note density: ${(density * 100).toFixed(0)}% (how busy)
- Swing: ${(swing * 100).toFixed(0)}% (timing displacement)
- Syncopation: ${(syncopation * 100).toFixed(0)}% (off-beat emphasis)
- Velocity variance: ${(velocity * 100).toFixed(0)}% (dynamic range)

Write a poetic-analytical narrative for this groove.`,
          },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const narrative = data.choices?.[0]?.message?.content || "";

    return new Response(JSON.stringify({ narrative }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("groove-narrative error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

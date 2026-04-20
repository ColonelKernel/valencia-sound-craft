import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { progression, style, complexity, tempo, key, artistStyle } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const artistInstruction = artistStyle
      ? `\n\nStyle transfer: Emulate the playing style of ${artistStyle.label}. Key traits: ${artistStyle.traits.join(", ")}.`
      : "";

    const systemPrompt = `You are a world-class guitar improvisation coach and jazz theory expert. Given a chord progression, generate an improvisation analysis and a suggested solo phrase.

Your response MUST be valid JSON with this exact structure:
{
  "description": "A 2-3 paragraph analysis explaining the harmonic movement, recommended scales for each chord, voice leading opportunities, and stylistic approach. Be specific about which notes to target on strong beats, chromatic approach tones, and tension/resolution patterns.",
  "notes": [
    {"note": "C", "duration": "8th", "beat": 1, "chord": "Cmaj7"},
    {"note": "E", "duration": "8th", "beat": 1.5, "chord": "Cmaj7"}
  ]
}

Rules for the solo phrase:
- Target chord tones (3rd, 7th) on strong beats (1, 3)
- Use passing tones and chromatic approaches between chord tones
- Repeat and develop short motifs
- Resolve tensions logically
- Generate 8-16 notes per chord
- Use durations: "whole", "half", "quarter", "8th", "16th", "triplet"${artistInstruction}`;

    const userPrompt = `Progression: ${progression}
Key: ${key}
Style: ${style}
Complexity: ${complexity}/100 (0=pentatonic only, 50=modal, 100=altered/outside)
Tempo: ${tempo} BPM

Generate an improvisation analysis and solo phrase for this progression.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", status, errText);
      return new Response(
        JSON.stringify({ error: "AI generation failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from the response (handle markdown code blocks)
    let parsed: { description?: string; notes?: any[] } = {};
    try {
      const jsonMatch = content.match(/```json\s*([\s\S]*?)```/) || content.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content;
      parsed = JSON.parse(jsonStr.trim());
    } catch {
      // If JSON parsing fails, use the raw text as description
      parsed = { description: content, notes: [] };
    }

    return new Response(
      JSON.stringify({
        description: parsed.description || "Solo analysis generated.",
        notes: parsed.notes || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("improv-solo error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artistName, genre, catalogSize, streamingData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const contextBlock = streamingData
      ? `\nStreaming context: Total streams: ${streamingData.totalStreams}, MoM Growth: ${streamingData.momGrowth}%, Volatility: ${streamingData.volatility}, Catalog segment: ${streamingData.segment}`
      : "";

    const systemPrompt = `You are a senior music catalog investment analyst at a publishing acquisition firm. Write concise, decision-oriented analysis as if preparing an internal analyst memo. Return ONLY valid JSON with this exact structure:
{
  "investmentSummary": "string - 2-3 sentence executive summary of catalog investment potential",
  "growthOutlook": "string - 2-3 sentence forward-looking growth assessment",
  "riskAssessment": "string - 2-3 sentence risk analysis covering market, trend, and catalog-specific risks",
  "catalogType": "string - one of: front, mid, back",
  "recommendedStrategy": "string - 2-3 sentence actionable strategy recommendation (acquire, hold, pass, or monitor)"
}
Do not include any text outside the JSON object. Use professional financial language.`;

    const userPrompt = `Evaluate the catalog of ${artistName} for potential acquisition or portfolio inclusion.
Genre: ${genre}. Catalog size: approximately ${catalogSize} tracks.${contextBlock}
Provide investment-grade analysis covering growth outlook, risk assessment, catalog classification, and recommended strategy.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
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
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI analysis failed");
    }

    const aiData = await response.json();
    const content = aiData.choices?.[0]?.message?.content ?? "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Invalid AI response format");

    const parsed = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("catalog-analyzer error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LASTFM_BASE = "https://ws.audioscrobbler.com/2.0/";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { artist, includeWeekly } = await req.json();
    if (!artist || typeof artist !== "string") {
      return new Response(
        JSON.stringify({ error: "artist is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LASTFM_API_KEY = Deno.env.get("LASTFM_API_KEY");
    if (!LASTFM_API_KEY) {
      return new Response(
        JSON.stringify({ error: "LASTFM_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch artist info
    const infoUrl = `${LASTFM_BASE}?method=artist.getinfo&artist=${encodeURIComponent(artist)}&api_key=${LASTFM_API_KEY}&format=json`;
    const infoResp = await fetch(infoUrl);

    if (!infoResp.ok) {
      const text = await infoResp.text();
      console.error("Last.fm API error:", infoResp.status, text);
      return new Response(
        JSON.stringify({ error: `Last.fm API error: ${infoResp.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const infoData = await infoResp.json();
    if (infoData.error) {
      return new Response(
        JSON.stringify({ error: infoData.message ?? "Artist not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const artistInfo = infoData.artist;
    const result: Record<string, unknown> = {
      name: artistInfo?.name ?? artist,
      listeners: parseInt(artistInfo?.stats?.listeners ?? "0", 10),
      playcount: parseInt(artistInfo?.stats?.playcount ?? "0", 10),
      tags: (artistInfo?.tags?.tag ?? []).map((t: { name: string }) => t.name).slice(0, 5),
      bio: artistInfo?.bio?.summary?.replace(/<[^>]*>/g, "")?.slice(0, 300) ?? "",
      similar: (artistInfo?.similar?.artist ?? []).map((a: { name: string }) => a.name).slice(0, 5),
    };

    // Optionally fetch weekly chart list + recent weekly playcount data
    if (includeWeekly) {
      try {
        // Get weekly chart list to find available date ranges
        const chartListUrl = `${LASTFM_BASE}?method=artist.getweeklychartlist&artist=${encodeURIComponent(artist)}&api_key=${LASTFM_API_KEY}&format=json`;
        // Actually Last.fm doesn't have artist.getweeklychartlist
        // Use artist.getweeklyartistchart from user charts or use artist.gettoptracks with period
        // Better approach: use chart.getartistchart isn't available either
        // Most reliable: use artist.getTopTracks for different periods to approximate trend

        // Fetch top tracks for different time periods to build a trend
        const periods = [
          { period: "7day", label: "1W" },
          { period: "1month", label: "1M" },
          { period: "3month", label: "3M" },
          { period: "6month", label: "6M" },
          { period: "12month", label: "12M" },
        ];

        // Use artist.getTopAlbums with different periods to get playcount snapshots
        const weeklyData: { period: string; label: string; playcount: number; listeners: number }[] = [];

        for (const p of periods) {
          try {
            const topUrl = `${LASTFM_BASE}?method=artist.gettoptracks&artist=${encodeURIComponent(artist)}&api_key=${LASTFM_API_KEY}&format=json&period=${p.period}&limit=50`;
            const topResp = await fetch(topUrl);
            if (topResp.ok) {
              const topData = await topResp.json();
              const tracks = topData?.toptracks?.track ?? [];
              const totalPlaycount = tracks.reduce(
                (sum: number, t: { playcount: string }) => sum + parseInt(t.playcount ?? "0", 10),
                0
              );
              const totalListeners = tracks.reduce(
                (sum: number, t: { listeners: string }) => sum + parseInt(t.listeners ?? "0", 10),
                0
              );
              weeklyData.push({
                period: p.period,
                label: p.label,
                playcount: totalPlaycount,
                listeners: totalListeners,
              });
            } else {
              await topResp.text(); // consume body
            }
          } catch {
            // Skip failed period
          }
        }

        result.weeklyTrend = weeklyData;
      } catch (e) {
        console.error("Weekly chart fetch error:", e);
        result.weeklyTrend = [];
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("lastfm-artist error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

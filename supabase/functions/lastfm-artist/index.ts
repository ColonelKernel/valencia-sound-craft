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
    const { artist } = await req.json();
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

    const url = `${LASTFM_BASE}?method=artist.getinfo&artist=${encodeURIComponent(artist)}&api_key=${LASTFM_API_KEY}&format=json`;
    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      console.error("Last.fm API error:", response.status, text);
      return new Response(
        JSON.stringify({ error: `Last.fm API error: ${response.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    if (data.error) {
      return new Response(
        JSON.stringify({ error: data.message ?? "Artist not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const artistInfo = data.artist;
    const result = {
      name: artistInfo?.name ?? artist,
      listeners: parseInt(artistInfo?.stats?.listeners ?? "0", 10),
      playcount: parseInt(artistInfo?.stats?.playcount ?? "0", 10),
      tags: (artistInfo?.tags?.tag ?? []).map((t: { name: string }) => t.name).slice(0, 5),
      bio: artistInfo?.bio?.summary?.replace(/<[^>]*>/g, "")?.slice(0, 300) ?? "",
      similar: (artistInfo?.similar?.artist ?? []).map((a: { name: string }) => a.name).slice(0, 5),
    };

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

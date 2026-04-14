import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LASTFM_BASE = "https://ws.audioscrobbler.com/2.0/";

interface LastFmTag { name: string }
interface LastFmArtist { name: string }
interface LastFmAlbum { name: string; playcount: string }

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
      tags: (artistInfo?.tags?.tag ?? []).map((t: LastFmTag) => t.name).slice(0, 5),
      bio: artistInfo?.bio?.summary?.replace(/<[^>]*>/g, "")?.slice(0, 300) ?? "",
      similar: (artistInfo?.similar?.artist ?? []).map((a: LastFmArtist) => a.name).slice(0, 5),
    };

    // Fetch album catalog data for depth analysis
    if (includeWeekly) {
      try {
        const albumUrl = `${LASTFM_BASE}?method=artist.gettopalbums&artist=${encodeURIComponent(artist)}&api_key=${LASTFM_API_KEY}&format=json&limit=15`;
        const albumResp = await fetch(albumUrl);

        if (albumResp.ok) {
          const albumData = await albumResp.json();
          const albums = (albumData?.topalbums?.album ?? []) as LastFmAlbum[];
          result.albumCatalog = albums
            .filter((a) => a.name && a.name !== "(null)")
            .map((a) => ({
              name: a.name,
              playcount: parseInt(a.playcount ?? "0", 10),
            }))
            .slice(0, 12);
        } else {
          await albumResp.text();
          result.albumCatalog = [];
        }
      } catch (e) {
        console.error("Album fetch error:", e);
        result.albumCatalog = [];
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

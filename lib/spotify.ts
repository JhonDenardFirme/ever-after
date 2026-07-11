// -----------------------------------------------------------------------------
// lib/spotify.ts (1.2)
//
// Spotify, without the OAuth. Two facts drove this design:
//
//  1. Spotify's embed iframe (open.spotify.com/embed/…) can't be restyled — it
//     renders Spotify's own dark/green UI. So it can't BE our player; it can
//     only sit in a small secondary area for actual playback.
//  2. The full Web API (artist, album, duration) needs OAuth client credentials
//     — new secrets, token caching, real infra. Overkill for two people.
//
// The maintainable middle path, with ZERO new secrets: Spotify's public oEmbed
// endpoint gives us the album artwork + title unauthenticated. We build our own
// editorial card from that, add a "Play on Spotify" link, and keep the compact
// embed as the minimal in-page player. If oEmbed ever fails we degrade to just
// the embed — nothing breaks.
// -----------------------------------------------------------------------------

/** Pull {type, id} out of a Spotify link, tolerating /intl-xx/ and ?si=… */
export function parseSpotify(link: string | null): { type: string; id: string } | null {
  if (!link) return null;
  const m = link.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist|episode|show)\/([A-Za-z0-9]+)/i);
  return m ? { type: m[1].toLowerCase(), id: m[2] } : null;
}

export type SpotifyMeta = { title: string; thumbnail: string | null };

/**
 * Fetch album art + title via Spotify's public oEmbed (no auth). Cached a day.
 * Returns null on any non-Spotify link or failure — callers degrade gracefully.
 */
export async function getSpotifyOEmbed(link: string | null): Promise<SpotifyMeta | null> {
  if (!link || !parseSpotify(link)) return null;
  try {
    const res = await fetch(`https://open.spotify.com/oembed?url=${encodeURIComponent(link)}`, {
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { title?: string; thumbnail_url?: string };
    return { title: data.title ?? '', thumbnail: data.thumbnail_url ?? null };
  } catch {
    return null;
  }
}

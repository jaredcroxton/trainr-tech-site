// Vercel serverless function: fetch real Google reviews server-side.
// The API key lives in env vars (GOOGLE_PLACES_API_KEY), never exposed to the browser.
// Set in Vercel: GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID.
// Uses the Places API (New) v1.

export default async function handler(req, res) {
  const key = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  // Not configured yet: tell the frontend to keep its fallback cards.
  if (!key || !placeId) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ configured: false, reviews: [] });
  }

  try {
    const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
    const r = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': key,
        'X-Goog-FieldMask': 'rating,userRatingCount,googleMapsUri,reviews'
      }
    });
    if (!r.ok) {
      const detail = await r.text();
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ configured: true, error: 'places_api', status: r.status, detail: detail.slice(0, 300), reviews: [] });
    }
    const data = await r.json();
    const reviews = (data.reviews || []).map(rv => ({
      author: rv.authorAttribution?.displayName || 'Google user',
      photo: rv.authorAttribution?.photoUri || '',
      profileUrl: rv.authorAttribution?.uri || '',
      rating: rv.rating || 5,
      text: (rv.text?.text || rv.originalText?.text || '').trim(),
      when: rv.relativePublishTimeDescription || ''
    })).filter(rv => rv.text);

    // Cache at the edge for an hour, serve stale while revalidating.
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    return res.status(200).json({
      configured: true,
      rating: data.rating || null,
      total: data.userRatingCount || null,
      mapsUri: data.googleMapsUri || '',
      reviews
    });
  } catch (err) {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ configured: true, error: 'fetch_failed', reviews: [] });
  }
}

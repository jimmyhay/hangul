// Looks up a real photo via the Pexels API for a given search phrase.
// Keeps PEXELS_API_KEY on the server. Returns { imageUrl: "..." } - an
// empty string if nothing relevant was found, never an error for "no results".

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body || {};
  if (!query || !query.trim()) {
    return res.status(200).json({ imageUrl: '' });
  }

  try {
    const url = 'https://api.pexels.com/v1/search?per_page=1&query=' + encodeURIComponent(query.trim());
    const response = await fetch(url, {
      headers: { Authorization: process.env.PEXELS_API_KEY }
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Pexels error:', JSON.stringify(data));
      return res.status(200).json({ imageUrl: '' });
    }

    const photo = data.photos && data.photos[0];
    const imageUrl = (photo && photo.src && (photo.src.large || photo.src.medium || photo.src.original)) || '';

    res.status(200).json({ imageUrl });
  } catch (err) {
    console.error('Pexels proxy error:', err);
    res.status(200).json({ imageUrl: '' });
  }
}

// Proxies requests to Google's Gemini API (gemini-2.5-flash-lite), keeping
// GEMINI_API_KEY on the server. Despite the filename, this no longer calls
// Claude - kept as /api/claude so the frontend didn't need to change.
//
// The frontend sends the same shape it always has: { system, messages, max_tokens, tools }.
// This function translates that into Gemini's actual request format, and
// shapes Gemini's response to look like Claude's ({ content: [{ type: 'text', text }] })
// so none of the frontend's response-parsing code needed to change either.
//
// Free-tier Gemini has a fairly low requests-per-minute limit, so this
// retries automatically (with backoff) on 429s before giving up.

const MODEL = 'gemini-2.5-flash-lite';
const MAX_RETRIES = 2;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { system, messages, max_tokens, tools } = req.body || {};
  const userText = messages && messages[0] && messages[0].content;
  if (!userText) {
    return res.status(400).json({ error: 'Missing messages' });
  }

  const geminiBody = {
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    generationConfig: { maxOutputTokens: max_tokens || 1500 }
  };
  if (system) {
    geminiBody.systemInstruction = { parts: [{ text: system }] };
  }
  if (tools && tools.length) {
    // The frontend asks for Claude-style web_search; map that intent onto
    // Gemini's own grounding tool.
    geminiBody.tools = [{ google_search: {} }];
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

  try {
    let response;
    let data;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY
        },
        body: JSON.stringify(geminiBody)
      });

      if (response.status !== 429) break;

      if (attempt < MAX_RETRIES) {
        // Backoff: ~1.5s, then ~3s before giving up.
        await sleep(1500 * (attempt + 1));
      }
    }

    data = await response.json();

    if (!response.ok) {
      console.error('Gemini error:', JSON.stringify(data));
      if (response.status === 429) {
        return res.status(429).json({
          error: 'Rate limit reached on the free tier. Wait a moment and try again, or check your usage at aistudio.google.com/rate-limit.'
        });
      }
      return res.status(response.status).json({ error: data.error || data });
    }

    const candidate = data.candidates && data.candidates[0];
    const parts = (candidate && candidate.content && candidate.content.parts) || [];
    const text = parts.map((p) => p.text || '').join('');

    res.status(200).json({ content: [{ type: 'text', text }] });
  } catch (err) {
    console.error('Gemini proxy error:', err);
    res.status(500).json({ error: 'Failed to reach Gemini' });
  }
}

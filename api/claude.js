// Proxies chat requests to Claude, keeping ANTHROPIC_API_KEY on the server.
// The frontend sends { system, messages, max_tokens, tools } and gets Claude's raw response back.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { system, messages, max_tokens, tools } = req.body || {};
  if (!messages) {
    return res.status(400).json({ error: 'Missing messages' });
  }

  try {
    const body = {
      model: 'claude-sonnet-5',
      max_tokens: max_tokens || 1500,
      system,
      messages
    };
    if (tools) body.tools = tools;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('Claude proxy error:', err);
    res.status(500).json({ error: 'Failed to reach Claude' });
  }
}

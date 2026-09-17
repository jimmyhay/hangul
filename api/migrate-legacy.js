// One-time migration: copies the old shared history/flashcards (from the
// original passphrase-protected app_data table) into the requesting user's
// own row in user_data. Requires BOTH a valid logged-in session (proves who
// you are) AND the old APP_SECRET passphrase (proves you're the one who was
// using the shared data before accounts existed) - this stops a random new
// user from importing someone else's old shared deck into their account.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) {
    return res.status(401).json({ error: 'Not signed in' });
  }

  const legacySecret = req.headers['x-app-secret'];
  if (!legacySecret || legacySecret !== process.env.APP_SECRET) {
    return res.status(401).json({ error: 'Incorrect old passphrase' });
  }

  try {
    const { data: userResult, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userResult || !userResult.user) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }
    const userId = userResult.user.id;

    const { data: legacyRows, error: legacyErr } = await supabase
      .from('app_data')
      .select('key, value')
      .in('key', ['history', 'flashcards']);

    if (legacyErr) throw legacyErr;

    if (!legacyRows || !legacyRows.length) {
      return res.status(200).json({ ok: true, migrated: [] });
    }

    const migrated = [];
    for (const row of legacyRows) {
      const { error: upsertErr } = await supabase
        .from('user_data')
        .upsert(
          { user_id: userId, key: row.key, value: row.value, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,key' }
        );
      if (upsertErr) throw upsertErr;
      migrated.push(row.key);
    }

    res.status(200).json({ ok: true, migrated });
  } catch (err) {
    console.error('Migration error:', err);
    res.status(500).json({ error: 'Migration failed' });
  }
}

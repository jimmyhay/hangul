// Simple key-value storage backed by Supabase, standing in for window.storage.
// Protected by a shared secret so random visitors to your Vercel URL can't
// read or overwrite your data. Set APP_SECRET in Vercel's environment
// variables, and enter the same value once in the app itself.

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const secret = req.headers['x-app-secret'];
  if (!secret || secret !== process.env.APP_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const key = req.query.key;
  if (!key) {
    return res.status(400).json({ error: 'Missing key' });
  }

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('app_data')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ value: data ? data.value : null });
  }

  if (req.method === 'POST') {
    const { value } = req.body || {};
    const { error } = await supabase
      .from('app_data')
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const { error } = await supabase.from('app_data').delete().eq('key', key);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

Debug · JS
// TEMPORARY — delete this file once debugging is done.
// Visit /api/debug directly in your browser to see this output.
// It never reveals full secret values, only whether they're set and a
// masked preview, so it's safe to share the output with someone if needed.
 
function mask(value) {
  if (!value) return { present: false };
  const str = String(value);
  return {
    present: true,
    length: str.length,
    preview: str.length > 8
      ? str.slice(0, 4) + '...' + str.slice(-4)
      : '(too short to preview safely)'
  };
}
 
export default function handler(req, res) {
  res.status(200).json({
    ANTHROPIC_API_KEY: mask(process.env.ANTHROPIC_API_KEY),
    SUPABASE_URL: mask(process.env.SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: mask(process.env.SUPABASE_SERVICE_ROLE_KEY),
    APP_SECRET: mask(process.env.APP_SECRET)
  });
}

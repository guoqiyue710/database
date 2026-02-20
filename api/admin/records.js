const { supabase } = require('../_lib/supabase');
const { setCorsHeaders, handleOptions } = require('../_lib/cors');
const { requireAdmin } = require('../_lib/auth');

module.exports = async (req, res) => {
  if (handleOptions(req, res)) return;
  setCorsHeaders(req, res);

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  const admin = requireAdmin(req, res);
  if (!admin) return;

  const url = new URL(req.url, 'http://localhost');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 500);
  const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);

  const { data, error, count } = await supabase
    .from('submissions')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Failed to fetch records' }));
    return;
  }

  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true, data, count }));
};

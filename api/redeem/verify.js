const { supabase } = require('../_lib/supabase');
const { setCorsHeaders, handleOptions } = require('../_lib/cors');
const { readJson } = require('../_lib/body');

function normalizeCode(code) {
  return String(code || '').trim().toUpperCase();
}

module.exports = async (req, res) => {
  if (handleOptions(req, res)) return;
  setCorsHeaders(req, res);

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let body = {};
  try {
    body = await readJson(req);
  } catch (e) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  const code = normalizeCode(body.code);
  if (!code) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Code is required' }));
    return;
  }

  const { data, error } = await supabase
    .from('redeem_codes')
    .select('code, is_active, max_uses, used_count')
    .eq('code', code)
    .single();

  if (error || !data) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Invalid code' }));
    return;
  }

  if (!data.is_active) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Code disabled' }));
    return;
  }

  const used = data.used_count || 0;
  const max = data.max_uses || 1;
  if (used >= max) {
    res.statusCode = 409;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Code already used', remaining: 0 }));
    return;
  }

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(
    JSON.stringify({
      ok: true,
      code: data.code,
      used_count: used,
      max_uses: max,
      remaining_uses: Math.max(0, max - used)
    })
  );
};

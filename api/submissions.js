const { supabase } = require('./_lib/supabase');
const { setCorsHeaders, handleOptions } = require('./_lib/cors');

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
    body = JSON.parse(req.body || '{}');
  } catch (e) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Invalid JSON' }));
    return;
  }

  const testName = String(body.testName || '').trim();
  const redeemCode = normalizeCode(body.redeemCode);
  const answers = body.answers || null;
  const totalScore = Number.isFinite(body.totalScore) ? body.totalScore : null;
  const dimensionScores = body.dimensionScores || null;
  const clientTime = body.clientTime || null;

  if (!testName || !redeemCode) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'testName and redeemCode are required' }));
    return;
  }

  const { data: codeRow, error: codeError } = await supabase
    .from('redeem_codes')
    .select('code, is_active, max_uses, used_count')
    .eq('code', redeemCode)
    .single();

  if (codeError || !codeRow) {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Invalid code' }));
    return;
  }

  if (!codeRow.is_active) {
    res.statusCode = 403;
    res.end(JSON.stringify({ error: 'Code disabled' }));
    return;
  }

  const used = codeRow.used_count || 0;
  const max = codeRow.max_uses || 1;
  if (used >= max) {
    res.statusCode = 409;
    res.end(JSON.stringify({ error: 'Code already used' }));
    return;
  }

  const insertPayload = {
    test_name: testName,
    redeem_code: redeemCode,
    answers,
    total_score: totalScore,
    dimension_scores: dimensionScores,
    client_time: clientTime
  };

  const { error: insertError } = await supabase
    .from('submissions')
    .insert(insertPayload);

  if (insertError) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Failed to save submission' }));
    return;
  }

  const { error: updateError } = await supabase
    .from('redeem_codes')
    .update({
      used_count: used + 1,
      used_at: new Date().toISOString()
    })
    .eq('code', redeemCode);

  if (updateError) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Saved but failed to update code usage' }));
    return;
  }

  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true }));
};

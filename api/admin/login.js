const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../_lib/supabase');
const { setCorsHeaders, handleOptions } = require('../_lib/cors');
const { readJson } = require('../_lib/body');

module.exports = async (req, res) => {
  if (handleOptions(req, res)) return;
  setCorsHeaders(req, res);

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  if (!process.env.JWT_SECRET) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: 'Missing JWT_SECRET' }));
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

  const email = String(body.email || '').trim().toLowerCase();
  const password = String(body.password || '');
  if (!email || !password) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Email and password are required' }));
    return;
  }

  const { data: admin, error } = await supabase
    .from('admins')
    .select('id, email, password_hash')
    .eq('email', email)
    .single();

  if (error || !admin) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Invalid credentials' }));
    return;
  }

  const ok = await bcrypt.compare(password, admin.password_hash);
  if (!ok) {
    res.statusCode = 401;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Invalid credentials' }));
    return;
  }

  const token = jwt.sign(
    { adminId: admin.id, email: admin.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.statusCode = 200;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ ok: true, token }));
};

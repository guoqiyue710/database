const jwt = require('jsonwebtoken');

function requireAdmin(req, res) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return null;
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload;
  } catch (err) {
    res.statusCode = 401;
    res.end(JSON.stringify({ error: 'Invalid token' }));
    return null;
  }
}

module.exports = { requireAdmin };

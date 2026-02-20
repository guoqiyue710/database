const { supabase } = require('../_lib/supabase');
const { setCorsHeaders, handleOptions } = require('../_lib/cors');
const { requireAdmin } = require('../_lib/auth');

function toCsv(rows) {
  const headers = [
    'id',
    'created_at',
    'test_name',
    'redeem_code',
    'total_score',
    'answers',
    'dimension_scores',
    'client_time'
  ];
  const escape = (value) => {
    if (value === null || value === undefined) return '';
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    return `"${str.replace(/"/g, '""')}"`;
  };
  const lines = [headers.join(',')];
  rows.forEach((row) => {
    const line = headers.map((h) => escape(row[h]));
    lines.push(line.join(','));
  });
  return lines.join('\n');
}

module.exports = async (req, res) => {
  if (handleOptions(req, res)) return;
  setCorsHeaders(req, res);

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end('Method not allowed');
    return;
  }

  const admin = requireAdmin(req, res);
  if (!admin) return;

  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    res.statusCode = 500;
    res.end('Failed to export');
    return;
  }

  const csv = toCsv(data || []);
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="submissions.csv"');
  res.end('\uFEFF' + csv);
};

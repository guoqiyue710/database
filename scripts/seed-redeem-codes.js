const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const filePath = process.env.CODES_FILE || '';
const maxUses = parseInt(process.env.MAX_USES || '1', 10);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!filePath) {
  console.error('Missing CODES_FILE');
  process.exit(1);
}
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const content = fs.readFileSync(path.resolve(filePath), 'utf8');
const codes = content
  .split(/\r?\n/)
  .map((line) => line.replace(/[^A-Za-z0-9]/g, '').toUpperCase())
  .filter(Boolean);

if (codes.length === 0) {
  console.error('No codes found in file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function run() {
  const rows = codes.map((code) => ({
    code,
    max_uses: Number.isFinite(maxUses) ? maxUses : 1,
    is_active: true
  }));

  const { error } = await supabase
    .from('redeem_codes')
    .upsert(rows, { onConflict: 'code' });

  if (error) {
    console.error('Failed to seed codes:', error.message);
    process.exit(1);
  }
  console.log(`Seeded ${rows.length} codes.`);
}

run();

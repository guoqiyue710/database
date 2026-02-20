const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || '');
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!email || !password) {
  console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD');
  process.exit(1);
}
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false }
});

async function run() {
  const passwordHash = await bcrypt.hash(password, 10);
  const { error } = await supabase.from('admins').insert({
    email,
    password_hash: passwordHash
  });
  if (error) {
    console.error('Failed to create admin:', error.message);
    process.exit(1);
  }
  console.log('Admin created:', email);
}

run();

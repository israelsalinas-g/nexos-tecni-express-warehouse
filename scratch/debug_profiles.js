const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnon);

async function run() {
  const { data, error } = await supabase.from('profiles').select('id, full_name, email, is_admin, admin_role');
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

run();

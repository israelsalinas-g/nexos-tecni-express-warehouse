const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cnaenmwzplrtnjaxhxqe.supabase.co';
const supabaseAnon = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuYWVubXd6cGxydG5qYXhoeHFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5Mzc5MzgsImV4cCI6MjA5MzUxMzkzOH0.i_GKr__XrEJ0MvJH_uFa6ICLUeuFPjTL1OkjFasbHtE';

const supabase = createClient(supabaseUrl, supabaseAnon, {
  auth: { persistSession: false },
  realtime: { enabled: false }
});

async function run() {
  const { data, error } = await supabase.from('profiles').select('id, full_name, email, is_admin, admin_role');
  if (error) {
    console.error('Error fetching profiles:', error);
  } else {
    console.log('--- PROFILES DATA ---');
    console.log(JSON.stringify(data, null, 2));
    console.log('--- END ---');
  }
}

run();

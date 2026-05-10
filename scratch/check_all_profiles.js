const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cnaenmwzplrtnjaxhxqe.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuYWVubXd6cGxydG5qYXhoeHFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzkzNzkzOCwiZXhwIjoyMDkzNTEzOTM4fQ.iyE5BGf-2MQgyzMFS4Fk0eqW1h-ZOEDg40lFrX923bc';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false },
  realtime: { enabled: false }
});

async function run() {
  const { data, error, count } = await supabase.from('profiles').select('*', { count: 'exact' });
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Total profiles:', count);
    console.log('Profiles data:', JSON.stringify(data, null, 2));
  }
}

run();

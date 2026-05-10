const supabaseUrl = 'https://cnaenmwzplrtnjaxhxqe.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNuYWVubXd6cGxydG5qYXhoeHFlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzkzNzkzOCwiZXhwIjoyMDkzNTEzOTM4fQ.iyE5BGf-2MQgyzMFS4Fk0eqW1h-ZOEDg40lFrX923bc';

async function run() {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/profiles?select=*`, {
      headers: {
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`,
      }
    });
    const data = await response.json();
    console.log('Total profiles:', data.length);
    console.log('Profiles data:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

run();

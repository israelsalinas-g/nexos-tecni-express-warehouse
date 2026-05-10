import { supabase } from '../lib/supabase'

async function checkProfiles() {
  const { data, error } = await supabase.from('profiles').select('*')
  if (error) {
    console.error(error)
    return
  }
  console.log('Profiles in DB:', JSON.stringify(data, null, 2))
}

checkProfiles()

const fs = require('fs');

async function testSupabase() {
  console.log('--- Testing Supabase Connectivity & Functionality ---');
  let url = '';
  let key = '';

  const pubCfg = fs.readFileSync('supabase_public_config.js', 'utf8');
  const uM = pubCfg.match(/VECTORSELECT_SUPABASE_URL\s*=\s*["']([^"']+)["']/);
  const kM = pubCfg.match(/VECTORSELECT_SUPABASE_ANON_KEY\s*=\s*["']([^"']+)["']/);
  if (uM) url = uM[1];
  if (kM) key = kM[1];

  console.log('Supabase URL:', url);
  console.log('Anon Key Present:', Boolean(key));

  const tables = [
    'active_assignments',
    'answer_keys',
    'exam_submissions',
    'session_participants',
    'live_question_answers',
    'live_reactions'
  ];

  for (const table of tables) {
    try {
      const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=3`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });
      console.log(`Table [${table}] -> HTTP ${res.status} ${res.statusText}`);
      if (res.ok) {
        const rows = await res.json();
        console.log(`   ✓ Active & Accessible. Returned ${rows.length} rows.`);
        if (rows.length > 0) {
          console.log(`     Sample row keys:`, Object.keys(rows[0]).slice(0, 6));
        }
      } else {
        const err = await res.text();
        console.log(`   ✗ Error:`, err);
      }
    } catch (e) {
      console.error(`   ✗ Fetch exception for [${table}]:`, e.message);
    }
  }
}

testSupabase();

import { neon } from '@netlify/neon';

const connectionString = 'postgresql://neondb_owner:npg_INAZuqGpK02b@ep-bold-sky-aenvxkww-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const sql = neon(connectionString);

async function checkDatabase() {
  try {
    console.log('🔄 Connecting to Neon Database...');
    const result = await sql`SELECT version()`;
    console.log('✅ Connection successful!');
    console.log('📊 Version:', result[0].version);

    console.log('\n🔍 Checking tables...');
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    if (tables.length === 0) {
      console.log('⚠️ No tables found in public schema.');
    } else {
      console.log('📋 Found tables:');
      tables.forEach(t => console.log(` - ${t.table_name}`));
    }

    // Check specific tables we fixed
    const loginHistory = await sql`SELECT count(*) FROM login_history`;
    console.log(`\n✅ login_history count: ${loginHistory[0].count}`);

    const activities = await sql`SELECT count(*) FROM activities`;
    console.log(`✅ activities count: ${activities[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkDatabase();

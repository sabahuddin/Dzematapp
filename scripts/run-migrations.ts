import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';

const { Pool } = pg;

async function runMigrations() {
  console.log('[MIGRATIONS] Starting database migrations...');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('[MIGRATIONS] ❌ DATABASE_URL not set');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  try {
    console.log('[MIGRATIONS] Running migrations from ./migrations folder...');
    await migrate(db, { migrationsFolder: './migrations' });
    console.log('[MIGRATIONS] ✅ Migrations completed successfully!');
  } catch (error) {
    console.error('[MIGRATIONS] ❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();

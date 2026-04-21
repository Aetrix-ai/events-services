import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema';

type DbClient = ReturnType<typeof drizzle>;

declare global {
  // eslint-disable-next-line no-var
  var db: DbClient | undefined;
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = global.db || drizzle({ client: pool, schema });

if (process.env.NODE_ENV !== 'production') {
  global.db = db;
}

export { db };
export default db;

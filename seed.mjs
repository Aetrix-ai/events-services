import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiPackageJsonPath = path.resolve(__dirname, 'apps/api/package.json');
const requireFromApi = createRequire(apiPackageJsonPath);

const { Pool } = requireFromApi('pg');
const dotenv = requireFromApi('dotenv');

dotenv.config({ path: path.resolve(__dirname, 'apps/api/.env') });

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing. Set it in apps/api/.env before running the seed script.');
}

const seedData = {
  credentials: [
    {
      username: 'admin_alpha',
      passwordHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbddc2b8b4f0f7f9d0f6d',
      passwordPlaintextForDocs: 'password',
    },
    {
      username: 'admin_beta',
      passwordHash: 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
      passwordPlaintextForDocs: 'password123',
    },
  ],
  events: [
    {
      name: 'Aetrix Hackathon 2026',
      date: '2026-06-15',
      location: 'Main Campus Auditorium',
      description: 'University-wide hackathon seed data event',
      owner: 'admin_alpha',
      teamSize: 4,
    },
    {
      name: 'AI Sprint Challenge 2026',
      date: '2026-07-05',
      location: 'Innovation Lab',
      description: 'AI prototype challenge seed data event',
      owner: 'admin_beta',
      teamSize: 3,
    },
  ],
  teams: [
    { name: 'Alpha Builders', eventName: 'Aetrix Hackathon 2026' },
    { name: 'Code Comets', eventName: 'Aetrix Hackathon 2026' },
    { name: 'Neural Ninjas', eventName: 'AI Sprint Challenge 2026' },
  ],
  registrations: [
    {
      name: 'Riya Sharma',
      college: 'Aetrix Institute',
      branch: 'CSE',
      semester: 6,
      teamName: 'Alpha Builders',
      eventName: 'Aetrix Hackathon 2026',
    },
    {
      name: 'Aarav Singh',
      college: 'Aetrix Institute',
      branch: 'ECE',
      semester: 4,
      teamName: 'Alpha Builders',
      eventName: 'Aetrix Hackathon 2026',
    },
    {
      name: 'Meera Iyer',
      college: 'Tech Valley College',
      branch: 'IT',
      semester: 8,
      teamName: 'Code Comets',
      eventName: 'Aetrix Hackathon 2026',
    },
    {
      name: 'Kabir Khan',
      college: 'Future Engineering College',
      branch: 'AI/ML',
      semester: 5,
      teamName: 'Neural Ninjas',
      eventName: 'AI Sprint Challenge 2026',
    },
  ],
};

const usernames = seedData.credentials.map((item) => item.username);
const eventNames = seedData.events.map((item) => item.name);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();

try {
  await client.query('BEGIN');

  await client.query(
    `DELETE FROM registrations
     WHERE event_id IN (
       SELECT id FROM events WHERE owner = ANY($1::text[]) OR name = ANY($2::text[])
     )`,
    [usernames, eventNames],
  );

  await client.query(
    `DELETE FROM teams
     WHERE event_id IN (
       SELECT id FROM events WHERE owner = ANY($1::text[]) OR name = ANY($2::text[])
     )`,
    [usernames, eventNames],
  );

  await client.query(
    `DELETE FROM events
     WHERE owner = ANY($1::text[]) OR name = ANY($2::text[])`,
    [usernames, eventNames],
  );

  await client.query('DELETE FROM credentials WHERE username = ANY($1::text[])', [usernames]);

  for (const credential of seedData.credentials) {
    await client.query(
      `INSERT INTO credentials (username, password)
       VALUES ($1, $2)
       ON CONFLICT (username)
       DO UPDATE SET password = EXCLUDED.password, updated_at = NOW()`,
      [credential.username, credential.passwordHash],
    );
  }

  const eventIdByName = new Map();

  for (const event of seedData.events) {
    const { rows } = await client.query(
      `INSERT INTO events (name, date, location, description, owner, team_size)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name`,
      [event.name, event.date, event.location, event.description, event.owner, event.teamSize],
    );

    eventIdByName.set(rows[0].name, rows[0].id);
  }

  const teamIdByName = new Map();

  for (const team of seedData.teams) {
    const eventId = eventIdByName.get(team.eventName);

    const { rows } = await client.query(
      `INSERT INTO teams (name, event_id)
       VALUES ($1, $2)
       RETURNING id, name`,
      [team.name, eventId],
    );

    teamIdByName.set(rows[0].name, rows[0].id);
  }

  for (const registration of seedData.registrations) {
    const eventId = eventIdByName.get(registration.eventName);
    const teamId = teamIdByName.get(registration.teamName);

    await client.query(
      `INSERT INTO registrations (name, college, branch, semester, team_id, event_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        registration.name,
        registration.college,
        registration.branch,
        registration.semester,
        teamId,
        eventId,
      ],
    );
  }

  await client.query('COMMIT');

  console.log('✅ Seed completed successfully.');
  console.log('Inserted credentials:', seedData.credentials.map((item) => item.username).join(', '));
  console.log('Inserted events:', seedData.events.map((item) => item.name).join(', '));
} catch (error) {
  await client.query('ROLLBACK');
  console.error('❌ Seed failed:', error);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}

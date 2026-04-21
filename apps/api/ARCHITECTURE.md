# Event Management API Architecture

## Overview
This is a complete event management system built with **Drizzle ORM**, **Express.js**, and **PostgreSQL**. The system is designed for external applications to create events with automatic credential management, while allowing public users to register without authentication.

---

## Technology Stack

### Core Technologies
- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.x
- **Language**: TypeScript 5.9.2
- **ORM**: Drizzle ORM 0.44.7
- **Database**: PostgreSQL (via Neon with connection pooling)
- **Package Manager**: pnpm 9.0.0
- **Monorepo**: Turborepo 2.9.6

### Key Dependencies
```json
{
  "drizzle-orm": "^0.44.0",
  "express": "^5.2.1",
  "pg": "^8.20.0",
  "@types/express": "^5.0.6",
  "@types/pg": "^8.15.5"
}
```

### Dev Dependencies
```json
{
  "drizzle-kit": "^0.31.10",
  "dotenv": "^17.4.2",
  "typescript": "5.9.2"
}
```

---

## Authentication Architecture

### Hashed Password Flow

The API uses a **pre-hashed password** system designed for external applications:

```
┌─────────────────┐
│  External App   │
│  (Hashes PW)    │
└────────┬────────┘
         │
         │ POST /api/events
         │ { owner, hashedPassword, ... }
         ▼
┌─────────────────────────────┐
│  Event Creation Endpoint    │
│  1. Upsert credentials      │
│  2. Create event            │
└────────┬────────────────────┘
         │
         │ Credentials stored/updated
         ▼
┌─────────────────────────────┐
│  Credentials Table          │
│  username | hashedPassword  │
└─────────────────────────────┘
         │
         │ Admin can now login
         ▼
┌─────────────────────────────┐
│  POST /api/auth/login       │
│  { username, hashedPassword }│
└────────┬────────────────────┘
         │
         │ Authenticated
         ▼
┌─────────────────────────────┐
│  POST /api/auth/my-events   │
│  View all events + registrations │
└─────────────────────────────┘
```

### Key Features
1. **No Plain Text**: API never receives plain-text passwords
2. **Auto Credential Management**: Credentials created/updated on event creation
3. **External App Control**: External apps manage password hashing
4. **Simple Auth**: Direct hash comparison (no JWT complexity for MVP)
5. **Public Registration**: No auth required for event registration

---

## Database Schema

### Entity Relationship Diagram

```
┌──────────────┐
│ credentials  │
│──────────────│
│ id (PK)      │
│ username (UK)│◄────┐
│ password     │     │
│ createdAt    │     │
│ updatedAt    │     │
└──────────────┘     │
                     │ owner (FK)
┌──────────────┐     │
│   events     │     │
│──────────────│     │
│ id (PK)      │─────┘
│ name         │
│ date         │
│ location     │
│ description  │
│ owner        │
│ teamSize     │
│ createdAt    │
│ updatedAt    │
└──────┬───────┘
       │
       │ eventId (FK, CASCADE)
       │
       ├──────────────────┐
       │                  │
       ▼                  ▼
┌──────────────┐   ┌──────────────┐
│    teams     │   │registrations │
│──────────────│   │──────────────│
│ id (PK)      │◄──│ id (PK)      │
│ name         │   │ name         │
│ eventId (FK) │   │ email        │
│ createdAt    │   │ phone        │
└──────┬───────┘   │ teamId (FK)  │
       │           │ eventId (FK) │
       │           │ createdAt    │
       │           └──────────────┘
       │ teamId (FK, CASCADE)
       │
       └───────────┘
```

### Table Definitions

#### credentials
```typescript
{
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(), // Pre-hashed
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}
```

#### events
```typescript
{
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  date: date('date').notNull(),
  location: varchar('location', { length: 255 }).notNull(),
  description: text('description'),
  owner: varchar('owner', { length: 255 }).notNull(), // References credentials.username
  teamSize: integer('team_size').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}
```

#### teams
```typescript
{
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}
```

#### registrations
```typescript
{
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  teamId: integer('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}
```

### Cascade Deletes
- Deleting an **event** → deletes all teams and registrations
- Deleting a **team** → deletes all registrations in that team

---

## API Routes Structure

### Route Organization
```
src/routes/
├── auth.ts          # Admin authentication
├── events.ts        # Event CRUD + stats
├── registrations.ts # Public registration
└── teams.ts         # Team management
```

### Endpoint Summary

| Route | Method | Auth Required | Description |
|-------|--------|---------------|-------------|
| `/api/auth/login` | POST | No (validates hash) | Admin login |
| `/api/auth/my-events` | POST | Yes (hash auth) | Get admin's events |
| `/api/events` | POST | No (auto-creates creds) | Create event |
| `/api/events` | GET | No | List all events |
| `/api/events/:id` | GET | No | Get event details |
| `/api/events/:id` | PUT | No | Update event |
| `/api/events/:id` | DELETE | No | Delete event |
| `/api/events/:id/stats` | GET | No | Event statistics |
| `/api/registrations/new-team` | POST | No | Register with new team |
| `/api/registrations/join-team` | POST | No | Join existing team |
| `/api/registrations` | GET | No | List registrations |
| `/api/registrations/:id` | GET/PUT/DELETE | No | Manage registration |
| `/api/teams` | POST/GET | No | Create/list teams |
| `/api/teams/:id` | GET/PUT/DELETE | No | Manage team |
| `/api/teams/:id/capacity` | GET | No | Check team capacity |
| `/api/teams/event/:eventId/available` | GET | No | Available teams |

---

## Request/Response Flow

### 1. Event Creation Flow
```
External App
    │
    │ 1. Hash password (SHA-256/bcrypt)
    │
    ▼
POST /api/events
{
  "name": "Tech Fest",
  "owner": "admin1",
  "hashedPassword": "abc123...",
  ...
}
    │
    │ 2. Upsert credentials
    │    - If admin1 exists → update password
    │    - If admin1 new → create credential
    │
    ▼
Credentials Table Updated
    │
    │ 3. Create event
    │
    ▼
Event Created
    │
    ▼
Response: { success: true, data: {...}, message: "Event created. Credentials updated." }
```

### 2. Admin Login Flow
```
Admin Dashboard
    │
    │ 1. Hash password (same method as external app)
    │
    ▼
POST /api/auth/login
{
  "username": "admin1",
  "hashedPassword": "abc123..."
}
    │
    │ 2. Verify credentials
    │    - Find user by username
    │    - Compare hashed passwords
    │
    ▼
Authentication Success
    │
    ▼
Response: { success: true, data: { id, username } }
```

### 3. View Events Flow
```
Admin Dashboard
    │
    │ 1. Send credentials
    │
    ▼
POST /api/auth/my-events
{
  "username": "admin1",
  "hashedPassword": "abc123..."
}
    │
    │ 2. Authenticate
    │
    ▼
Query Events
    │
    │ 3. Get all events where owner = username
    │    - Include teams with members
    │    - Include all registrations
    │
    ▼
Response: { success: true, data: [...events with full details...] }
```

### 4. Public Registration Flow
```
Public User
    │
    │ No authentication required
    │
    ▼
POST /api/registrations/new-team
{
  "eventId": 1,
  "teamName": "Warriors",
  "name": "John",
  "email": "john@example.com",
  "phone": "123456"
}
    │
    │ 1. Validate event exists
    │ 2. Create team
    │ 3. Create registration
    │
    ▼
Response: { success: true, data: { registration, team } }
```

---

## Security Considerations

### Current Implementation
1. **Pre-hashed Passwords**: External apps hash before sending
2. **Direct Comparison**: Simple hash comparison for auth
3. **No JWT**: Stateless auth via hash verification
4. **Public Endpoints**: Registrations don't need auth
5. **CORS Enabled**: For frontend integration

### Production Recommendations
1. **Rate Limiting**: Add express-rate-limit
2. **Input Validation**: Add Zod or Joi schemas
3. **JWT Tokens**: Implement for session management
4. **HTTPS Only**: Enforce SSL/TLS
5. **Environment Variables**: Secure credential storage
6. **Logging**: Add Winston or Pino
7. **Monitoring**: Add Sentry or similar

---

## Database Connection

### Configuration
```typescript
// src/lib/db.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle({ client: pool, schema });
```

### Connection Pooling
- Uses `pg` Pool for connection management
- Neon PostgreSQL with built-in pooling
- Automatic connection reuse
- Graceful error handling

---

## Development Workflow

### Setup
```bash
cd event-services/apps/api
pnpm install
```

### Database Commands
```bash
# Generate migrations
pnpm db:generate

# Run migrations
pnpm db:migrate

# Push schema (development)
pnpm db:push

# Open Drizzle Studio
pnpm db:studio
```

### Running the API
```bash
# Development mode
pnpm dev

# Production build
pnpm build
pnpm start
```

---

## Error Handling

### Standard Error Response
```json
{
  "success": false,
  "error": "Error message here"
}
```

### HTTP Status Codes
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation)
- `401`: Unauthorized (invalid credentials)
- `404`: Not Found
- `409`: Conflict (duplicate)
- `500`: Internal Server Error

---

## Future Enhancements

### Phase 1 (Current)
- ✅ Drizzle ORM migration
- ✅ Event CRUD operations
- ✅ Team management
- ✅ Public registration
- ✅ Hashed password authentication
- ✅ Auto credential management

### Phase 2 (Planned)
- [ ] JWT token authentication
- [ ] Rate limiting
- [ ] Input validation (Zod)
- [ ] Email notifications
- [ ] File uploads (team logos)
- [ ] Event capacity limits
- [ ] Waitlist functionality

### Phase 3 (Future)
- [ ] Real-time updates (WebSockets)
- [ ] Payment integration
- [ ] QR code generation
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Mobile app API

---

## Deployment

### Environment Variables
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
PORT=3000
NODE_ENV=production
```

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Testing Strategy

### Unit Tests (Planned)
- Route handlers
- Database queries
- Validation logic

### Integration Tests (Planned)
- API endpoints
- Database operations
- Authentication flow

### E2E Tests (Planned)
- Complete user workflows
- Registration process
- Admin dashboard

---

Made with Bob
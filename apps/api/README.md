# Event Management API

A complete event management system built with **Drizzle ORM**, **Express.js**, and **PostgreSQL**. Designed for external applications to create events with automatic credential management, while allowing public users to register without authentication.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Neon account)
- pnpm 9.0.0+

### Installation

```bash
# Navigate to API directory
cd event-services/apps/api

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your DATABASE_URL
```

### Database Setup

```bash
# Push schema to database (creates tables)
pnpm db:push

# Or generate and run migrations
pnpm db:generate
pnpm db:migrate

# Open Drizzle Studio (optional)
pnpm db:studio
```

### Run the Server

```bash
# Development mode (with hot reload)
pnpm dev

# Production mode
pnpm build
pnpm start
```

The API will be available at `http://localhost:3000`

---

## 🔐 Authentication System

### How It Works

This API uses a **pre-hashed password** authentication system:

1. **External App** hashes passwords before sending (SHA-256, bcrypt, etc.)
2. **Event Creation** automatically creates or updates admin credentials
3. **Admin Login** uses the same hashed password to authenticate
4. **View Events** admins can see all their events with full registration details

### Key Features
- ✅ No plain-text passwords ever transmitted or stored
- ✅ Automatic credential management on event creation
- ✅ Simple hash comparison for authentication
- ✅ Public registration endpoints (no auth required)
- ✅ Admin can manage multiple events with one credential

---

## 📋 API Endpoints

### Authentication Routes

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin_username",
  "hashedPassword": "your_hashed_password_here"
}
```

#### Get My Events
```bash
POST /api/auth/my-events
Content-Type: application/json

{
  "username": "admin_username",
  "hashedPassword": "your_hashed_password_here"
}
```

### Event Routes

#### Create Event (Auto-creates/updates credentials)
```bash
POST /api/events
Content-Type: application/json

{
  "name": "Tech Conference 2024",
  "date": "2024-06-15",
  "location": "Convention Center",
  "description": "Annual tech conference",
  "owner": "admin_username",
  "teamSize": 4,
  "hashedPassword": "your_hashed_password_here"
}
```

#### List All Events
```bash
GET /api/events
```

#### Get Event Details
```bash
GET /api/events/:id
```

#### Update Event
```bash
PUT /api/events/:id
Content-Type: application/json

{
  "name": "Updated Event Name",
  "date": "2024-07-20"
}
```

#### Delete Event
```bash
DELETE /api/events/:id
```

#### Get Event Statistics
```bash
GET /api/events/:id/stats
```

### Registration Routes (Public - No Auth)

#### Register with New Team
```bash
POST /api/registrations/new-team
Content-Type: application/json

{
  "eventId": 1,
  "teamName": "Team Alpha",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890"
}
```

#### Join Existing Team
```bash
POST /api/registrations/join-team
Content-Type: application/json

{
  "teamId": 1,
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "0987654321"
}
```

### Team Routes

#### Get Available Teams for Event
```bash
GET /api/teams/event/:eventId/available
```

#### Check Team Capacity
```bash
GET /api/teams/:id/capacity
```

For complete API documentation, see [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

---

## 🏗️ Architecture

### Technology Stack
- **ORM**: Drizzle ORM 0.44.7
- **Framework**: Express.js 5.2.1
- **Database**: PostgreSQL (Neon)
- **Language**: TypeScript 5.9.2
- **Package Manager**: pnpm 9.0.0

### Database Schema

```
credentials (admin accounts)
  ├── id (PK)
  ├── username (unique)
  ├── password (hashed)
  └── timestamps

events
  ├── id (PK)
  ├── name, date, location
  ├── owner (FK → credentials.username)
  ├── teamSize
  └── timestamps

teams
  ├── id (PK)
  ├── name
  ├── eventId (FK → events.id, CASCADE)
  └── createdAt

registrations
  ├── id (PK)
  ├── name, email, phone
  ├── teamId (FK → teams.id, CASCADE)
  ├── eventId (FK → events.id, CASCADE)
  └── createdAt
```

For detailed architecture, see [ARCHITECTURE.md](./ARCHITECTURE.md)

---

## 💡 Usage Examples

### Example 1: External App Creates Event

```bash
# External app hashes password (e.g., SHA-256)
HASHED_PW=$(echo -n "mypassword" | sha256sum | cut -d' ' -f1)

# Create event (auto-creates/updates credentials)
curl -X POST http://localhost:3000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Tech Fest 2024",
    "date": "2024-08-15",
    "location": "Main Hall",
    "owner": "techfest_admin",
    "teamSize": 4,
    "hashedPassword": "'$HASHED_PW'"
  }'
```

### Example 2: Admin Logs In

```bash
# Admin logs in with same hashed password
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "techfest_admin",
    "hashedPassword": "'$HASHED_PW'"
  }'
```

### Example 3: Admin Views Their Events

```bash
# Get all events with full registration details
curl -X POST http://localhost:3000/api/auth/my-events \
  -H "Content-Type: application/json" \
  -d '{
    "username": "techfest_admin",
    "hashedPassword": "'$HASHED_PW'"
  }'
```

### Example 4: Public User Registers

```bash
# Public registration (no auth needed)
curl -X POST http://localhost:3000/api/registrations/new-team \
  -H "Content-Type: application/json" \
  -d '{
    "eventId": 1,
    "teamName": "Code Warriors",
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "phone": "5551234567"
  }'
```

---

## 🛠️ Development

### Available Scripts

```bash
# Development
pnpm dev              # Start dev server with hot reload

# Database
pnpm db:generate      # Generate migrations from schema
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema directly (dev only)
pnpm db:studio        # Open Drizzle Studio

# Build
pnpm build            # Build for production
pnpm start            # Start production server

# Type Checking
pnpm check-types      # Run TypeScript type checking
```

### Project Structure

```
apps/api/
├── src/
│   ├── db/
│   │   └── schema.ts          # Database schema
│   ├── lib/
│   │   └── db.ts              # Database client
│   ├── routes/
│   │   ├── auth.ts            # Authentication routes
│   │   ├── events.ts          # Event CRUD routes
│   │   ├── registrations.ts   # Registration routes
│   │   └── teams.ts           # Team management routes
│   ├── index.ts               # Express app setup
│   └── server.ts              # Server entry point
├── drizzle/                   # Generated migrations
├── drizzle.config.ts          # Drizzle Kit config
├── package.json
├── tsconfig.json
├── .env                       # Environment variables
├── README.md                  # This file
├── API_DOCUMENTATION.md       # Complete API docs
├── ARCHITECTURE.md            # Architecture details
└── TROUBLESHOOTING.md         # Common issues
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Server
PORT=3000
NODE_ENV=development
```

### Drizzle Configuration

See `drizzle.config.ts`:

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

---

## 🐛 Troubleshooting

### TypeScript Errors After Schema Changes

If you see errors like "Property 'events' does not exist on type '{}'":

```bash
# Push schema to database
pnpm db:push
```

This resolves type inference issues. See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for details.

### Database Connection Issues

1. Verify `DATABASE_URL` in `.env`
2. Ensure PostgreSQL is running
3. Check network connectivity
4. Verify SSL settings for cloud databases

### Port Already in Use

```bash
# Change PORT in .env
PORT=3001
```

---

## 📊 Database Management

### Drizzle Studio

Visual database browser:

```bash
pnpm db:studio
```

Opens at `https://local.drizzle.studio`

### Migrations

```bash
# Generate migration from schema changes
pnpm db:generate

# Apply migrations
pnpm db:migrate

# For development, push directly
pnpm db:push
```

---

## 🔒 Security Notes

### Current Implementation
- ✅ Pre-hashed passwords (no plain text)
- ✅ Direct hash comparison
- ✅ CORS enabled for frontend
- ✅ Cascade deletes for data integrity

### Production Recommendations
- [ ] Add rate limiting (express-rate-limit)
- [ ] Implement JWT tokens
- [ ] Add input validation (Zod)
- [ ] Enable HTTPS only
- [ ] Add request logging (Winston/Pino)
- [ ] Set up monitoring (Sentry)
- [ ] Use bcrypt instead of SHA-256

---

## 📚 Documentation

- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - Complete API reference
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and design
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions

---

## 🚢 Deployment

### Docker

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

### Environment Setup

Ensure these environment variables are set:

```env
DATABASE_URL=postgresql://...
NODE_ENV=production
PORT=3000
```

---

## 🤝 Contributing

This is a monorepo project using Turborepo. To contribute:

1. Make changes in `apps/api/`
2. Run type checking: `pnpm check-types`
3. Test locally: `pnpm dev`
4. Build: `pnpm build`

---

## 📝 License

MIT

---

## 🙏 Acknowledgments

Built with:
- [Drizzle ORM](https://orm.drizzle.team/)
- [Express.js](https://expressjs.com/)
- [PostgreSQL](https://www.postgresql.org/)
- [Neon](https://neon.tech/)
- [Turborepo](https://turbo.build/)

---

Made with Bob 🤖
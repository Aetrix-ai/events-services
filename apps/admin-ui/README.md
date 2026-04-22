# Admin UI

Admin dashboard for the events service API.

## Flow

1. Login using admin credentials
2. View all events
3. Select an event to view its registrations

## API Integration

The app calls these API endpoints:

- `POST /api/auth/login`
- `GET /api/events`
- `GET /api/registrations/event/:eventId`

Passwords are SHA-256 hashed in the browser before login to match API requirements.

## Configuration

Set API base URL with Vite env variable:

```bash
VITE_API_BASE_URL=http://localhost:3000
```

If not provided, the app defaults to `http://localhost:3000`.

## Run

```bash
pnpm dev
```

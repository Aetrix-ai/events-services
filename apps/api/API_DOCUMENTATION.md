# Event Management API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication Flow

### Overview
The API uses a **hashed password** authentication system designed for external applications:

1. **External App** sends already-hashed passwords (SHA-256, bcrypt, etc.)
2. **Event Creation** automatically creates/updates admin credentials
3. **Admin Login** uses the same hashed password to authenticate
4. **View Events** admins can see all their events and registrations

### Important Notes
- All passwords must be **pre-hashed** by the external application
- The API stores and compares hashed passwords directly
- No plain-text passwords are ever transmitted or stored
- Credentials are automatically managed during event creation

---

## API Endpoints

### 1. Authentication Routes (`/api/auth`)

#### POST `/api/auth/login`
Admin login with hashed credentials.

**Request Body:**
```json
{
  "username": "admin_username",
  "hashedPassword": "sha256_or_bcrypt_hash_here"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin_username"
  },
  "message": "Login successful"
}
```

**Error Response (401):**
```json
{
  "success": false,
  "error": "Invalid credentials"
}
```

---

#### POST `/api/auth/my-events`
Get all events created by the authenticated admin with full registration details.

**Request Body:**
```json
{
  "username": "admin_username",
  "hashedPassword": "sha256_or_bcrypt_hash_here"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Tech Conference 2024",
      "date": "2024-06-15",
      "location": "Convention Center",
      "description": "Annual tech conference",
      "owner": "admin_username",
      "teamSize": 4,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z",
      "teams": [
        {
          "id": 1,
          "name": "Team Alpha",
          "eventId": 1,
          "createdAt": "2024-01-16T10:00:00Z",
          "members": [
            {
              "id": 1,
              "name": "John Doe",
              "email": "john@example.com",
              "phone": "1234567890",
              "teamId": 1,
              "eventId": 1,
              "createdAt": "2024-01-16T11:00:00Z"
            }
          ]
        }
      ],
      "registrations": [
        {
          "id": 1,
          "name": "John Doe",
          "email": "john@example.com",
          "phone": "1234567890",
          "teamId": 1,
          "eventId": 1,
          "createdAt": "2024-01-16T11:00:00Z"
        }
      ]
    }
  ],
  "count": 1,
  "message": "Found 1 events for admin_username"
}
```

---

### 2. Event Routes (`/api/events`)

#### POST `/api/events`
Create a new event. **Automatically creates or updates admin credentials.**

**Request Body:**
```json
{
  "name": "Tech Conference 2024",
  "date": "2024-06-15",
  "location": "Convention Center",
  "description": "Annual tech conference",
  "owner": "admin_username",
  "teamSize": 4,
  "hashedPassword": "sha256_or_bcrypt_hash_here"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Tech Conference 2024",
    "date": "2024-06-15",
    "location": "Convention Center",
    "description": "Annual tech conference",
    "owner": "admin_username",
    "teamSize": 4,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z"
  },
  "message": "Event created successfully. Credentials updated."
}
```

**Notes:**
- If `owner` credential doesn't exist, it will be created
- If `owner` credential exists, password will be updated
- This allows admins to manage their credentials through event creation

---

#### GET `/api/events`
Get all events (public endpoint).

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Tech Conference 2024",
      "date": "2024-06-15",
      "location": "Convention Center",
      "description": "Annual tech conference",
      "owner": "admin_username",
      "teamSize": 4,
      "createdAt": "2024-01-15T10:00:00Z",
      "updatedAt": "2024-01-15T10:00:00Z"
    }
  ],
  "count": 1
}
```

---

#### GET `/api/events/:id`
Get a specific event with all teams and registrations.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Tech Conference 2024",
    "date": "2024-06-15",
    "location": "Convention Center",
    "description": "Annual tech conference",
    "owner": "admin_username",
    "teamSize": 4,
    "createdAt": "2024-01-15T10:00:00Z",
    "updatedAt": "2024-01-15T10:00:00Z",
    "teams": [...],
    "registrations": [...]
  }
}
```

---

#### PUT `/api/events/:id`
Update an event.

**Request Body:**
```json
{
  "name": "Updated Event Name",
  "date": "2024-07-20",
  "location": "New Location",
  "description": "Updated description",
  "teamSize": 5
}
```

---

#### DELETE `/api/events/:id`
Delete an event (cascades to teams and registrations).

**Success Response (200):**
```json
{
  "success": true,
  "message": "Event deleted successfully"
}
```

---

#### GET `/api/events/:id/stats`
Get statistics for a specific event.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "eventId": 1,
    "eventName": "Tech Conference 2024",
    "totalRegistrations": 15,
    "totalTeams": 4,
    "teamsWithFullCapacity": 2,
    "availableSlots": 1,
    "teamSize": 4
  }
}
```

---

### 3. Registration Routes (`/api/registrations`)

#### POST `/api/registrations/new-team`
Register with a new team (public endpoint - no auth required).

**Request Body:**
```json
{
  "eventId": 1,
  "teamName": "Team Alpha",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "1234567890"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "registration": {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "1234567890",
      "teamId": 1,
      "eventId": 1,
      "createdAt": "2024-01-16T11:00:00Z"
    },
    "team": {
      "id": 1,
      "name": "Team Alpha",
      "eventId": 1,
      "createdAt": "2024-01-16T10:00:00Z"
    }
  },
  "message": "Registration successful with new team"
}
```

---

#### POST `/api/registrations/join-team`
Join an existing team (public endpoint - no auth required).

**Request Body:**
```json
{
  "teamId": 1,
  "name": "Jane Smith",
  "email": "jane@example.com",
  "phone": "0987654321"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "0987654321",
    "teamId": 1,
    "eventId": 1,
    "createdAt": "2024-01-16T12:00:00Z"
  },
  "message": "Successfully joined team"
}
```

**Error Response (400) - Team Full:**
```json
{
  "success": false,
  "error": "Team is already full"
}
```

---

#### GET `/api/registrations`
Get all registrations (public endpoint).

---

#### GET `/api/registrations/:id`
Get a specific registration.

---

#### PUT `/api/registrations/:id`
Update a registration.

---

#### DELETE `/api/registrations/:id`
Delete a registration.

---

### 4. Team Routes (`/api/teams`)

#### POST `/api/teams`
Create a new team.

**Request Body:**
```json
{
  "name": "Team Beta",
  "eventId": 1
}
```

---

#### GET `/api/teams`
Get all teams.

---

#### GET `/api/teams/:id`
Get a specific team with all members.

---

#### GET `/api/teams/:id/capacity`
Check if a team has available capacity.

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "teamId": 1,
    "teamName": "Team Alpha",
    "currentMembers": 3,
    "maxCapacity": 4,
    "availableSlots": 1,
    "isFull": false
  }
}
```

---

#### GET `/api/teams/event/:eventId/available`
Get all teams with available capacity for an event.

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Team Alpha",
      "eventId": 1,
      "createdAt": "2024-01-16T10:00:00Z",
      "members": [...],
      "availableSlots": 1
    }
  ],
  "count": 1
}
```

---

#### PUT `/api/teams/:id`
Update a team.

---

#### DELETE `/api/teams/:id`
Delete a team (only if no members).

---

## Example Workflows

### Workflow 1: External App Creates Event
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

### Workflow 2: Admin Logs In
```bash
# Admin logs in with same hashed password
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "techfest_admin",
    "hashedPassword": "'$HASHED_PW'"
  }'
```

### Workflow 3: Admin Views Their Events
```bash
# Get all events with registrations
curl -X POST http://localhost:3000/api/auth/my-events \
  -H "Content-Type: application/json" \
  -d '{
    "username": "techfest_admin",
    "hashedPassword": "'$HASHED_PW'"
  }'
```

### Workflow 4: Public User Registers
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

## Error Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error) |
| 401 | Unauthorized (invalid credentials) |
| 404 | Not Found |
| 409 | Conflict (duplicate entry) |
| 500 | Internal Server Error |

---

## Security Notes

1. **Password Hashing**: External apps must hash passwords before sending
2. **No Plain Text**: API never receives or stores plain-text passwords
3. **Credential Management**: Credentials auto-created/updated on event creation
4. **Public Endpoints**: Registrations don't require authentication
5. **Admin Endpoints**: Login and my-events require hashed password authentication

---

## Database Schema

### credentials
- `id`: Serial (Primary Key)
- `username`: Varchar(255) (Unique)
- `password`: Varchar(255) (Hashed)
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### events
- `id`: Serial (Primary Key)
- `name`: Varchar(255)
- `date`: Date
- `location`: Varchar(255)
- `description`: Text (Nullable)
- `owner`: Varchar(255) (References credentials.username)
- `teamSize`: Integer
- `createdAt`: Timestamp
- `updatedAt`: Timestamp

### teams
- `id`: Serial (Primary Key)
- `name`: Varchar(255)
- `eventId`: Integer (Foreign Key → events.id, CASCADE DELETE)
- `createdAt`: Timestamp

### registrations
- `id`: Serial (Primary Key)
- `name`: Varchar(255)
- `email`: Varchar(255)
- `phone`: Varchar(20)
- `teamId`: Integer (Foreign Key → teams.id, CASCADE DELETE)
- `eventId`: Integer (Foreign Key → events.id, CASCADE DELETE)
- `createdAt`: Timestamp

---

Made with Bob
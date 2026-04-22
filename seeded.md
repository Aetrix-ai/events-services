# Seeded Login Credentials

The API compares `hashedPassword` directly with stored values.
Send the exact `hashedPassword` value below in requests to `POST /api/auth/login` and `POST /api/auth/my-events` (do not hash again).

Example request body:
```json
{
  "username": "admin_alpha",
  "hashedPassword": "5e884898da28047151d0e56f8dc6292773603d0d6aabbddc2b8b4f0f7f9d0f6d"
}
```

## Account 1
- username: `admin_alpha`
- hashedPassword: `5e884898da28047151d0e56f8dc6292773603d0d6aabbddc2b8b4f0f7f9d0f6d`
- plaintext used to produce hash: `password`

## Account 2
- username: `admin_beta`
- hashedPassword: `ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f`
- plaintext used to produce hash: `password123`

## Run Seed
```bash
pnpm db:seed
```

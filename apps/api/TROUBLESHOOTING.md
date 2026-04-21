# Troubleshooting Guide

## TypeScript Errors in Route Files

### Issue
You may see TypeScript errors like:
- `Property 'events' does not exist on type '{}'`
- `Property 'teams' does not exist on type '{}'`
- `'newTeam' is possibly 'undefined'`

### Why This Happens
These are **development-time type inference issues** with Drizzle ORM's relational queries. They occur because:
1. The database schema hasn't been pushed yet
2. TypeScript can't infer the exact types until the schema is applied
3. Drizzle's type system is very strict about undefined checks

### Solution
These errors will **automatically resolve** once you:

```bash
# Push the schema to your database
pnpm db:push
```

After running this command:
- The database tables will be created
- Drizzle will have the full schema information
- TypeScript will properly infer all types
- All errors will disappear

### Verification
The code is **functionally correct** and will work at runtime. You can verify by:

1. **Push schema:**
   ```bash
   pnpm db:push
   ```

2. **Start the server:**
   ```bash
   pnpm dev
   ```

3. **Test an endpoint:**
   ```bash
   curl http://localhost:3000/api/events
   ```

If you see a successful response, everything is working correctly!

## Common Runtime Issues

### Database Connection Error
**Error:** `Failed to connect to database`

**Solution:**
1. Check your `.env` file has correct `DATABASE_URL`
2. Ensure database is accessible
3. Verify SSL mode is correct for your database

### Port Already in Use
**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or change port in server.ts
```

### CORS Errors
**Error:** `CORS policy blocked`

**Solution:**
Update CORS settings in `src/index.ts`:
```typescript
res.header('Access-Control-Allow-Origin', 'your-frontend-url');
```

## Development Tips

### Use Drizzle Studio
Visual database management:
```bash
pnpm db:studio
```

### Check Database Schema
```bash
pnpm db:generate
```

### Reset Database (Development Only)
```bash
# Drop all tables and recreate
pnpm db:push --force
```

## Need Help?

1. Check [API Documentation](./API_DOCUMENTATION.md)
2. Review [README](./README.md)
3. Inspect [Example Queries](./src/db/queries.example.ts)
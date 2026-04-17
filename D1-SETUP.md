# D1 Database Setup (Member-MCP)

## 1. Create the D1 database

```bash
npx wrangler d1 create member-mcp
```

This outputs a `database_id`. Copy it.

## 2. Update wrangler.toml

Replace the placeholder in `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "member-mcp"
database_id = "<paste-your-database-id-here>"
```

## 3. Apply the initial migration

```bash
npx wrangler d1 execute member-mcp --file=drizzle/migrations/0000_smart_vanisher.sql
```

For remote (production) database:

```bash
npx wrangler d1 execute member-mcp --remote --file=drizzle/migrations/0000_smart_vanisher.sql
```

## 4. Verify tables were created

```bash
npx wrangler d1 execute member-mcp --command="SELECT name FROM sqlite_master WHERE type='table'"
```

Expected output: `assessments`, `engagement_events`, `learning_paths`, `lesson_progress`, `members`.

## 5. Future migrations

After changing `src/lib/db/schema.ts`:

```bash
npx drizzle-kit generate
```

Then apply the new migration file with `wrangler d1 execute` as above.

## Schema overview

| Table | Purpose |
|---|---|
| `members` | User profiles (created on assessment or Stripe checkout) |
| `assessments` | Assessment results (one per completion, retakeable) |
| `learning_paths` | Assigned learning paths based on assessment |
| `lesson_progress` | Individual lesson completion tracking |
| `engagement_events` | Activity log for Q3 agent personalization |

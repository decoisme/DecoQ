# Fix: Dashboard QRIS Database Empty

## Problem
- Statistics show correctly in dashboard ✅
- `/admin` page shows QRIS data correctly ✅
- `/dashboard` page shows empty QRIS list ❌

## Root Cause
The issue is likely **RLS (Row Level Security) policies** on the `qris_database` table.

### Why `/admin` works but `/dashboard` doesn't:
1. **`/admin` page**: Uses admin key authentication (`x-admin-key` header)
2. **`/dashboard` page**: Uses Bearer token authentication (new auth system)
3. **API `/api/list`**: Uses `supabaseAdmin` client with service role key, which **bypasses RLS**
4. **Frontend client**: Uses regular Supabase client with publishable key, which **respects RLS**

The dashboard might be trying to read directly from the database (not through API), and RLS is blocking it.

## Solution

### Step 1: Check RLS Policies
Run this query in Supabase SQL Editor:

```sql
-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'qris_database';

-- Check existing policies
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE tablename = 'qris_database';
```

### Step 2: Fix RLS Policies
If no policies exist or they're blocking reads, run this script in Supabase SQL Editor:

**File: `FIX_QRIS_DATABASE_RLS.sql`** (already created in your project)

```sql
-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow authenticated users to read qris_database" ON qris_database;
DROP POLICY IF EXISTS "Allow service role full access to qris_database" ON qris_database;

-- Create policy: Allow authenticated users to read all QRIS data
CREATE POLICY "Allow authenticated users to read qris_database" 
ON qris_database
FOR SELECT
TO authenticated
USING (true);

-- Create policy: Allow service role full access (for API endpoints)
CREATE POLICY "Allow service role full access to qris_database"
ON qris_database
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
```

### Step 3: Verify the Fix
1. Run the SQL script above in Supabase SQL Editor
2. Restart your dev server: `npm run dev`
3. Login to dashboard: `http://localhost:3000/dashboard`
4. Click "QRIS Database" tab
5. Check browser console (F12) for debug logs

## Debug Logs to Check

### Browser Console (F12):
```
🔍 Fetching QRIS list...
📡 Response status: 200
📦 Response data: { data: [...], role: 'superadmin' }
✅ QRIS list loaded: X items
```

### Server Terminal:
```
📋 Fetching QRIS from qris_database...
✅ QRIS data fetched: X items
```

## If Still Not Working

### Check 1: Verify API is being called
Open browser DevTools → Network tab → Filter by "list" → Check if `/api/list` is being called

### Check 2: Verify Bearer token is sent
In Network tab, click on `/api/list` request → Headers → Check if `Authorization: Bearer <token>` exists

### Check 3: Verify data exists in database
Run in Supabase SQL Editor:
```sql
SELECT COUNT(*) FROM qris_database;
SELECT * FROM qris_database LIMIT 5;
```

### Check 4: Test API directly
```bash
# Get your session token from browser console:
# localStorage.getItem('supabase.auth.token')

curl http://localhost:3000/api/list \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Expected Result
After fixing RLS policies, the dashboard should show QRIS data just like the admin page does.

## Files Modified
- ✅ `pages/api/list.ts` - Already supports Bearer token
- ✅ `pages/api/dashboard-stats.ts` - Already supports Bearer token
- ✅ `pages/dashboard.tsx` - Already has debug logs
- 🆕 `FIX_QRIS_DATABASE_RLS.sql` - RLS policy fix

## Next Steps
1. Run `FIX_QRIS_DATABASE_RLS.sql` in Supabase SQL Editor
2. Restart dev server
3. Test dashboard
4. Share console output if still not working

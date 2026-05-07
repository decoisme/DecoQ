-- ============================================================
-- FIX: Disable auto-insert trigger for auth users
-- ============================================================

-- Check if trigger exists
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users' 
  OR trigger_name LIKE '%auth%'
  OR trigger_name LIKE '%user%';

-- Drop trigger if exists (common names)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user ON auth.users;
DROP TRIGGER IF EXISTS create_user_on_signup ON auth.users;

-- Drop function if exists
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_on_signup() CASCADE;

-- Verify triggers are gone
SELECT 
  trigger_name, 
  event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'auth';

-- ============================================================
-- ALTERNATIVE: Make trigger more robust
-- ============================================================

-- If you want to keep the trigger, update it to handle missing columns:
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert with only required columns
  INSERT INTO public.users (
    auth_user_id,
    email,
    role,
    is_active,
    full_name
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin'),
    false, -- Will be activated via invite flow
    NEW.raw_user_meta_data->>'full_name'
  )
  ON CONFLICT (auth_user_id) DO NOTHING; -- Skip if already exists
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail auth user creation
    RAISE WARNING 'Failed to create user record: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger (if needed)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- RECOMMENDED: Disable trigger completely
-- ============================================================

-- Just drop the trigger and let API handle user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Verify
SELECT 
  'Trigger removed successfully' as status,
  COUNT(*) as remaining_triggers
FROM information_schema.triggers
WHERE event_object_schema = 'auth';

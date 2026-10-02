-- ==============================================================================
-- Vishakahu Academy & Admin Portal - Supabase Row-Level Security (RLS) Hardening
-- ==============================================================================
-- Purpose:
-- 1. Lock down student PII so anonymous public users cannot SELECT or DELETE registrations.
-- 2. Restrict gallery and category modifications strictly to authenticated staff and backend API.
-- 3. Preserve public SELECT visibility for gallery photos and categories on the main site.
--
-- How to apply:
-- 1. Open your Supabase Project Dashboard: https://supabase.com/dashboard/project/vxqneiuxtzxrmlehrxgj
-- 2. Navigate to "SQL Editor" in the left sidebar.
-- 3. Paste and run this script.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. TABLE: student_registrations
-- ------------------------------------------------------------------------------
-- Enable Row Level Security
ALTER TABLE IF EXISTS public.student_registrations ENABLE ROW LEVEL SECURITY;

-- Drop any legacy or overly permissive public policies
DROP POLICY IF EXISTS "Public can view registrations" ON public.student_registrations;
DROP POLICY IF EXISTS "Public can delete registrations" ON public.student_registrations;
DROP POLICY IF EXISTS "Public can update registrations" ON public.student_registrations;
DROP POLICY IF EXISTS "Allow public insert only" ON public.student_registrations;
DROP POLICY IF EXISTS "Allow authenticated staff full access" ON public.student_registrations;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.student_registrations;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.student_registrations;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.student_registrations;

-- Policy A: Allow anonymous users (and public API) to INSERT registrations only
CREATE POLICY "Allow public insert only"
  ON public.student_registrations
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy B: Allow authenticated staff full access (SELECT, UPDATE, DELETE)
-- (Note: Backend routes using SUPABASE_SERVICE_ROLE_KEY bypass RLS automatically)
CREATE POLICY "Allow authenticated staff full access"
  ON public.student_registrations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 2. TABLE: gallery_images
-- ------------------------------------------------------------------------------
-- Enable Row Level Security
ALTER TABLE IF EXISTS public.gallery_images ENABLE ROW LEVEL SECURITY;

-- Drop legacy policies
DROP POLICY IF EXISTS "Allow public read-only access to gallery" ON public.gallery_images;
DROP POLICY IF EXISTS "Allow authenticated staff to manage gallery" ON public.gallery_images;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.gallery_images;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.gallery_images;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.gallery_images;
DROP POLICY IF EXISTS "Enable update for all users" ON public.gallery_images;

-- Policy A: Public visitors can view gallery images (SELECT)
CREATE POLICY "Allow public read-only access to gallery"
  ON public.gallery_images
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy B: Only authenticated staff can modify images (INSERT, UPDATE, DELETE)
CREATE POLICY "Allow authenticated staff to manage gallery"
  ON public.gallery_images
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 3. TABLE: gallery_categories
-- ------------------------------------------------------------------------------
-- Enable Row Level Security
ALTER TABLE IF EXISTS public.gallery_categories ENABLE ROW LEVEL SECURITY;

-- Drop legacy policies
DROP POLICY IF EXISTS "Allow public read-only access to categories" ON public.gallery_categories;
DROP POLICY IF EXISTS "Allow authenticated staff to manage categories" ON public.gallery_categories;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.gallery_categories;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.gallery_categories;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.gallery_categories;
DROP POLICY IF EXISTS "Enable update for all users" ON public.gallery_categories;

-- Policy A: Public visitors can view categories (SELECT)
CREATE POLICY "Allow public read-only access to categories"
  ON public.gallery_categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy B: Only authenticated staff can modify categories (INSERT, UPDATE, DELETE)
CREATE POLICY "Allow authenticated staff to manage categories"
  ON public.gallery_categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ==============================================================================
-- Verification Check:
-- Run the following query in Supabase to confirm RLS is active:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
-- ==============================================================================

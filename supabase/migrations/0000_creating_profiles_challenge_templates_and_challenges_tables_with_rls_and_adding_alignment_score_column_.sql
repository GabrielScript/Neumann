-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  PRIMARY KEY (id)
);

-- Enable RLS for profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles 
FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
CREATE POLICY "profiles_insert_policy" ON public.profiles 
FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles 
FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
CREATE POLICY "profiles_delete_policy" ON public.profiles 
FOR DELETE TO authenticated USING (auth.uid() = id);

-- Create challenge_templates table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.challenge_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL,
  is_default BOOLEAN DEFAULT FALSE NOT NULL,
  is_public BOOLEAN DEFAULT FALSE NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS for challenge_templates table
ALTER TABLE public.challenge_templates ENABLE ROW LEVEL SECURITY;

-- Create policies for challenge_templates table
DROP POLICY IF EXISTS "Public templates are viewable by all" ON public.challenge_templates;
CREATE POLICY "Public templates are viewable by all" ON public.challenge_templates
FOR SELECT USING (is_public = TRUE OR is_default = TRUE OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create their own templates" ON public.challenge_templates;
CREATE POLICY "Users can create their own templates" ON public.challenge_templates
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own templates" ON public.challenge_templates;
CREATE POLICY "Users can update their own templates" ON public.challenge_templates
FOR UPDATE TO authenticated
USING (auth.uid() = created_by)
WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete their own templates" ON public.challenge_templates;
CREATE POLICY "Users can delete their own templates" ON public.challenge_templates
FOR DELETE TO authenticated
USING (auth.uid() = created_by);

-- Create challenges table if it doesn't exist, based on the application's type definitions
CREATE TABLE IF NOT EXISTS public.challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  template_id UUID REFERENCES public.challenge_templates(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  completed_days INTEGER DEFAULT 0 NOT NULL,
  completed_at TIMESTAMPTZ,
  difficulty INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add the new column for alignment score, only if it doesn't already exist
ALTER TABLE public.challenges
ADD COLUMN IF NOT EXISTS alignment_score INTEGER;

-- Enable Row Level Security (RLS) - CRITICAL for data protection
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Create policies to ensure users can only access and manage their own challenges
DROP POLICY IF EXISTS "Users can manage their own challenges" ON public.challenges;
CREATE POLICY "Users can manage their own challenges" ON public.challenges
FOR ALL TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
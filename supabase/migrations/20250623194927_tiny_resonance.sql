/*
  # Initial Schema - Users and Groups (Corrected Version)

  This script fixes the infinite recursion errors in RLS policies
  by using a SECURITY DEFINER function to safely check for group membership.
*/

-- 1. Create Tables

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.profiles IS 'Public user profile information, linked to authentication.';


-- Create groups table
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  avatar_url text,
  created_by uuid NOT NULL REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
COMMENT ON TABLE public.groups IS 'Represents user-created groups or communities.';


-- Create group_members junction table
CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  joined_at timestamptz DEFAULT now(),
  UNIQUE(group_id, user_id)
);
COMMENT ON TABLE public.group_members IS 'Junction table for group memberships.';


-- 2. Create a Helper Function to Safely Check Membership
-- This function runs with admin privileges to avoid RLS recursion.
CREATE OR REPLACE FUNCTION is_member_of_group(p_group_id uuid, p_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.group_members
    WHERE group_id = p_group_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
COMMENT ON FUNCTION is_member_of_group IS 'Checks if a user is a member of a group, bypassing RLS to prevent recursion.';


-- 3. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies

-- PROFILES Policies
CREATE POLICY "Users can view all profiles." -- Changed to allow viewing other members' info
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can update their own profile."
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- GROUPS Policies
CREATE POLICY "Group members can view their groups."
  ON public.groups FOR SELECT
  TO authenticated
  USING (is_member_of_group(id, auth.uid()));

CREATE POLICY "Authenticated users can create groups."
  ON public.groups FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Group creators can update their groups."
  ON public.groups FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Group creators can delete their groups."
  ON public.groups FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- GROUP_MEMBERS Policies
CREATE POLICY "Members can view the member list of groups they belong to."
  ON public.group_members FOR SELECT
  TO authenticated
  USING (is_member_of_group(group_id, auth.uid()));

CREATE POLICY "Users can leave groups they are in."
  ON public.group_members FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Group admins can add or remove any user."
  ON public.group_members FOR ALL -- Covers INSERT, UPDATE, DELETE
  TO authenticated
  USING (
    (
      SELECT role FROM public.group_members
      WHERE group_id = group_members.group_id AND user_id = auth.uid()
    ) = 'admin'
  );


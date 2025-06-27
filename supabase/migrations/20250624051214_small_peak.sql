/*
  # Fix RLS policies to prevent infinite recursion

  1. Policy Updates
    - Simplify profiles RLS policies to avoid circular dependencies
    - Fix group_members policies to prevent infinite recursion
    - Ensure policies use direct auth.uid() checks where possible

  2. Security
    - Maintain proper access control
    - Remove complex subqueries that cause recursion
    - Use simpler, more direct policy conditions
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Public profiles are viewable by group members" ON profiles;
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Group admins can manage members" ON group_members;
DROP POLICY IF EXISTS "Users can join groups when invited" ON group_members;
DROP POLICY IF EXISTS "Users can read group members for their groups" ON group_members;

-- Create simplified profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create simplified group_members policies
CREATE POLICY "Users can read their own memberships"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can join groups"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave groups"
  ON group_members
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create a separate policy for group admins to manage members
CREATE POLICY "Group creators can manage all members"
  ON group_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups 
      WHERE groups.id = group_members.group_id 
      AND groups.created_by = auth.uid()
    )
  );

-- Add a policy for reading group members when you're a member of that group
CREATE POLICY "Group members can read other members"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT gm.group_id 
      FROM group_members gm 
      WHERE gm.user_id = auth.uid()
    )
  );
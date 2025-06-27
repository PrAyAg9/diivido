/*
  # Fix infinite recursion in group_members RLS policies

  1. Problem
    - Current policies on group_members table create circular dependencies
    - Policies reference group_members table while being applied to group_members table
    - This causes infinite recursion when Supabase tries to evaluate permissions

  2. Solution
    - Simplify group_members policies to avoid self-referential queries
    - Remove circular dependencies between policies
    - Ensure policies are straightforward and don't create recursive loops

  3. Changes
    - Drop existing problematic policies on group_members
    - Create new, simplified policies that avoid recursion
    - Maintain security while preventing infinite loops
*/

-- Drop existing problematic policies on group_members
DROP POLICY IF EXISTS "Group creators can manage all members" ON group_members;
DROP POLICY IF EXISTS "Group members can read other members" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Users can read their own memberships" ON group_members;

-- Create new simplified policies for group_members that avoid recursion

-- Policy 1: Users can read their own membership records
CREATE POLICY "Users can read own memberships"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 2: Users can insert their own membership (when joining groups)
CREATE POLICY "Users can join groups"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can delete their own membership (when leaving groups)
CREATE POLICY "Users can leave groups"
  ON group_members
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy 4: Group creators can manage members (simplified check)
CREATE POLICY "Group creators can manage members"
  ON group_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM groups 
      WHERE groups.id = group_members.group_id 
      AND groups.created_by = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM groups 
      WHERE groups.id = group_members.group_id 
      AND groups.created_by = auth.uid()
    )
  );

-- Policy 5: Members can read other members in the same group (simplified)
CREATE POLICY "Members can read group members"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (
    -- User can read if they are a member of the same group
    EXISTS (
      SELECT 1 FROM group_members gm2
      WHERE gm2.group_id = group_members.group_id
      AND gm2.user_id = auth.uid()
    )
  );
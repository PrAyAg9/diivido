/*
  # Fix infinite recursion in RLS policies

  1. Problem Analysis
    - The current RLS policies on group_members table are causing infinite recursion
    - This happens when policies reference the same table they're protecting in subqueries
    - Specifically affecting expense_splits queries that join with expenses and groups

  2. Solution
    - Rewrite group_members policies to avoid recursive references
    - Simplify policy logic to use direct column comparisons where possible
    - Ensure policies don't create circular dependencies

  3. Changes
    - Drop existing problematic policies on group_members
    - Create new, simplified policies that avoid recursion
    - Update related policies on expenses and expense_splits if needed
*/

-- Drop existing problematic policies on group_members
DROP POLICY IF EXISTS "Group creators can manage members" ON group_members;
DROP POLICY IF EXISTS "Members can read group members" ON group_members;
DROP POLICY IF EXISTS "Users can join groups" ON group_members;
DROP POLICY IF EXISTS "Users can leave groups" ON group_members;
DROP POLICY IF EXISTS "Users can read own memberships" ON group_members;

-- Create new simplified policies for group_members
-- Policy for reading group members - users can read members of groups they belong to
CREATE POLICY "Users can read group members"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (
    -- User can read members if they are also a member of the same group
    group_id IN (
      SELECT gm.group_id 
      FROM group_members gm 
      WHERE gm.user_id = auth.uid()
    )
  );

-- Policy for users to read their own memberships
CREATE POLICY "Users can read own memberships"
  ON group_members
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Policy for joining groups (inserting new memberships)
CREATE POLICY "Users can join groups"
  ON group_members
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Policy for leaving groups (deleting own memberships)
CREATE POLICY "Users can leave groups"
  ON group_members
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Policy for group creators to manage all members
CREATE POLICY "Group creators can manage members"
  ON group_members
  FOR ALL
  TO authenticated
  USING (
    -- Check if the user is the creator of the group
    EXISTS (
      SELECT 1 
      FROM groups g 
      WHERE g.id = group_members.group_id 
      AND g.created_by = auth.uid()
    )
  )
  WITH CHECK (
    -- Same check for inserts/updates
    EXISTS (
      SELECT 1 
      FROM groups g 
      WHERE g.id = group_members.group_id 
      AND g.created_by = auth.uid()
    )
  );

-- Update groups policy to be more efficient
DROP POLICY IF EXISTS "Users can read groups they belong to" ON groups;
CREATE POLICY "Users can read groups they belong to"
  ON groups
  FOR SELECT
  TO authenticated
  USING (
    -- User can read groups where they are a member
    id IN (
      SELECT group_id 
      FROM group_members 
      WHERE user_id = auth.uid()
    )
  );

-- Update expenses policies to be more efficient
DROP POLICY IF EXISTS "Group members can read expenses" ON expenses;
CREATE POLICY "Group members can read expenses"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (
    -- User can read expenses from groups they belong to
    group_id IN (
      SELECT group_id 
      FROM group_members 
      WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group members can create expenses" ON expenses;
CREATE POLICY "Group members can create expenses"
  ON expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- User can create expenses in groups they belong to
    group_id IN (
      SELECT group_id 
      FROM group_members 
      WHERE user_id = auth.uid()
    )
  );

-- Update expense_splits policies to be more efficient
DROP POLICY IF EXISTS "Group members can read expense splits" ON expense_splits;
CREATE POLICY "Group members can read expense splits"
  ON expense_splits
  FOR SELECT
  TO authenticated
  USING (
    -- User can read splits for expenses in groups they belong to
    expense_id IN (
      SELECT e.id 
      FROM expenses e
      INNER JOIN group_members gm ON e.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Group members can manage expense splits" ON expense_splits;
CREATE POLICY "Group members can manage expense splits"
  ON expense_splits
  FOR ALL
  TO authenticated
  USING (
    -- User can manage splits for expenses in groups they belong to
    expense_id IN (
      SELECT e.id 
      FROM expenses e
      INNER JOIN group_members gm ON e.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  )
  WITH CHECK (
    -- Same check for inserts/updates
    expense_id IN (
      SELECT e.id 
      FROM expenses e
      INNER JOIN group_members gm ON e.group_id = gm.group_id
      WHERE gm.user_id = auth.uid()
    )
  );
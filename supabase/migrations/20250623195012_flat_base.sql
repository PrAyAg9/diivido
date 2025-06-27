/*
  # Row Level Security Policies

  This migration ensures all tables have proper RLS enabled and policies configured.
  Note: Individual table policies are already defined in their respective migration files.
  This file serves as a verification and any additional security measures.

  1. Security Verification
    - Verify RLS is enabled on all tables
    - Add any missing security policies
    - Create helper functions for common security checks

  2. Helper Functions
    - Function to check if user is group member
    - Function to check if user is group admin
*/

-- Helper function to check if user is a member of a group
CREATE OR REPLACE FUNCTION is_group_member(group_uuid uuid, user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_id = group_uuid AND user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is a group admin
CREATE OR REPLACE FUNCTION is_group_admin(group_uuid uuid, user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members 
    WHERE group_id = group_uuid AND user_id = user_uuid AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure RLS is enabled on all tables (verification)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_challenges ENABLE ROW LEVEL SECURITY;

-- Additional security policy for public profile reading (optional)
CREATE POLICY "Public profiles are viewable by group members"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT DISTINCT user_id FROM group_members 
      WHERE group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()
      )
    )
  );
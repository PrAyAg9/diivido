/*
  # Social and Gamification Schema

  1. New Tables
    - `activity_feed`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `group_id` (uuid, references groups, optional)
      - `activity_type` (text)
      - `title` (text)
      - `description` (text, optional)
      - `metadata` (jsonb, optional)
      - `created_at` (timestamp)
    
    - `group_chat_messages`
      - `id` (uuid, primary key)
      - `group_id` (uuid, references groups)
      - `user_id` (uuid, references profiles)
      - `message` (text)
      - `message_type` (text, default 'text')
      - `metadata` (jsonb, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `game_challenges`
      - `id` (uuid, primary key)
      - `group_id` (uuid, references groups)
      - `created_by` (uuid, references profiles)
      - `title` (text)
      - `description` (text)
      - `challenge_type` (text)
      - `target_amount` (decimal, optional)
      - `target_date` (date, optional)
      - `reward` (text, optional)
      - `status` (text, default 'active')
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for group members and activity visibility
*/

-- Create activity_feed table
CREATE TABLE IF NOT EXISTS activity_feed (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  activity_type text NOT NULL,
  title text NOT NULL,
  description text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create group_chat_messages table
CREATE TABLE IF NOT EXISTS group_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  message text NOT NULL,
  message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'expense', 'payment')),
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create game_challenges table
CREATE TABLE IF NOT EXISTS game_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  challenge_type text NOT NULL,
  target_amount decimal(10,2),
  target_date date,
  reward text,
  status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_challenges ENABLE ROW LEVEL SECURITY;

-- Activity feed policies
CREATE POLICY "Users can read their own activity"
  ON activity_feed
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Group members can read group activity"
  ON activity_feed
  FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create activity entries"
  ON activity_feed
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Group chat messages policies
CREATE POLICY "Group members can read messages"
  ON group_chat_messages
  FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can send messages"
  ON group_chat_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Message authors can update their messages"
  ON group_chat_messages
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Message authors can delete their messages"
  ON group_chat_messages
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Game challenges policies
CREATE POLICY "Group members can read challenges"
  ON game_challenges
  FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create challenges"
  ON game_challenges
  FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Challenge creators can update their challenges"
  ON game_challenges
  FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Challenge creators can delete their challenges"
  ON game_challenges
  FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());
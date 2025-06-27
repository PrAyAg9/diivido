/*
  # Expenses and Payments Schema

  1. New Tables
    - `expenses`
      - `id` (uuid, primary key)
      - `group_id` (uuid, references groups)
      - `title` (text)
      - `description` (text, optional)
      - `amount` (decimal)
      - `currency` (text, default 'USD')
      - `category` (text)
      - `paid_by` (uuid, references profiles)
      - `split_type` (enum: equal, exact, percentage, shares)
      - `receipt_url` (text, optional)
      - `date` (date)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `expense_splits`
      - `id` (uuid, primary key)
      - `expense_id` (uuid, references expenses)
      - `user_id` (uuid, references profiles)
      - `amount` (decimal)
      - `percentage` (decimal, optional)
      - `shares` (integer, optional)
      - `paid` (boolean, default false)
    
    - `payments`
      - `id` (uuid, primary key)
      - `from_user` (uuid, references profiles)
      - `to_user` (uuid, references profiles)
      - `group_id` (uuid, references groups)
      - `amount` (decimal)
      - `currency` (text, default 'USD')
      - `status` (enum: pending, completed, failed)
      - `payment_method` (text, optional)
      - `notes` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for group members
*/

-- Create custom ENUM types
DO $$ BEGIN
  CREATE TYPE split_type AS ENUM ('equal', 'exact', 'percentage', 'shares');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  description text,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'USD',
  category text NOT NULL,
  paid_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  split_type split_type DEFAULT 'equal',
  receipt_url text,
  date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create expense_splits table
CREATE TABLE IF NOT EXISTS expense_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id uuid REFERENCES expenses(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount decimal(10,2) NOT NULL CHECK (amount >= 0),
  percentage decimal(5,2) CHECK (percentage >= 0 AND percentage <= 100),
  shares integer CHECK (shares > 0),
  paid boolean DEFAULT false,
  UNIQUE(expense_id, user_id)
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  to_user uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL CHECK (amount > 0),
  currency text DEFAULT 'USD',
  status payment_status DEFAULT 'pending',
  payment_method text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CHECK (from_user != to_user)
);

-- Enable RLS
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Expenses policies
CREATE POLICY "Group members can read expenses"
  ON expenses
  FOR SELECT
  TO authenticated
  USING (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can create expenses"
  ON expenses
  FOR INSERT
  TO authenticated
  WITH CHECK (
    group_id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Expense creators can update their expenses"
  ON expenses
  FOR UPDATE
  TO authenticated
  USING (paid_by = auth.uid());

CREATE POLICY "Expense creators can delete their expenses"
  ON expenses
  FOR DELETE
  TO authenticated
  USING (paid_by = auth.uid());

-- Expense splits policies
CREATE POLICY "Group members can read expense splits"
  ON expense_splits
  FOR SELECT
  TO authenticated
  USING (
    expense_id IN (
      SELECT id FROM expenses 
      WHERE group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Group members can manage expense splits"
  ON expense_splits
  FOR ALL
  TO authenticated
  USING (
    expense_id IN (
      SELECT id FROM expenses 
      WHERE group_id IN (
        SELECT group_id FROM group_members WHERE user_id = auth.uid()
      )
    )
  );

-- Payments policies
CREATE POLICY "Users can read their payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (from_user = auth.uid() OR to_user = auth.uid());

CREATE POLICY "Users can create payments"
  ON payments
  FOR INSERT
  TO authenticated
  WITH CHECK (from_user = auth.uid());

CREATE POLICY "Payment creators can update their payments"
  ON payments
  FOR UPDATE
  TO authenticated
  USING (from_user = auth.uid());
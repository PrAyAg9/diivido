export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          description: string | null
          avatar_url: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          avatar_url?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          avatar_url?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
        }
      }
      group_members: {
        Row: {
          id: string
          group_id: string
          user_id: string
          role: string
          joined_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          role?: string
          joined_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          role?: string
          joined_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          group_id: string
          title: string
          description: string | null
          amount: number
          currency: string
          category: string
          paid_by: string
          split_type: 'equal' | 'exact' | 'percentage' | 'shares'
          receipt_url: string | null
          date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          title: string
          description?: string | null
          amount: number
          currency?: string
          category: string
          paid_by: string
          split_type?: 'equal' | 'exact' | 'percentage' | 'shares'
          receipt_url?: string | null
          date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          title?: string
          description?: string | null
          amount?: number
          currency?: string
          category?: string
          paid_by?: string
          split_type?: 'equal' | 'exact' | 'percentage' | 'shares'
          receipt_url?: string | null
          date?: string
          created_at?: string
          updated_at?: string
        }
      }
      expense_splits: {
        Row: {
          id: string
          expense_id: string
          user_id: string
          amount: number
          percentage: number | null
          shares: number | null
          paid: boolean
        }
        Insert: {
          id?: string
          expense_id: string
          user_id: string
          amount: number
          percentage?: number | null
          shares?: number | null
          paid?: boolean
        }
        Update: {
          id?: string
          expense_id?: string
          user_id?: string
          amount?: number
          percentage?: number | null
          shares?: number | null
          paid?: boolean
        }
      }
      payments: {
        Row: {
          id: string
          from_user: string
          to_user: string
          group_id: string | null
          amount: number
          currency: string
          status: 'pending' | 'completed' | 'failed'
          payment_method: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          from_user: string
          to_user: string
          group_id?: string | null
          amount: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed'
          payment_method?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          from_user?: string
          to_user?: string
          group_id?: string | null
          amount?: number
          currency?: string
          status?: 'pending' | 'completed' | 'failed'
          payment_method?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      activity_feed: {
        Row: {
          id: string
          user_id: string
          group_id: string | null
          activity_type: string
          title: string
          description: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          group_id?: string | null
          activity_type: string
          title: string
          description?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          group_id?: string | null
          activity_type?: string
          title?: string
          description?: string | null
          metadata?: Json | null
          created_at?: string
        }
      }
      group_chat_messages: {
        Row: {
          id: string
          group_id: string
          user_id: string
          message: string
          message_type: string
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          user_id: string
          message: string
          message_type?: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          user_id?: string
          message?: string
          message_type?: string
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      game_challenges: {
        Row: {
          id: string
          group_id: string
          created_by: string
          title: string
          description: string | null
          challenge_type: string
          target_amount: number | null
          target_date: string | null
          reward: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          created_by: string
          title: string
          description?: string | null
          challenge_type: string
          target_amount?: number | null
          target_date?: string | null
          reward?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          created_by?: string
          title?: string
          description?: string | null
          challenge_type?: string
          target_amount?: number | null
          target_date?: string | null
          reward?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_group_member: {
        Args: {
          group_uuid: string
          user_uuid: string
        }
        Returns: boolean
      }
      is_group_admin: {
        Args: {
          group_uuid: string
          user_uuid: string
        }
        Returns: boolean
      }
    }
    Enums: {
      split_type: 'equal' | 'exact' | 'percentage' | 'shares'
      payment_status: 'pending' | 'completed' | 'failed'
    }
  }
}
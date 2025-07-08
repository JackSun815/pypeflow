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
          role: 'sdr' | 'manager'
          full_name: string | null
          email: string | null
          created_at: string
          updated_at: string
          active: boolean
        }
        Insert: {
          id: string
          role: 'sdr' | 'manager'
          full_name?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
          active?: boolean
        }
        Update: {
          id?: string
          role?: 'sdr' | 'manager' | null
          full_name?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
          active?: boolean
        }
      }
      clients: {
        Row: {
          id: string
          name: string
          monthly_target: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          monthly_target?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          monthly_target?: number
          created_at?: string
          updated_at?: string
        }
      }
      assignments: {
        Row: {
          id: string
          sdr_id: string
          client_id: string
          monthly_target: number
          month: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sdr_id: string
          client_id: string
          monthly_target: number
          month: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sdr_id?: string
          client_id?: string
          monthly_target?: number
          month?: string
          created_at?: string
          updated_at?: string
        }
      }
      meetings: {
        Row: {
          id: string
          sdr_id: string
          client_id: string
          scheduled_date: string
          booked_at: string
          status: 'pending' | 'confirmed'
          confirmed_at: string | null
          contact_full_name: string | null
          contact_email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sdr_id: string
          client_id: string
          scheduled_date: string
          booked_at?: string
          status?: 'pending' | 'confirmed'
          confirmed_at?: string | null
          contact_full_name?: string | null
          contact_email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sdr_id?: string
          client_id?: string
          scheduled_date?: string
          booked_at?: string
          status?: 'pending' | 'confirmed'
          confirmed_at?: string | null
          contact_full_name?: string | null
          contact_email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_user_manager: {
        Args: { user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      user_role: 'sdr' | 'manager'
      meeting_status: 'pending' | 'confirmed'
    }
  }
}
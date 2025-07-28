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
          super_admin: boolean
        }
        Insert: {
          id: string
          role?: 'sdr' | 'manager'
          full_name?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
          active?: boolean
          super_admin?: boolean
        }
        Update: {
          id?: string
          role?: 'sdr' | 'manager' | null
          full_name?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
          active?: boolean
          super_admin?: boolean
        }
      }
      clients: {
        Row: {
          id: string
          name: string
          monthly_target: number
          monthly_set_target: number
          monthly_hold_target: number
          cumulative_set_target: number
          cumulative_hold_target: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          monthly_target?: number
          monthly_set_target?: number
          monthly_hold_target?: number
          cumulative_set_target?: number
          cumulative_hold_target?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          monthly_target?: number
          monthly_set_target?: number
          monthly_hold_target?: number
          cumulative_set_target?: number
          cumulative_hold_target?: number
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
          monthly_set_target: number
          monthly_hold_target: number
          month: string
          created_at: string
          updated_at: string
          cumulative_set_target: number
          cumulative_hold_target: number
        }
        Insert: {
          id?: string
          sdr_id: string
          client_id: string
          monthly_target?: number
          monthly_set_target?: number
          monthly_hold_target?: number
          month: string
          created_at?: string
          updated_at?: string
          cumulative_set_target?: number
          cumulative_hold_target?: number
        }
        Update: {
          id?: string
          sdr_id?: string
          client_id?: string
          monthly_target?: number
          monthly_set_target?: number
          monthly_hold_target?: number
          month?: string
          created_at?: string
          updated_at?: string
          cumulative_set_target?: number
          cumulative_hold_target?: number
        }
      }
      meetings: {
        Row: {
          id: string
          sdr_id: string
          client_id: string
          booked_at: string
          status: 'pending' | 'confirmed'
          created_at: string
          updated_at: string
          contact_full_name: string | null
          contact_email: string | null
          no_show: boolean
          held_date: string | null
          confirmed_date: string | null
          confirmed_at: string | null
          held_at: string | null
          contact_phone: string | null
          scheduled_date: string
          company: string | null
          linkedin_page: string | null
          title: string | null
          notes: string | null
          timezone: string | null
        }
        Insert: {
          id?: string
          sdr_id: string
          client_id: string
          booked_at?: string
          status?: 'pending' | 'confirmed'
          created_at?: string
          updated_at?: string
          contact_full_name?: string | null
          contact_email?: string | null
          no_show?: boolean
          held_date?: string | null
          confirmed_date?: string | null
          confirmed_at?: string | null
          held_at?: string | null
          contact_phone?: string | null
          scheduled_date: string
          company?: string | null
          linkedin_page?: string | null
          title?: string | null
          notes?: string | null
          timezone?: string | null
        }
        Update: {
          id?: string
          sdr_id?: string
          client_id?: string
          booked_at?: string
          status?: 'pending' | 'confirmed'
          created_at?: string
          updated_at?: string
          contact_full_name?: string | null
          contact_email?: string | null
          no_show?: boolean
          held_date?: string | null
          confirmed_date?: string | null
          confirmed_at?: string | null
          held_at?: string | null
          contact_phone?: string | null
          scheduled_date?: string
          company?: string | null
          linkedin_page?: string | null
          title?: string | null
          notes?: string | null
          timezone?: string | null
        }
      }
      compensation_structures: {
        Row: {
          id: string
          sdr_id: string
          commission_type: string
          meeting_rates: Json
          goal_tiers: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sdr_id: string
          commission_type?: string
          meeting_rates?: Json
          goal_tiers?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sdr_id?: string
          commission_type?: string
          meeting_rates?: Json
          goal_tiers?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'sdr' | 'manager'
      meeting_status: 'pending' | 'confirmed'
      commission_type: string
    }
  }
}

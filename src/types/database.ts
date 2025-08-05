export type UserRole = 'sdr' | 'manager';
export type MeetingStatus = 'pending' | 'confirmed';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  monthly_set_target: number;
  monthly_hold_target: number;
  created_at: string;
  updated_at: string;
}

export interface Assignment {
  id: string;
  sdr_id: string;
  client_id: string;
  monthly_target: number;
  monthly_set_target: number;
  monthly_hold_target: number;
  month: string;
  created_at: string;
  updated_at: string;
}

export interface Meeting {
  id: string;
  sdr_id: string;
  client_id: string;
  scheduled_date: string; // Now stores full ISO string with time
  booked_at: string;
  status: MeetingStatus;
  confirmed_at: string | null;
  held_at: string | null;
  no_show: boolean;
  contact_full_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  company: string | null;
  title: string | null;
  linkedin_page: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  timezone?: string; // IANA timezone string for meeting (e.g., 'America/New_York')
}

export interface CommissionGoalOverride {
  id: string;
  sdr_id: string;
  commission_goal: number;
  created_at: string;
  updated_at: string;
}
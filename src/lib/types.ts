export type Role = 'ADMIN' | 'PARTICIPANT';

export type PaymentStatus = 'PENDING' | 'PAID';

export type ParticipantStatus = 'REGISTERED' | 'CHECKED_IN' | 'DISQUALIFIED' | 'CANCELLED';

export type RegistrationSource = 'Website' | 'Excel Import' | 'Manual Entry' | 'Google Form';

export type SubmissionStatus = 'NOT_STARTED' | 'DRAFT' | 'SUBMITTED' | 'LOCKED';

export type EventState = 'PRE_EVENT' | 'LIVE' | 'SUBMISSION_CLOSED' | 'JUDGING' | 'RESULTS';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: Role;
  full_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Participant {
  id: string;
  participant_id: string;
  user_id?: string | null;
  full_name: string;
  email: string;
  phone: string;
  college: string;
  course: string;
  year?: string;
  state: string;
  district: string;
  payment_status: PaymentStatus;
  payment_reference?: string | null;
  registration_source: RegistrationSource;
  registration_date: string;
  status: ParticipantStatus;
  custom_fields: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  participant_id: string;
  project_name: string;
  project_description: string;
  problem_solved?: string;
  key_features: string;
  live_website_url?: string;
  github_url: string;
  demo_video_url?: string;
  technologies_used: string;
  ai_tools_used?: string;
  ai_usage_description?: string;
  screenshot_url?: string;
  status: SubmissionStatus;
  submitted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface IdeaInspiration {
  id: string;
  title: string;
  slug: string;
  short_problem?: string;
  description: string;
  possible_directions: string[];
  display_order: number;
  is_active: boolean | number;
  created_at: string;
  updated_at: string;
}

export interface EventConfig {
  id: string;
  event_name: string;
  event_date: string;
  start_time: string;
  end_time: string;
  duration_minutes: number;
  state: EventState;
  venue: string;
  fee: number;
  prize_pool: number;
  challenge_brief?: string;
  results_info?: string;
  updated_at: string;
}

export interface EventAuditLog {
  id: string;
  action: string;
  details: string;
  actor: string;
  timestamp: string;
}

export interface ImportHistoryItem {
  id: string;
  file_name: string;
  imported_by: string;
  date: string;
  rows_processed: number;
  rows_added: number;
  rows_updated: number;
  duplicates: number;
  invalid_rows: number;
  details: string;
}

export interface ImportMapping {
  full_name: string;
  email: string;
  phone: string;
  college: string;
  course: string;
  year?: string;
  state?: string;
  district?: string;
  payment_status?: string;
  payment_reference?: string;
  participant_id?: string;
  registration_date?: string;
  [key: string]: string | undefined;
}

export interface ImportPreviewRow {
  rowNumber: number;
  rawData: Record<string, any>;
  mappedData: {
    participant_id?: string;
    full_name: string;
    email: string;
    phone: string;
    college: string;
    course: string;
    year?: string;
    state?: string;
    district?: string;
    payment_status?: PaymentStatus;
    payment_reference?: string;
    registration_date?: string;
    custom_fields: Record<string, any>;
  };
  status: 'NEW' | 'DUPLICATE' | 'INVALID';
  existingRecord?: Participant;
  validationErrors: string[];
  matchedBy?: 'participant_id' | 'email' | 'phone' | 'full_name' | 'batch_duplicate';
}

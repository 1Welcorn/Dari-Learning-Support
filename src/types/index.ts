export type QuestionType = 'mc' | 'text' | 'paragraph' | 'checkbox' | 'scale';

export interface Question {
  q: string;
  type: QuestionType;
  opts?: string[];
  hint?: string;
  mediator?: string;
  scaleMax?: number;
  correctAnswer?: string | string[];
  imageUrl?: string;
  audioUrl?: string;
}

export interface ExternalLink {
  label: string;
  url: string;
}

export interface Unit {
  id: string;
  title: string;
  sub?: string;
  color: string;
  sort_order: number;
  brief?: string;
  plan_c?: string;
  plan_h?: string;
  plan_e?: string;
  plan_a?: string;
  wa?: string;
  embed_urls?: string[];
  descriptors?: string[];
  questions: Question[];
  external_links?: ExternalLink[];
}

export interface Session {
  id: string;
  unit_id: string;
  session_date: string;
  note: string;
  created_at?: string;
}

export interface Answer {
  id?: string;
  unit_id: string;
  question_index: number;
  answer_value: string;
  is_done: boolean;
  updated_at?: string;
}

export interface AppSettings {
  admin_pin: string;
  med_pin: string;
  med_name: string;
  med_phone?: string;
  med_phone_2?: string;
  student_email: string;
}

export type UserRole = 'admin' | 'mediator' | null;

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
  ttsEnabled?: boolean;
  ttsOptionsEnabled?: boolean;
}

export interface ExternalLink {
  label: string;
  url: string;
  width?: string;
  loop?: boolean;
  repeatCount?: number;
  delay?: number;
  showSubtitles?: boolean;
  caption?: string;
}

export interface EmbedActivity {
  url: string;
  title?: string;
  width?: string;
  thumbnailUrl?: string;
  maskIcon?: string;
  maskSize?: number;
}

export interface GameWord {
  pt: string;
  en: string;
  icon: string;
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
  embed_urls?: (string | EmbedActivity)[];
  embed_preview_images?: string[];
  hide_nav?: boolean;
  descriptors?: string[];
  icon3D?: string;
  iconOutline?: string;
  questions: Question[];
  external_links?: ExternalLink[];
  vocabulary_list?: string[];
  game_words?: GameWord[];
  learning_objectives?: string;
  methodology?: string;
  is_locked?: boolean;
  title_dari?: string;
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

export type UserRole = 'admin' | 'mediator' | 'student' | null;

export interface Lesson {
  id: string;
  title: string;
  status: 'locked' | 'not_started' | 'completed';
  iconOutline: string; // Caminho para a imagem P&B
  icon3D: string;      // Caminho para a imagem colorida
  xpValue: number;
  titleDari?: string;
  sub?: string;
}

// Profile types for Companion

export type RelationshipType =
  | 'married'
  | 'international_marriage'
  | 'common_law'
  | 'divorced';

export type Stage =
  | 'thinking'
  | 'separated'
  | 'in_court'
  | 'post_divorce';

export type Priority =
  | 'children'
  | 'finances'
  | 'housing'
  | 'emotional_support'
  | 'legal_admin';

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  country: string | null;
  relationship_type: RelationshipType | null;
  stage: Stage | null;
  priorities: Priority[];
  has_children: boolean | null;
  children_count: number | null;
  children_ages: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

// Onboarding state type
export interface OnboardingData {
  country: string;
  relationship_type: RelationshipType;
  stage: Stage;
  priorities: Priority[];
  has_children: boolean;
  children_count: number | null;
  children_ages: string | null;
}

// Journal types
export const MOODS = [
  'calm',
  'anxious',
  'angry',
  'sad',
  'overwhelmed',
  'hopeful',
  'frustrated',
  'relieved'
] as const;

export type Mood = typeof MOODS[number];

export const JOURNAL_CATEGORIES = [
  'legal',
  'financial',
  'children',
  'housing',
  'emotional',
  'communication',
  'other'
] as const;

export type JournalCategory = typeof JOURNAL_CATEGORIES[number];

export interface JournalEntry {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  mood: Mood | null;
  category: JournalCategory | null;
  incident_date: string;
  ai_summary: string | null;
  ai_summary_generated_at: string | null;
  created_at: string;
  updated_at: string;
}

// Document types
export const DOCUMENT_CATEGORIES = [
  'legal',
  'financial',
  'personal',
  'correspondence',
  'court',
  'other'
] as const;

export type DocumentCategory = typeof DOCUMENT_CATEGORIES[number];

export interface Document {
  id: string;
  user_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  category: DocumentCategory | null;
  notes: string | null;
  uploaded_at: string;
}

// Financial types
export const FINANCIAL_TYPES = [
  'asset',
  'debt',
  'income',
  'expense'
] as const;

export type FinancialType = typeof FINANCIAL_TYPES[number];

export const FREQUENCY_OPTIONS = [
  'one_time',
  'monthly',
  'annually'
] as const;

export type Frequency = typeof FREQUENCY_OPTIONS[number];

export interface FinancialItem {
  id: string;
  user_id: string;
  type: FinancialType;
  name: string;
  amount: number;
  frequency: Frequency | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Timeline types
export const TIMELINE_CATEGORIES = [
  'legal',
  'financial',
  'personal',
  'emotional',
  'children'
] as const;

export type TimelineCategory = typeof TIMELINE_CATEGORIES[number];

export interface TimelineEvent {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_date: string;
  category: TimelineCategory | null;
  created_at: string;
}

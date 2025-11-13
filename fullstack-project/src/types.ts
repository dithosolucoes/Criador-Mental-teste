export type Screen = 'home' | 'meal' | 'pal' | 'diary' | 'resources';

export interface UserProfile {
  id: string; // user_id from auth
  name: string;
  nickname: string;
  age: number;
  conditions: string[];
  potassium_level: number;
}

export interface Medication {
  id: string; // uuid
  name: string;
  dosage: string;
  time: string;
}

export interface MedicationLog {
    id: number;
    medication_id: string;
    taken_at: string; // date string
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
    placeAnswerSources?: {
        reviewSnippets: {
            uri: string;
            title: string;
        }[];
    }[];
  };
}

export interface ExamRecord {
  id: string; // uuid
  date: string;
  image_url: string;
  potassium?: number;
  glucose?: number;
  creatinine?: number;
}

export interface PurchaseRecord {
  id: string; // uuid
  date: string;
  items: string[];
  feedback: string;
}

export interface FoodPreferenceDB {
    id: number;
    food: string;
    preference: 'like' | 'dislike';
}

export interface FoodPreference {
    food: string;
    preference: 'like' | 'dislike' | 'unknown';
}

export interface DocumentRecord {
  id: string; // uuid
  title: string;
  image_url: string;
}

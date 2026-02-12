// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export interface Kategorien {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    name?: string;
  };
}

export interface Kurse {
  record_id: string;
  createdat: string;
  updatedat: string | null;
  fields: {
    title?: string;
    description?: string;
    category?: string; // applookup -> URL zu 'Kategorien' Record
    instructor?: string;
    max_participants?: number;
    current_participants?: number;
    start_date?: string; // Format: YYYY-MM-DD oder ISO String
    end_date?: string; // Format: YYYY-MM-DD oder ISO String
    status?: 'active' | 'upcoming' | 'completed';
  };
}

export const APP_IDS = {
  KATEGORIEN: '698dcc61d32d3b471f096328',
  KURSE: '698dcc627dbdb3ef3a55e3b6',
} as const;

// Helper Types for creating new records
export type CreateKategorien = Kategorien['fields'];
export type CreateKurse = Kurse['fields'];
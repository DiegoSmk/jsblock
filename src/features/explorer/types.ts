export interface RecentEnvironment {
  path: string;
  lastOpened: number; // timestamp
  label?: 'personal' | 'work' | 'fun' | 'other';
  isFavorite?: boolean;
}

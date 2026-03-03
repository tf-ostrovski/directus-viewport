export interface LayoutOptions {
  spacing: 'compact' | 'cozy' | 'comfortable';
  autoSave: boolean;
  autoSaveDelay: number;
  liveRefresh: boolean;
}

export interface LayoutQuery {
  fields: string[];
  sort: string[];
  limit: number;
  page: number;
}

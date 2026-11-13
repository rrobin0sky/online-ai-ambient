export type CategoryType =
  | 'recommend'
  | 'favorites'
  | 'history'
  | 'all'
  | 'nature'
  | 'scifi'
  | 'anime'
  | 'beauty'
  | 'supercars'
  | 'cityscape'
  | 'minimalist'
  | 'custom';

export type QualityMode = 'auto' | 'fast' | 'raw';

export interface WallpaperItem {
  id: string;
  title: string;
  category: string;
  url: string;
  previewUrl: string;
  rawUrl?: string;
  source: 'Unsplash' | 'Bing' | 'Wallhaven' | 'Yande.re' | 'Konachan';
  location?: string;
  resolution?: string;
  purity?: string;
  aspectRatio?: number;
  tags?: string[];
  dateAdded?: number;
}

export type SoundType = 'rain' | 'fire' | 'waves' | 'forest' | 'off';

export interface SoundPreset {
  id: SoundType;
  label: string;
  iconName: string;
  description: string;
}

export interface PlayerFilterConfig {
  category: CategoryType;
  customQuery: string;
  customKeywords?: string[];
  adultMode: boolean;
  purityMode: '100' | '110' | '111' | '001';
  passcodeOrKey: string;
  enableYande: boolean;
  enableKonachan: boolean;
  qualityMode: QualityMode;
  intervalSeconds?: number;
  enableKenBurns?: boolean;
  preventSleep?: boolean;
  gridColumns?: number;
}

export interface CloudSyncPayload {
  favorites: WallpaperItem[];
  deletedFavoriteIds?: string[];
  customKeywords?: string[];
  updatedAt: number;
}

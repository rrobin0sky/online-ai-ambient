export type CategoryType =
  | 'all'
  | 'nature'
  | 'scifi'
  | 'anime'
  | 'beauty'
  | 'supercars'
  | 'cityscape'
  | 'minimalist'
  | 'custom';

export interface WallpaperItem {
  id: string;
  title: string;
  category: string;
  url: string;
  previewUrl: string;
  source: 'Unsplash' | 'Bing' | 'Wallhaven' | 'Yande.re' | 'Konachan';
  location?: string;
  resolution?: string;
  purity?: string;
  aspectRatio?: number;
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
  adultMode: boolean;
  purityMode: '100' | '110' | '111' | '001';
  passcodeOrKey: string;
  enableYande: boolean;
  enableKonachan: boolean;
}

export interface WallpaperItem {
  id: string;
  title: string;
  category: 'nature' | 'space' | 'city' | 'minimal' | 'cyber';
  url: string;
  previewUrl: string;
  source: 'Unsplash' | 'Bing' | 'Wallhaven';
  location?: string;
}

export type SoundType = 'rain' | 'fire' | 'waves' | 'forest' | 'off';

export interface SoundPreset {
  id: SoundType;
  label: string;
  iconName: string;
  description: string;
}

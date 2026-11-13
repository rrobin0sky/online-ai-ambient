import { WallpaperItem, CloudSyncPayload } from '../types';

const ZH_EN_DICTIONARY: Record<string, string> = {
  超跑: 'supercar',
  跑车: 'sports car',
  汽车: 'car',
  保时捷: 'porsche',
  法拉利: 'ferrari',
  兰博基尼: 'lamborghini',
  风景: 'landscape',
  大自然: 'nature',
  森林: 'forest',
  海滩: 'beach',
  大海: 'ocean',
  海洋: 'sea',
  日落: 'sunset',
  日出: 'sunrise',
  山脉: 'mountains',
  雪山: 'snow mountain',
  极光: 'aurora',
  星空: 'starry night',
  银河: 'milky way',
  宇宙: 'galaxy space',
  科幻: 'sci-fi',
  赛博朋克: 'cyberpunk',
  城市: 'cityscape',
  夜景: 'city night',
  东京: 'tokyo',
  动漫: 'anime',
  插画: 'illustration',
  二次元: 'anime art',
  壁纸: 'wallpaper',
  极简: 'minimalist',
  科技: 'technology',
  动物: 'animals',
  猫: 'cat',
  狗: 'dog',
  美女: 'asian beauty model',
  写真: 'portrait photography',
  模特: 'fashion model',
  古风: 'hanfu traditional',
  汉服: 'hanfu',
  暗黑: 'dark aesthetic',
  唯美: 'aesthetic',
};

export function translateQuery(query: string): string {
  const trimmed = (query || '').trim().toLowerCase();
  if (!trimmed) return '';
  if (ZH_EN_DICTIONARY[trimmed]) return ZH_EN_DICTIONARY[trimmed];
  for (const [zh, en] of Object.entries(ZH_EN_DICTIONARY)) {
    if (trimmed.includes(zh)) return en;
  }
  return trimmed;
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', '4k', 'wallpaper', 'image', 'photo', 'pic', 'wallhaven', 'yande', 'konachan', 'uhd',
]);

function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOP_WORDS.has(t));
}

function findRelatedKeywords(tag: string): string[] {
  const lower = tag.toLowerCase();
  if (lower.includes('asian') || lower.includes('beauty') || lower.includes('model') || lower.includes('girl') || lower.includes('women')) {
    return ['sensual', 'glamour', 'portrait', 'boudoir', 'cheongsam', 'bikini'];
  }
  if (lower.includes('sexy') || lower.includes('erotic') || lower.includes('sensual') || lower.includes('lingerie') || lower.includes('nude')) {
    return ['alluring', 'provocative', 'seductive', 'uncensored', 'wet'];
  }
  if (lower.includes('anime') || lower.includes('ecchi') || lower.includes('waifu') || lower.includes('2girls')) {
    return ['manga', 'digital art', 'illustration', 'fantasy', 'waifu'];
  }
  if (lower.includes('cyberpunk') || lower.includes('scifi') || lower.includes('future')) {
    return ['sci-fi', 'matrix', 'neon city', 'futuristic', 'space'];
  }
  if (lower.includes('car') || lower.includes('supercar')) {
    return ['hypercar', 'porsche', 'ferrari', 'speed'];
  }
  if (lower.includes('landscape') || lower.includes('nature') || lower.includes('mountain')) {
    return ['aurora', 'ocean', 'forest', 'sunset 4k', 'milky way'];
  }
  return [];
}

/**
 * Generates personalized recommendation search queries from user's Favorites & History
 * (75% core preference + 25% serendipity exploration)
 */
export function generatePersonalizedQueries(
  favorites: WallpaperItem[],
  history: WallpaperItem[]
): string[] {
  if (!favorites || favorites.length === 0) {
    return [
      '4k wallpaper', 'ultra hd', 'asian beauty', 'cyberpunk',
      'supercar', 'dark aesthetic', 'anime art', 'nature landscape',
    ].sort(() => Math.random() - 0.5);
  }

  const tagFreq: Record<string, number> = {};
  const favCount = Math.max(1, favorites.length);

  favorites.forEach((item, index) => {
    const recencyWeight = 1.0 + (1.0 - index / favCount);
    if (Array.isArray(item.tags)) {
      item.tags.forEach((tag) => {
        const clean = tag.trim().toLowerCase();
        if (clean.length > 2 && !STOP_WORDS.has(clean)) {
          tagFreq[clean] = (tagFreq[clean] || 0) + 3.0 * recencyWeight;
        }
      });
    }
    if (item.category && item.category !== 'all' && item.category !== 'favorites') {
      const catClean = item.category.trim().toLowerCase();
      if (catClean.length > 2 && /^[a-z0-9\s-]+$/.test(catClean)) {
        tagFreq[catClean] = (tagFreq[catClean] || 0) + 1.5 * recencyWeight;
      }
    }
    if (item.title) {
      extractKeywords(item.title).forEach((w) => {
        tagFreq[w] = (tagFreq[w] || 0) + 1.2 * recencyWeight;
      });
    }
  });

  history.slice(0, 20).forEach((item) => {
    if (Array.isArray(item.tags)) {
      item.tags.forEach((tag) => {
        const clean = tag.trim().toLowerCase();
        if (clean.length > 2 && !STOP_WORDS.has(clean)) {
          tagFreq[clean] = (tagFreq[clean] || 0) + 0.5;
        }
      });
    }
  });

  const sortedTags = Object.entries(tagFreq)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);

  const topPreferences = sortedTags.slice(0, 8);
  const expanded: string[] = [];
  topPreferences.forEach((t) => {
    expanded.push(...findRelatedKeywords(t));
  });

  const finalQueries: string[] = [
    ...topPreferences,
    ...expanded.sort(() => Math.random() - 0.5).slice(0, 4),
  ];

  if (topPreferences.length >= 2) {
    finalQueries.push(`${topPreferences[0]} 4k`);
  }

  const serendipity = [
    'ultra hd wallpaper', 'dark aesthetic', 'cinematic lighting',
    'asian beauty', 'cyberpunk', 'concept art',
  ]
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  finalQueries.push(...serendipity);

  return Array.from(new Set(finalQueries)).sort(() => Math.random() - 0.5);
}

// Local & Cloud Sync Storage Helpers
const FAV_KEY = 'ambient4k_favorites_v2';
const DEL_FAV_KEY = 'ambient4k_deleted_favs_v2';
const HIST_KEY = 'ambient4k_history_v2';

export function loadLocalFavorites(): WallpaperItem[] {
  try {
    const raw = localStorage.getItem(FAV_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalFavorites(items: WallpaperItem[]): void {
  try {
    localStorage.setItem(FAV_KEY, JSON.stringify(items));
  } catch {
    // ignore quota error
  }
}

export function loadDeletedFavoriteIds(): string[] {
  try {
    const raw = localStorage.getItem(DEL_FAV_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDeletedFavoriteIds(ids: string[]): void {
  try {
    localStorage.setItem(DEL_FAV_KEY, JSON.stringify(ids.slice(-500)));
  } catch {
    // ignore
  }
}

export function loadLocalHistory(): WallpaperItem[] {
  try {
    const raw = localStorage.getItem(HIST_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalHistory(items: WallpaperItem[]): void {
  try {
    localStorage.setItem(HIST_KEY, JSON.stringify(items.slice(0, 200)));
  } catch {
    // ignore
  }
}

export interface SsoAuthState {
  authenticated: boolean;
  username: string;
  role: string;
  scopes: string[];
  hasVipScope: boolean;
}

export async function fetchSsoAuthMe(): Promise<SsoAuthState> {
  const fallback: SsoAuthState = { authenticated: false, username: '', role: 'guest', scopes: [], hasVipScope: false };
  try {
    const res = await fetch('https://bin0sky.tech/api/auth/me', { credentials: 'include' });
    if (!res.ok) return fallback;
    const data = await res.json();
    if (!data || !data.authenticated) return fallback;
    const role = data.role || data.user?.role || 'user';
    const scopes: string[] = Array.isArray(data.scopes)
      ? data.scopes
      : Array.isArray(data.user?.scopes)
      ? data.user.scopes
      : [];
    return {
      authenticated: true,
      username: data.username || data.user?.username || '',
      role,
      scopes,
      hasVipScope: role === 'admin' || scopes.includes('ambient:vip'),
    };
  } catch {
    return fallback;
  }
}

export async function verifyAdminPasscode(passcode: string): Promise<boolean> {
  const trimmed = passcode.trim();
  if (!trimmed) return false;
  try {
    const res = await fetch('/api/sync', {
      credentials: 'include',
      headers: { 'X-Admin-Passcode': trimmed },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchCloudSync(passcode: string): Promise<CloudSyncPayload | null> {
  try {
    const headers: Record<string, string> = {};
    if (passcode.trim()) headers['X-Admin-Passcode'] = passcode.trim();
    const res = await fetch('/api/sync', {
      credentials: 'include',
      headers,
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.ok ? json.data : null;
  } catch {
    return null;
  }
}

export async function pushCloudSync(
  passcode: string,
  payload: {
    favorites: WallpaperItem[];
    deletedFavoriteIds: string[];
    customKeywords?: string[];
    replaceAll?: boolean;
  }
): Promise<CloudSyncPayload | null> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (passcode.trim()) headers['X-Admin-Passcode'] = passcode.trim();
    const res = await fetch('/api/sync', {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.ok ? json.data : null;
  } catch {
    return null;
  }
}

import { WallpaperItem, CategoryType } from '../types';

export interface CategoryMeta {
  id: CategoryType;
  label: string;
  emoji: string;
  desc: string;
}

export const PRESET_CATEGORIES: CategoryMeta[] = [
  { id: 'all', label: '综合臻选', emoji: '✨', desc: '全站 4K UHD 视觉精选混合轮播' },
  { id: 'nature', label: '极境风景', emoji: '🏔', desc: '极光、雪山、深海与壮丽山川' },
  { id: 'scifi', label: '科幻星际', emoji: '🚀', desc: '深空星云、赛博未来与太空漫游' },
  { id: 'anime', label: '动漫插画', emoji: '🎨', desc: '超清二次元 CG、幻想世界与插画艺术' },
  { id: 'beauty', label: '人像写真', emoji: '📸', desc: '时尚摄影、电影感人像与唯美光影' },
  { id: 'supercars', label: '超跑机械', emoji: '🏎', desc: '顶级超跑、空气动力学与机械美学' },
  { id: 'cityscape', label: '赛博都市', emoji: '🏙', desc: '东京雨夜、摩天楼群与霓虹街景' },
  { id: 'minimalist', label: '暗黑极简', emoji: '🖤', desc: 'OLED 纯黑、流线几何与光影极简' },
  { id: 'custom', label: '自定义标签', emoji: '🔍', desc: '输入任意英文关键词定向探索' },
];

export const SUGGESTED_TAGS = [
  { tag: 'cyberpunk 4k', label: '赛博朋克' },
  { tag: 'asian girl portrait', label: '东方人像' },
  { tag: 'aurora borealis', label: '极光夜空' },
  { tag: 'tokyo night rain', label: '东京雨夜' },
  { tag: 'genshin impact', label: '原神插画' },
  { tag: 'porsche 911 gt3', label: '保时捷 911' },
  { tag: 'dark oled abstract', label: 'OLED 暗黑' },
  { tag: 'bikini beach', label: '夏日海滩' },
];

export const CURATED_WALLPAPERS: WallpaperItem[] = [
  // Nature
  {
    id: 'nordic-aurora',
    title: '极光与寂静雪原',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=3840&q=90',
    previewUrl: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=800&q=75',
    source: 'Unsplash',
    location: 'Tromsø, Norway · 4K UHD',
  },
  {
    id: 'misty-dolomites',
    title: '多洛米蒂与云海晨曦',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=3840&q=90',
    previewUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=75',
    source: 'Unsplash',
    location: 'Dolomites, Italy · 4K UHD',
  },
  {
    id: 'midnight-ocean',
    title: '午夜潮汐与深蓝海岸',
    category: 'nature',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=3840&q=90',
    previewUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=75',
    source: 'Unsplash',
    location: 'Pacific Ocean · 4K UHD',
  },

  // Sci-Fi / Space
  {
    id: 'deep-nebula',
    title: '星际深空与创生之柱',
    category: 'scifi',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=3840&q=90',
    previewUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=75',
    source: 'Unsplash',
    location: 'Deep Cosmic Horizon · 4K UHD',
  },
  {
    id: 'galaxy-horizon',
    title: '仙女座星旋与银河核心',
    category: 'scifi',
    url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=3840&q=90',
    previewUrl: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&w=800&q=75',
    source: 'Unsplash',
    location: 'Orion Nebula · 4K UHD',
  },

  // Cityscape
  {
    id: 'rainy-tokyo',
    title: '雨夜新宿与霓虹微光',
    category: 'cityscape',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=3840&q=90',
    previewUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=75',
    source: 'Unsplash',
    location: 'Tokyo, Japan · 4K UHD',
  },
  {
    id: 'cyber-shibuya',
    title: '赛博天际线与不夜城',
    category: 'cityscape',
    url: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=3840&q=90',
    previewUrl: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=800&q=75',
    source: 'Unsplash',
    location: 'Metropolitan Skyline · 4K UHD',
  },

  // Supercars
  {
    id: 'midnight-porsche',
    title: '暗夜机械与赛道流光',
    category: 'supercars',
    url: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=3840&q=90',
    previewUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=75',
    source: 'Unsplash',
    location: 'Stuttgart Track · 4K UHD',
  },
  {
    id: 'supercar-gt',
    title: '空气动力学与碳纤幻影',
    category: 'supercars',
    url: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=3840&q=90',
    previewUrl: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=800&q=75',
    source: 'Unsplash',
    location: 'Nürburgring · 4K UHD',
  },

  // Minimalist
  {
    id: 'zen-minimal',
    title: '极简流线与沙丘光影',
    category: 'minimalist',
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=3840&q=90',
    previewUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=75',
    source: 'Unsplash',
    location: 'Namib Desert · 4K UHD',
  },
  {
    id: 'dark-waves-oled',
    title: '流体暗黑与抽象丝绸',
    category: 'minimalist',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=3840&q=90',
    previewUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=800&q=75',
    source: 'Unsplash',
    location: 'OLED Pure Black · 4K UHD',
  },

  // Anime / Illustration
  {
    id: 'anime-neon-sky',
    title: '幻想星穹与二次元暮色',
    category: 'anime',
    url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=3840&q=90',
    previewUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=75',
    source: 'Unsplash',
    location: 'Digital Art 4K',
  },

  // Beauty / Portrait
  {
    id: 'cinematic-portrait',
    title: '电影感逆光与胶片叙事',
    category: 'beauty',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=3840&q=90',
    previewUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=75',
    source: 'Unsplash',
    location: 'Editorial Portrait · 4K UHD',
  },
];

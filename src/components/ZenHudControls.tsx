import React, { useEffect, useRef } from 'react';
import {
  MoreHorizontal,
  X,
  Play,
  Pause,
  CloudRain,
  Waves,
  Flame,
  Trees,
  VolumeX,
  Volume2,
  ImageDown,
  Heart,
  Maximize,
  Minimize,
  RefreshCw,
  LayoutGrid,
  SlidersHorizontal,
  Frame,
} from 'lucide-react';
import { CategoryType, PlayerFilterConfig, SoundType } from '../types';
import { PRESET_CATEGORIES } from '../data/wallpapers';
import { ScaleMode } from './WallpaperStage';

interface ZenHudControlsProps {
  uiVisible: boolean;
  isPopoverOpen: boolean;
  onTogglePopover: (open?: boolean) => void;
  onExitZen: () => void;
  filterConfig: PlayerFilterConfig;
  onSelectCategory: (cat: CategoryType) => void;
  onOpenCategoryModal: () => void;
  onOpenGallery: () => void;
  onRefreshPool: () => void;
  isFetchingPool: boolean;
  autoPlay: boolean;
  onToggleAutoPlay: () => void;
  intervalSeconds: number;
  onChangeInterval: (seconds: number) => void;
  currentSound: SoundType;
  onSoundChange: (sound: SoundType) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  scaleMode: ScaleMode;
  onToggleScaleMode: () => void;
  isCurrentFavorited: boolean;
  onToggleFavorite: () => void;
  onSaveCurrentImage: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  lang?: 'zh' | 'en';
}

const INTERVAL_OPTIONS = [10, 20, 30, 60];

const CATEGORY_LABELS_EN: Record<string, string> = {
  recommend: 'For You',
  favorites: 'Favorites',
  history: 'History',
  all: 'Featured',
  nature: 'Nature',
  scifi: 'Sci-Fi',
  anime: 'Anime',
  beauty: 'Portraits',
  supercars: 'Supercars',
  cityscape: 'City',
  minimalist: 'Minimal',
  custom: 'Custom',
};

export const ZenHudControls: React.FC<ZenHudControlsProps> = ({
  uiVisible,
  isPopoverOpen,
  onTogglePopover,
  onExitZen,
  filterConfig,
  onSelectCategory,
  onOpenCategoryModal,
  onOpenGallery,
  onRefreshPool,
  isFetchingPool,
  autoPlay,
  onToggleAutoPlay,
  intervalSeconds,
  onChangeInterval,
  currentSound,
  onSoundChange,
  volume,
  onVolumeChange,
  scaleMode,
  onToggleScaleMode,
  isCurrentFavorited,
  onToggleFavorite,
  onSaveCurrentImage,
  isFullscreen,
  onToggleFullscreen,
  lang = 'zh',
}) => {
  const isZh = lang !== 'en';
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isPopoverOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onTogglePopover(false);
      }
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, [isPopoverOpen, onTogglePopover]);

  const soundOptions: { type: SoundType; label: string; icon: React.ReactNode }[] = [
    { type: 'off', label: isZh ? '静音' : 'Mute', icon: <VolumeX className="w-3.5 h-3.5" /> },
    { type: 'rain', label: isZh ? '细雨' : 'Rain', icon: <CloudRain className="w-3.5 h-3.5" /> },
    { type: 'waves', label: isZh ? '潮汐' : 'Waves', icon: <Waves className="w-3.5 h-3.5" /> },
    { type: 'fire', label: isZh ? '壁炉' : 'Fire', icon: <Flame className="w-3.5 h-3.5" /> },
    { type: 'forest', label: isZh ? '林风' : 'Forest', icon: <Trees className="w-3.5 h-3.5" /> },
  ];

  const scaleLabelMap: Record<ScaleMode, string> = {
    auto: isZh ? '智能' : 'Auto',
    cover: isZh ? '铺满' : 'Cover',
    fit: isZh ? '完整' : 'Fit',
  };

  const visibleHud = uiVisible || isPopoverOpen;

  return (
    <div
      ref={containerRef}
      className={`fixed top-5 right-5 z-50 flex flex-col items-end transition-all duration-500 ${
        visibleHud ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'
      }`}
    >
      {/* Top-Right Minimal Buttons: [ ••• ] and [ × ] */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onTogglePopover();
          }}
          className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-xl border transition-all duration-200 cursor-pointer shadow-lg ${
            isPopoverOpen
              ? 'bg-white/25 border-white/35 text-white'
              : 'bg-black/45 hover:bg-black/65 border-white/15 text-white/90 hover:text-white'
          }`}
          title={isZh ? '更多设置与菜单' : 'More options'}
          aria-label="Ambient options"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onExitZen();
          }}
          className="w-9 h-9 rounded-full flex items-center justify-center bg-black/45 hover:bg-black/65 backdrop-blur-xl border border-white/15 text-white/90 hover:text-white transition-all duration-200 cursor-pointer shadow-lg"
          title={isZh ? '退出返回工作台 (Esc)' : 'Exit to Workstation (Esc)'}
          aria-label="Close Ambient 4K"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Frosted-Glass Popover Menu */}
      {isPopoverOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-2.5 w-[320px] max-w-[calc(100vw-2.5rem)] max-h-[calc(100vh-5.5rem)] overflow-y-auto rounded-2xl bg-zinc-950/80 backdrop-blur-2xl border border-white/15 shadow-2xl p-3.5 text-slate-100 space-y-3.5"
        >
          {/* Section 1: Category Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                {isZh ? '专辑分类' : 'Album Filter'}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={onRefreshPool}
                  disabled={isFetchingPool}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors cursor-pointer disabled:opacity-50"
                  title={isZh ? '换一批壁纸 (R)' : 'Refresh pool (R)'}
                >
                  <RefreshCw className={`w-3 h-3 ${isFetchingPool ? 'animate-spin text-indigo-400' : ''}`} />
                  <span>{isZh ? '换一批' : 'Refresh'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onTogglePopover(false);
                    onOpenCategoryModal();
                  }}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] text-indigo-300 hover:text-indigo-200 bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>{isZh ? '高级' : 'More'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {PRESET_CATEGORIES.filter((c) => c.id !== 'history' && c.id !== 'custom').map((cat) => {
                const active = filterConfig.category === cat.id;
                const label = isZh ? cat.label : (CATEGORY_LABELS_EN[cat.id] || cat.label);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => onSelectCategory(cat.id)}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all cursor-pointer truncate border ${
                      active
                        ? 'bg-indigo-500/25 text-white border-indigo-400/50'
                        : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border-white/5'
                    }`}
                  >
                    <span className="shrink-0">{cat.emoji}</span>
                    <span className="truncate">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-[1px] bg-white/10" />

          {/* Section 2: Auto-Play Switch & Interval */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                {isZh ? '自动轮播' : 'Slideshow'}
              </span>
              <button
                type="button"
                onClick={onToggleAutoPlay}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer border ${
                  autoPlay
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/35'
                    : 'bg-white/5 text-slate-300 hover:text-white border-white/10'
                }`}
              >
                {autoPlay ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{autoPlay ? (isZh ? '轮播中' : 'Playing') : (isZh ? '已暂停' : 'Paused')}</span>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {INTERVAL_OPTIONS.map((sec) => {
                const active = intervalSeconds === sec;
                return (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => onChangeInterval(sec)}
                    className={`py-1 rounded-lg text-[11px] font-mono transition-all cursor-pointer border ${
                      active
                        ? 'bg-white/20 text-white border-white/30 font-semibold'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border-white/5'
                    }`}
                  >
                    {sec}s
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-[1px] bg-white/10" />

          {/* Section 3: Ambient Soundscape */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                {isZh ? '氛围音效' : 'Soundscape'}
              </span>
              {currentSound !== 'off' && (
                <div className="flex items-center gap-1.5">
                  <Volume2 className="w-3 h-3 text-slate-400" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    className="w-20 accent-indigo-400 h-1 bg-white/20 rounded-lg cursor-pointer"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-5 gap-1">
              {soundOptions.map((opt) => {
                const active = currentSound === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => onSoundChange(opt.type)}
                    className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-medium transition-all cursor-pointer border ${
                      active
                        ? 'bg-indigo-500/25 text-white border-indigo-400/50'
                        : 'bg-white/5 text-slate-300 hover:text-white hover:bg-white/10 border-white/5'
                    }`}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="h-[1px] bg-white/10" />

          {/* Section 4: Actions (Download, Favorite, Scale, Fullscreen, Gallery) */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={onSaveCurrentImage}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-colors cursor-pointer"
            >
              <ImageDown className="w-3.5 h-3.5 text-sky-300" />
              <span>{isZh ? '下载 4K 原图' : 'Download 4K'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleFavorite}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                isCurrentFavorited
                  ? 'bg-rose-500/25 text-rose-200 border-rose-500/40'
                  : 'bg-white/5 hover:bg-white/15 text-slate-200 border-white/10'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isCurrentFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
              <span>{isCurrentFavorited ? (isZh ? '已收藏' : 'Saved') : (isZh ? '收藏壁纸' : 'Favorite')}</span>
            </button>

            <button
              type="button"
              onClick={onToggleScaleMode}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10 transition-colors cursor-pointer"
            >
              <Frame className="w-3.5 h-3.5 text-indigo-300" />
              <span>{isZh ? `画幅: ${scaleLabelMap[scaleMode]}` : `Scale: ${scaleLabelMap[scaleMode]}`}</span>
            </button>

            <button
              type="button"
              onClick={onToggleFullscreen}
              className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10 transition-colors cursor-pointer"
            >
              {isFullscreen ? <Minimize className="w-3.5 h-3.5 text-emerald-300" /> : <Maximize className="w-3.5 h-3.5 text-emerald-300" />}
              <span>{isFullscreen ? (isZh ? '退出全屏' : 'Exit Full') : (isZh ? '全屏 (F)' : 'Fullscreen')}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              onTogglePopover(false);
              onOpenGallery();
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
          >
            <LayoutGrid className="w-3.5 h-3.5 text-indigo-300" />
            <span>{isZh ? '打开探索画廊与收藏库 (G)' : 'Open Gallery & Favorites (G)'}</span>
          </button>

          {/* Shortcut hints */}
          <div className="pt-1 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
            <span>←/→ {isZh ? '切图' : 'Nav'}</span>
            <span>Space {isZh ? '轮播' : 'Play'}</span>
            <span>F {isZh ? '全屏' : 'Full'}</span>
            <span>Esc {isZh ? '退出' : 'Exit'}</span>
          </div>
        </div>
      )}
    </div>
  );
};

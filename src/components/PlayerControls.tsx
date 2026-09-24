import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  Volume2,
  VolumeX,
  CloudRain,
  Flame,
  Waves,
  Trees,
  SlidersHorizontal,
  ChevronDown,
  LayoutGrid,
  RefreshCw,
} from 'lucide-react';
import { SoundType, PlayerFilterConfig } from '../types';
import { PRESET_CATEGORIES } from '../data/wallpapers';

interface PlayerControlsProps {
  onPrev: () => void;
  onNext: () => void;
  autoPlay: boolean;
  onToggleAutoPlay: () => void;
  currentSound: SoundType;
  onSoundChange: (sound: SoundType) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onOpenShowcase: () => void;
  filterConfig: PlayerFilterConfig;
  onOpenCategoryModal: () => void;
  onRefreshPool: () => void;
  isFetchingPool: boolean;
  uiVisible: boolean;
}

export const PlayerControls: React.FC<PlayerControlsProps> = ({
  onPrev,
  onNext,
  autoPlay,
  onToggleAutoPlay,
  currentSound,
  onSoundChange,
  volume,
  onVolumeChange,
  isFullscreen,
  onToggleFullscreen,
  onOpenShowcase,
  filterConfig,
  onOpenCategoryModal,
  onRefreshPool,
  isFetchingPool,
  uiVisible,
}) => {
  const [showSoundMenu, setShowSoundMenu] = useState(false);

  const soundOptions: { type: SoundType; label: string; icon: React.ReactNode }[] = [
    { type: 'rain', label: '细雨微风', icon: <CloudRain className="w-3.5 h-3.5" /> },
    { type: 'waves', label: '深蓝潮汐', icon: <Waves className="w-3.5 h-3.5" /> },
    { type: 'fire', label: '壁炉柴火', icon: <Flame className="w-3.5 h-3.5" /> },
    { type: 'forest', label: '林间微风', icon: <Trees className="w-3.5 h-3.5" /> },
    { type: 'off', label: '静音', icon: <VolumeX className="w-3.5 h-3.5" /> },
  ];

  const activeCategoryMeta =
    PRESET_CATEGORIES.find((c) => c.id === filterConfig.category) || PRESET_CATEGORIES[0];

  return (
    <div
      className={`fixed bottom-6 left-0 right-0 z-40 flex flex-col items-center gap-3 px-3 transition-all duration-500 pointer-events-none ${
        uiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      }`}
    >
      {/* Sound selector popup menu */}
      {showSoundMenu && (
        <div className="glass-panel p-2.5 rounded-2xl flex flex-wrap items-center justify-center gap-2 pointer-events-auto border border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-1">
            {soundOptions.map((opt) => (
              <button
                key={opt.type}
                onClick={() => {
                  onSoundChange(opt.type);
                  if (opt.type === 'off') setShowSoundMenu(false);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                  currentSound === opt.type
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                {opt.icon}
                <span>{opt.label}</span>
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-white/10 mx-1 hidden sm:block" />

          {/* Volume slider */}
          <div className="flex items-center gap-2 px-2">
            <Volume2 className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-20 accent-indigo-500 h-1.5 bg-white/20 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Main Bottom Floating Bar */}
      <div className="glass-panel px-3.5 sm:px-4 py-2 rounded-full flex items-center gap-1.5 sm:gap-3 shadow-2xl pointer-events-auto border border-white/10 max-w-full overflow-x-auto">
        {/* Prev / Next controls */}
        <div className="flex items-center gap-0.5 shrink-0">
          <button
            onClick={onPrev}
            className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="上一张壁纸 (Left Arrow)"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            onClick={onNext}
            className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="下一张壁纸 (Right Arrow)"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={onRefreshPool}
            disabled={isFetchingPool}
            className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer disabled:opacity-50"
            title="从云端刷新一批新 4K 壁纸 (R 键)"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingPool ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>

        <div className="h-4 w-[1px] bg-white/10 shrink-0" />

        {/* Category & Adult Mode Trigger Button */}
        <button
          onClick={onOpenCategoryModal}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0 ${
            filterConfig.adultMode
              ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40 hover:bg-rose-500/30'
              : 'bg-indigo-500/15 text-indigo-200 border border-indigo-500/30 hover:bg-indigo-500/25'
          }`}
          title="选择图片分类与 NSFW 模式 (按 C 键)"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>
            {activeCategoryMeta.emoji} {activeCategoryMeta.label}
          </span>
          {filterConfig.adultMode && (
            <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-600 text-white">
              18+
            </span>
          )}
        </button>

        <div className="h-4 w-[1px] bg-white/10 shrink-0" />

        {/* Auto play status */}
        <button
          onClick={onToggleAutoPlay}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0 ${
            autoPlay
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
          }`}
          title="自动轮播切换 (Space 键)"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${autoPlay ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
          <span className="hidden sm:inline">{autoPlay ? '轮播中' : '已暂停'}</span>
        </button>

        <div className="h-4 w-[1px] bg-white/10 shrink-0" />

        {/* Ambient Sound Trigger */}
        <button
          onClick={() => setShowSoundMenu(!showSoundMenu)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer shrink-0 ${
            currentSound !== 'off'
              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
          title="环境白噪音"
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden md:inline">
            {currentSound === 'off'
              ? '白噪音'
              : soundOptions.find((o) => o.type === currentSound)?.label}
          </span>
        </button>

        <div className="h-4 w-[1px] bg-white/10 shrink-0" />

        {/* Fullscreen Toggle */}
        <button
          onClick={onToggleFullscreen}
          className="p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
          title="全屏切换 (按 F 键)"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>

        {/* Showcase Drawer Trigger */}
        <button
          onClick={onOpenShowcase}
          className="flex items-center gap-1 pl-1 text-xs text-indigo-300 hover:text-indigo-200 cursor-pointer font-medium shrink-0"
          title="查看 macOS 原生桌面版特性"
        >
          <span className="hidden lg:inline">客户端</span>
          <ChevronDown className="w-3.5 h-3.5 animate-bounce" />
        </button>
      </div>
    </div>
  );
};

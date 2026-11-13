import React from 'react';
import { Monitor, LayoutGrid, Heart, Cloud, Lock } from 'lucide-react';
import { BrandLogo } from './BrandLogo';

interface HeaderNavProps {
  activeTab: 'player' | 'gallery';
  onTabChange: (tab: 'player' | 'gallery') => void;
  favoritesCount: number;
  isAdminUnlocked: boolean;
  onOpenSettings: () => void;
  uiVisible: boolean;
  lang?: 'zh' | 'en';
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  activeTab,
  onTabChange,
  favoritesCount,
  isAdminUnlocked,
  onOpenSettings,
  uiVisible,
  lang = 'zh',
}) => {
  const isZh = lang !== 'en';
  return (
    <header
      className={`fixed top-4 left-0 right-0 z-50 flex justify-center px-4 transition-all duration-500 pointer-events-none ${
        uiVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-1.5 sm:gap-2 shadow-2xl pointer-events-auto border border-white/10">
        {/* Brand */}
        <button
          onClick={() => onTabChange('player')}
          className="flex items-center gap-2 px-2 py-1 rounded-full hover:bg-white/5 transition-colors group cursor-pointer text-left"
        >
          <BrandLogo size={28} className="group-hover:scale-105 transition-transform drop-shadow-lg" />
          <div className="hidden sm:block">
            <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
              Ambient
              <span className="text-indigo-300 font-extrabold text-[11px] px-1.5 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-400/30">
                4K
              </span>
            </span>
          </div>
        </button>

        <div className="h-4 w-[1px] bg-white/10 mx-0.5 hidden sm:block" />

        {/* Dual Mode Tab Switch: Player vs Gallery */}
        <div className="flex items-center bg-black/40 rounded-full p-1 border border-white/5">
          <button
            onClick={() => onTabChange('player')}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'player'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
            title={isZh ? '全屏沉浸播放器 (按 G 键切换画廊)' : 'Ambient Player (Key: G)'}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>{isZh ? '沉浸播放' : 'Player'}</span>
          </button>

          <button
            onClick={() => onTabChange('gallery')}
            className={`flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'gallery'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
            title={isZh ? '多图探索画廊与收藏媒体库 (按 G 键切换)' : 'Explore Gallery & Favorites (Key: G)'}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>{isZh ? '探索画廊' : 'Gallery'}</span>
            {favoritesCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/25 text-rose-300 border border-rose-500/30 flex items-center gap-0.5">
                <Heart className="w-2.5 h-2.5 fill-rose-400 text-rose-400" />
                {favoritesCount}
              </span>
            )}
          </button>
        </div>

        {/* Admin Cloud Sync Status / Login Button */}
        <button
          onClick={onOpenSettings}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ml-0.5 border ${
            isAdminUnlocked
              ? 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40 hover:bg-emerald-500/30'
              : 'bg-white/10 text-slate-200 border-white/15 hover:bg-white/20'
          }`}
          title={
            isAdminUnlocked
              ? '已登录统一账号 · 个人收藏夹已开启 Cloudflare KV 云端实时同步'
              : '登录 bin0sky 统一账号开启个人云端收藏同步，或输入共享口令解锁 18+ 图库'
          }
        >
          {isAdminUnlocked ? (
            <>
              <Cloud className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden md:inline">{isZh ? '云同步已开启' : 'Cloud Synced'}</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden md:inline">{isZh ? '登录 / 解锁' : 'Login / Unlock'}</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};

import React, { useState, useRef } from 'react';
import {
  Heart,
  Search,
  RefreshCw,
  Download,
  Trash2,
  Grid,
  Sidebar,
  Cloud,
  Upload,
  FileDown,
  Play,
  Sparkles,
  Lock,
} from 'lucide-react';
import { WallpaperItem, CategoryType, PlayerFilterConfig } from '../types';
import { PRESET_CATEGORIES } from '../data/wallpapers';
import { translateQuery } from '../services/recommendationEngine';

interface GalleryViewProps {
  items: WallpaperItem[];
  favorites: WallpaperItem[];
  history: WallpaperItem[];
  favoriteIds: Set<string>;
  filterConfig: PlayerFilterConfig;
  isAdminUnlocked: boolean;
  isSyncingCloud: boolean;
  isFetchingPool: boolean;
  onSelectCategory: (cat: CategoryType) => void;
  onPlayWallpaper: (item: WallpaperItem) => void;
  onToggleFavorite: (item: WallpaperItem) => void;
  onDownloadWallpaper: (item: WallpaperItem) => void;
  onRefreshCategory: () => void;
  onLoadMore: () => void;
  onClearHistory: () => void;
  onManualCloudSync: () => void;
  onExportFavoritesJson: () => void;
  onImportFavoritesJson: (file: File) => void;
  onBatchDownloadFavorites: () => void;
  onOpenSettingsModal: () => void;
  onBackToPlayer: () => void;
}

export const GalleryView: React.FC<GalleryViewProps> = ({
  items,
  favorites,
  history,
  favoriteIds,
  filterConfig,
  isAdminUnlocked,
  isSyncingCloud,
  isFetchingPool,
  onSelectCategory,
  onPlayWallpaper,
  onToggleFavorite,
  onDownloadWallpaper,
  onRefreshCategory,
  onLoadMore,
  onClearHistory,
  onManualCloudSync,
  onExportFavoritesJson,
  onImportFavoritesJson,
  onBatchDownloadFavorites,
  onOpenSettingsModal,
  onBackToPlayer,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [columns, setColumns] = useState<number>(filterConfig.gridColumns || 4);
  const [searchText, setSearchText] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeCategory = filterConfig.category;
  const baseList =
    activeCategory === 'favorites'
      ? favorites
      : activeCategory === 'history'
        ? history
        : items;

  const trimmedQuery = searchText.trim().toLowerCase();
  const translated = trimmedQuery ? translateQuery(trimmedQuery).toLowerCase() : '';

  const filteredItems = trimmedQuery
    ? baseList.filter((item) => {
        const titleMatch = item.title?.toLowerCase().includes(trimmedQuery) || item.title?.toLowerCase().includes(translated);
        const catMatch = item.category?.toLowerCase().includes(trimmedQuery) || item.category?.toLowerCase().includes(translated);
        const srcMatch = item.source?.toLowerCase().includes(trimmedQuery);
        const tagMatch = item.tags?.some(
          (t) => t.toLowerCase().includes(trimmedQuery) || (translated && t.toLowerCase().includes(translated))
        );
        return titleMatch || catMatch || srcMatch || tagMatch;
      })
    : baseList;

  const discoverCats = PRESET_CATEGORIES.filter((c) => ['recommend', 'all'].includes(c.id));
  const libraryCats = PRESET_CATEGORIES.filter((c) => ['favorites', 'history', 'custom'].includes(c.id));
  const themeCats = PRESET_CATEGORIES.filter(
    (c) => !['recommend', 'all', 'favorites', 'history', 'custom'].includes(c.id)
  );

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (activeCategory === 'favorites' || activeCategory === 'history' || isFetchingPool) return;
    const el = e.currentTarget;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 360) {
      onLoadMore();
    }
  };

  return (
    <div className="w-screen h-screen pt-16 bg-[#0b0d12] text-slate-100 flex overflow-hidden select-none">
      {/* Left Collapsible Sidebar */}
      {sidebarOpen && (
        <aside className="w-56 shrink-0 h-full border-r border-white/10 bg-[#10131a] flex flex-col justify-between overflow-y-auto px-3 py-4">
          <div className="space-y-5">
            {/* Discover */}
            <div>
              <div className="px-2.5 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                发现
              </div>
              <div className="space-y-1">
                {discoverCats.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      activeCategory === cat.id
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Library */}
            <div>
              <div className="px-2.5 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                我的媒体库
              </div>
              <div className="space-y-1">
                {libraryCats.map((cat) => {
                  const badgeCount =
                    cat.id === 'favorites'
                      ? favorites.length
                      : cat.id === 'history'
                        ? history.length
                        : null;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => onSelectCategory(cat.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        activeCategory === cat.id
                          ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{cat.emoji}</span>
                        <span>{cat.label}</span>
                      </span>
                      {badgeCount !== null && badgeCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-white/15 text-white">
                          {badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Themes */}
            <div>
              <div className="px-2.5 pb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                题材分类
              </div>
              <div className="space-y-1">
                {themeCats.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      activeCategory === cat.id
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Admin Sync Status */}
          <div className="pt-4 border-t border-white/10 space-y-2">
            <button
              onClick={onOpenSettingsModal}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs border transition-all cursor-pointer ${
                isAdminUnlocked
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <span className="flex items-center gap-1.5 truncate">
                {isAdminUnlocked ? <Cloud className="w-3.5 h-3.5 shrink-0" /> : <Lock className="w-3.5 h-3.5 shrink-0" />}
                <span className="truncate">{isAdminUnlocked ? '管理员云同步已开启' : '管理员登录 / 同步'}</span>
              </span>
            </button>

            <button
              onClick={onBackToPlayer}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>返回全屏轮播</span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Toolbar */}
        <div className="h-12 px-4 border-b border-white/10 bg-[#12161f] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
              title="展开/收起边栏"
            >
              <Sidebar className="w-4 h-4" />
            </button>

            {/* Search Filter Input */}
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="检索当前画廊 (支持中文如: 极光、超跑、动漫)..."
                className="w-48 sm:w-64 pl-8 pr-3 py-1.5 rounded-full bg-black/40 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400"
              />
            </div>

            {/* Context Actions for Favorites & History */}
            {activeCategory === 'favorites' && (
              <div className="hidden md:flex items-center gap-1.5">
                {isAdminUnlocked && (
                  <button
                    onClick={onManualCloudSync}
                    disabled={isSyncingCloud}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600/25 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/35 text-[11px] font-medium cursor-pointer"
                    title="立即与 Cloudflare KV 云端双向同步收藏夹"
                  >
                    <Cloud className={`w-3 h-3 ${isSyncingCloud ? 'animate-bounce' : ''}`} />
                    <span>{isSyncingCloud ? '同步中...' : '云端同步'}</span>
                  </button>
                )}

                <button
                  onClick={onBatchDownloadFavorites}
                  disabled={favorites.length === 0}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-200 hover:bg-indigo-600/45 text-[11px] font-medium cursor-pointer disabled:opacity-40"
                  title="批量导出收藏夹 4K 原图到本地文件夹"
                >
                  <FileDown className="w-3 h-3" />
                  <span>导出原图到本地目录</span>
                </button>

                <button
                  onClick={onExportFavoritesJson}
                  disabled={favorites.length === 0}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 text-slate-200 text-[11px] font-medium cursor-pointer"
                  title="导出收藏夹 JSON 备份"
                >
                  <Download className="w-3 h-3" />
                  <span>备份 JSON</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 text-slate-200 text-[11px] font-medium cursor-pointer"
                  title="导入本地 JSON 收藏文件"
                >
                  <Upload className="w-3 h-3" />
                  <span>导入</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onImportFavoritesJson(f);
                    e.target.value = '';
                  }}
                />
              </div>
            )}

            {activeCategory === 'history' && history.length > 0 && (
              <button
                onClick={onClearHistory}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-600/25 border border-rose-500/40 text-rose-200 hover:bg-rose-600/40 text-[11px] font-medium cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>清空足迹</span>
              </button>
            )}
          </div>

          {/* Right Controls: Refresh + Grid Density Slider */}
          <div className="flex items-center gap-3">
            {activeCategory !== 'favorites' && activeCategory !== 'history' && (
              <button
                onClick={onRefreshCategory}
                disabled={isFetchingPool}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 text-xs text-slate-200 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isFetchingPool ? 'animate-spin text-indigo-400' : ''}`} />
                <span className="hidden sm:inline">{isFetchingPool ? '拉取中...' : '换一批'}</span>
              </button>
            )}

            <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">
              <Grid className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="range"
                min={2}
                max={6}
                step={1}
                value={columns}
                onChange={(e) => setColumns(Number(e.target.value))}
                className="w-20 accent-indigo-500 h-1 bg-white/20 rounded-lg cursor-pointer"
                title={`网格列数: ${columns} 列`}
              />
              <span className="text-[11px] text-slate-400 font-mono">{columns}列</span>
            </div>
          </div>
        </div>

        {/* 1:1 Uniform Square Grid Scroll Area (Apple Photos Style) */}
        <div onScroll={handleScroll} className="flex-1 overflow-y-auto p-1">
          {filteredItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <Sparkles className="w-10 h-10 text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-200 mb-1">
                {activeCategory === 'favorites'
                  ? '暂无收藏壁纸'
                  : activeCategory === 'history'
                    ? '暂无历史浏览记录'
                    : '正在加载或未找到匹配壁纸'}
              </p>
              <p className="text-xs text-slate-500 max-w-sm">
                {activeCategory === 'favorites'
                  ? '在播放或画廊中按 Space 键、双击画面或点击红心即可收藏心仪壁纸；登录管理员口令可自动拉取云端 159 张收藏。'
                  : '尝试切换其他分类题材或点击右上角「换一批」'}
              </p>
            </div>
          ) : (
            <div
              className="grid gap-1 pb-20"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {filteredItems.map((item) => {
                const isFav = favoriteIds.has(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => onPlayWallpaper(item)}
                    className="group relative aspect-square bg-[#151821] overflow-hidden cursor-pointer"
                  >
                    <img
                      src={item.previewUrl || item.url}
                      alt={item.title}
                      loading="lazy"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />

                    {/* Always-visible small heart indicator if favorited */}
                    {isFav && (
                      <div className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-rose-500 pointer-events-none group-hover:opacity-0 transition-opacity">
                        <Heart className="w-3.5 h-3.5 fill-rose-500" />
                      </div>
                    )}

                    {/* Hover Overlay Action Bar */}
                    <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite(item);
                        }}
                        className="p-1.5 rounded-full bg-black/75 hover:bg-black text-white transition-transform active:scale-90 cursor-pointer"
                        title={isFav ? '取消收藏' : '加入收藏'}
                      >
                        <Heart
                          className={`w-4 h-4 ${isFav ? 'text-rose-500 fill-rose-500' : 'text-white'}`}
                        />
                      </button>

                      <span className="text-[10px] text-slate-300 font-mono truncate px-2">
                        {item.resolution || '4K UHD'}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownloadWallpaper(item);
                        }}
                        className="p-1.5 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white transition-transform active:scale-90 cursor-pointer"
                        title="下载 4K 原图"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

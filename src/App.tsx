import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Heart } from 'lucide-react';
import { CURATED_WALLPAPERS } from './data/wallpapers';
import { HeaderNav } from './components/HeaderNav';
import { ClockWidget } from './components/ClockWidget';
import { PlayerControls } from './components/PlayerControls';
import { FilmstripScrubber } from './components/FilmstripScrubber';
import { GalleryView } from './components/GalleryView';
import { CategorySettingsModal } from './components/CategorySettingsModal';
import { WallpaperStage, ScaleMode } from './components/WallpaperStage';
import { soundManager } from './services/soundSynthesizer';
import {
  generatePersonalizedQueries,
  translateQuery,
  loadLocalFavorites,
  saveLocalFavorites,
  loadDeletedFavoriteIds,
  saveDeletedFavoriteIds,
  loadLocalHistory,
  saveLocalHistory,
  fetchSsoAuthMe,
  verifyAdminPasscode,
  fetchCloudSync,
  pushCloudSync,
  type SsoAuthState,
} from './services/recommendationEngine';
import { SoundType, PlayerFilterConfig, WallpaperItem, QualityMode, CategoryType } from './types';

const STORAGE_KEY = 'ambient4k_web_filter_v2';

const DEFAULT_FILTER_CONFIG: PlayerFilterConfig = {
  category: 'recommend',
  customQuery: '',
  adultMode: false,
  purityMode: '111',
  passcodeOrKey: '',
  enableYande: true,
  enableKonachan: true,
  qualityMode: 'auto',
};

function loadSavedConfig(): PlayerFilterConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FILTER_CONFIG;
    const parsed: PlayerFilterConfig = { ...DEFAULT_FILTER_CONFIG, ...JSON.parse(raw) };
    if (parsed.adultMode && !parsed.passcodeOrKey?.trim()) {
      parsed.adultMode = false;
    }
    return parsed;
  } catch {
    return DEFAULT_FILTER_CONFIG;
  }
}

async function fetchSafeBlob(url: string): Promise<Blob> {
  // 1. Try direct fetch
  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) {
      return await res.blob();
    }
  } catch {
    // Fallback to proxy
  }

  // 2. Fallback to Cloudflare edge image proxy which always returns CORS headers
  const proxyUrl = url.includes('/api/image-proxy')
    ? url
    : `/api/image-proxy?url=${encodeURIComponent(url)}`;
  const proxyRes = await fetch(proxyUrl);
  if (!proxyRes.ok) throw new Error(`Download failed with status ${proxyRes.status}`);
  return await proxyRes.blob();
}

function getOptimalStreamWidth(mode: QualityMode = 'auto'): number {
  if (mode === 'raw') return 0; // 0 = uncompressed original
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const physicalW = Math.round(window.innerWidth * dpr);

  if (mode === 'fast') {
    return physicalW <= 1080 ? 1080 : 1920;
  }

  // Auto adaptive mode
  if (physicalW <= 1170) return 1280;
  if (physicalW <= 2560) return 2560;
  return 3840;
}

function adaptCuratedPool(items: WallpaperItem[], targetWidth: number): WallpaperItem[] {
  return items.map((item) => {
    const originalUrl = item.rawUrl || item.url;
    if (targetWidth <= 0 || !originalUrl.includes('images.unsplash.com')) {
      return { ...item, rawUrl: originalUrl };
    }
    const adaptedUrl = originalUrl
      .replace(/w=\d+/, `w=${targetWidth}`)
      .replace(/q=\d+/, 'q=82');
    return {
      ...item,
      url: adaptedUrl,
      rawUrl: originalUrl,
    };
  });
}

export function App() {
  const [lang, setLang] = useState<'zh' | 'en'>(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('b0_lang');
      const saved = p || localStorage.getItem('b0_lang');
      return saved && saved.toLowerCase().startsWith('en') ? 'en' : 'zh';
    } catch {
      return 'zh';
    }
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const p = new URLSearchParams(window.location.search).get('b0_theme');
      const saved = p || localStorage.getItem('b0_theme');
      return saved ? saved === 'dark' : true;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (!e.data) return;
      if (e.data.type === 'B0_THEME_CHANGE') {
        const dark = e.data.theme === 'dark';
        setIsDark(dark);
        if (dark) {
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
        } else {
          document.documentElement.classList.remove('dark');
          document.documentElement.classList.add('light');
        }
      } else if (e.data.type === 'B0_LANG_CHANGE') {
        const isZh = !e.data.lang || e.data.lang.toLowerCase().startsWith('zh');
        const target = isZh ? 'zh' : 'en';
        setLang(target);
        document.documentElement.setAttribute('lang', isZh ? 'zh-CN' : 'en');
      } else if (e.data.type === 'B0_AUTH_CHANGE') {
        const role = e.data.role || (e.data.isAdmin ? 'admin' : 'guest');
        const scopes: string[] = Array.isArray(e.data.scopes) ? e.data.scopes : [];
        const hasVipScope = Boolean(e.data.authenticated ?? (role === 'admin' || role === 'user')) &&
          (role === 'admin' || scopes.includes('ambient:vip'));
        setSsoAuth({
          authenticated: Boolean(e.data.authenticated ?? (role === 'admin' || role === 'user')),
          username: e.data.username || '',
          role,
          scopes,
          hasVipScope,
        });
      }
    };

    const handleThemeEvent = (e: any) => {
      const dark = e.detail?.theme === 'dark';
      setIsDark(dark);
      if (dark) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      }
    };

    const handleLangEvent = (e: any) => {
      const raw = e.detail?.lang || e.data?.lang;
      if (raw) {
        const isZh = raw.toLowerCase().startsWith('zh');
        setLang(isZh ? 'zh' : 'en');
        document.documentElement.setAttribute('lang', isZh ? 'zh-CN' : 'en');
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('b0-theme-change', handleThemeEvent);
    window.addEventListener('b0-lang-change', handleLangEvent);
    return () => {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('b0-theme-change', handleThemeEvent);
      window.removeEventListener('b0-lang-change', handleLangEvent);
    };
  }, []);

  const [activeTab, setActiveTab] = useState<'player' | 'gallery'>('player');
  const [filterConfig, setFilterConfig] = useState<PlayerFilterConfig>(loadSavedConfig);
  const [detectedWidth, setDetectedWidth] = useState<number>(() =>
    getOptimalStreamWidth(loadSavedConfig().qualityMode)
  );
  const [wallpaperPool, setWallpaperPool] = useState<WallpaperItem[]>(() =>
    adaptCuratedPool(CURATED_WALLPAPERS, getOptimalStreamWidth(loadSavedConfig().qualityMode))
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [scaleMode, setScaleMode] = useState<ScaleMode>('auto');
  const [currentSound, setCurrentSound] = useState<SoundType>('off');
  const [volume, setVolume] = useState(0.5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFilmstrip, setShowFilmstrip] = useState(true);
  const [uiVisible, setUiVisible] = useState(true);
  const uiVisibleRef = useRef(uiVisible);
  useEffect(() => {
    uiVisibleRef.current = uiVisible;
  }, [uiVisible]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isFetchingPool, setIsFetchingPool] = useState(false);
  const [isCurrentImageLoaded, setIsCurrentImageLoaded] = useState(false);

  // Favorites, Tombstones & History State
  const [favorites, setFavorites] = useState<WallpaperItem[]>(loadLocalFavorites);
  const [deletedFavIds, setDeletedFavIds] = useState<string[]>(loadDeletedFavoriteIds);
  const [history, setHistory] = useState<WallpaperItem[]>(loadLocalHistory);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);

  // Toast & Heart Burst State
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [heartBurst, setHeartBurst] = useState<{ x: number; y: number; active: boolean; isFav: boolean } | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 2400);
  }, []);

  const favoriteIds = useMemo(() => new Set(favorites.map((f) => f.id)), [favorites]);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState<boolean>(false);
  const [ssoAuth, setSsoAuth] = useState<SsoAuthState>({
    authenticated: false,
    username: '',
    role: 'guest',
    scopes: [],
    hasVipScope: false,
  });

  useEffect(() => {
    fetchSsoAuthMe().then((res) => setSsoAuth(res));
    if (window.parent && window.parent !== window) {
      try {
        window.parent.postMessage({ type: 'B0_REQUEST_AUTH' }, '*');
      } catch {}
    }
  }, []);

  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefillingRef = useRef<boolean>(false);

  const cloudPageRef = useRef<number>(1);
  const seedRef = useRef<string>(Math.random().toString(36).substring(2, 8));

  const currentWallpaper = wallpaperPool[currentIndex] || CURATED_WALLPAPERS[0];
  const isCurrentFavorited = currentWallpaper ? favoriteIds.has(currentWallpaper.id) : false;

  // Record history footprint whenever currentWallpaper changes
  useEffect(() => {
    if (!currentWallpaper) return;
    setHistory((prev) => {
      const next = [currentWallpaper, ...prev.filter((item) => item.id !== currentWallpaper.id)].slice(0, 200);
      saveLocalHistory(next);
      return next;
    });
  }, [currentWallpaper?.id]);

  const isVipUnlocked = isAdminUnlocked || ssoAuth.hasVipScope;
  const isCloudSyncEnabled = isAdminUnlocked || ssoAuth.authenticated;

  // Cloud Sync: Pull & Merge on unlock or mount (All authenticated SSO users OR VIP_PASSCODE)
  const handleSyncWithCloud = useCallback(
    async (passcode: string, currentFavs: WallpaperItem[], currentDeleted: string[], silent = false) => {
      if (!passcode.trim() && !ssoAuth.authenticated && !isAdminUnlocked) return;
      setIsSyncingCloud(true);
      const synced = await pushCloudSync(passcode, {
        favorites: currentFavs,
        deletedFavoriteIds: currentDeleted,
      });
      setIsSyncingCloud(false);
      if (synced && Array.isArray(synced.favorites)) {
        setFavorites(synced.favorites);
        saveLocalFavorites(synced.favorites);
        if (Array.isArray(synced.deletedFavoriteIds)) {
          setDeletedFavIds(synced.deletedFavoriteIds);
          saveDeletedFavoriteIds(synced.deletedFavoriteIds);
        }
        if (!silent) {
          showToast(`☁️ 云端收藏夹已同步 (${synced.favorites.length} 张)`);
        }
      }
    },
    [showToast, ssoAuth.authenticated, isAdminUnlocked]
  );

  useEffect(() => {
    const trimmed = filterConfig.passcodeOrKey.trim();
    if (!trimmed && !ssoAuth.authenticated) {
      setIsAdminUnlocked(false);
      return;
    }
    let cancelled = false;

    const runCheckAndSync = async () => {
      let passcodeOk = false;
      if (trimmed) {
        passcodeOk = await verifyAdminPasscode(trimmed);
        if (cancelled) return;
        setIsAdminUnlocked(passcodeOk);

        if (!passcodeOk) {
          setFilterConfig((prev) => {
            const next = { ...prev, passcodeOrKey: '', adultMode: false };
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch {}
            return next;
          });
        }
      } else {
        setIsAdminUnlocked(false);
      }

      if (!ssoAuth.authenticated && !passcodeOk) return;

      const remote = await fetchCloudSync(passcodeOk ? trimmed : '');
      if (cancelled) return;
      if (remote && Array.isArray(remote.favorites) && remote.favorites.length > 0) {
        const localFavs = loadLocalFavorites();
        const delSet = new Set([...loadDeletedFavoriteIds(), ...(remote.deletedFavoriteIds || [])]);
        const merged: WallpaperItem[] = [];
        const seen = new Set<string>();
        for (const item of [...localFavs, ...remote.favorites]) {
          if (!item || !item.id || seen.has(item.id) || delSet.has(item.id)) continue;
          seen.add(item.id);
          merged.push(item);
        }
        setFavorites(merged);
        saveLocalFavorites(merged);
      }
    };

    void runCheckAndSync();
    return () => {
      cancelled = true;
    };
  }, [filterConfig.passcodeOrKey, filterConfig.adultMode, ssoAuth.authenticated, ssoAuth.hasVipScope]);

  // Build sliding-window preload list (next 3 items in queue)
  const preloadWallpapers = useMemo(() => {
    if (wallpaperPool.length <= 1) return [];
    const list: WallpaperItem[] = [];
    const count = Math.min(3, wallpaperPool.length - 1);
    for (let i = 1; i <= count; i++) {
      list.push(wallpaperPool[(currentIndex + i) % wallpaperPool.length]);
    }
    return list;
  }, [wallpaperPool, currentIndex]);

  // Fetch remote wallpapers via Cloudflare Worker API with screen-adaptive width & endless pagination
  const fetchCloudWallpapers = useCallback(
    async (cfg: PlayerFilterConfig, appendMode: boolean = false) => {
      if (cfg.category === 'favorites') {
        const favPool = loadLocalFavorites();
        if (favPool.length > 0) {
          setWallpaperPool(favPool);
          setCurrentIndex(0);
          setIsFetchingPool(false);
          return;
        }
      } else if (cfg.category === 'history') {
        const histPool = loadLocalHistory();
        if (histPool.length > 0) {
          setWallpaperPool(histPool);
          setCurrentIndex(0);
          setIsFetchingPool(false);
          return;
        }
      }

      if (!appendMode) {
        setIsFetchingPool(true);
        cloudPageRef.current = 1;
        seedRef.current = Math.random().toString(36).substring(2, 8);
      } else {
        cloudPageRef.current += 1;
      }

      const streamW = getOptimalStreamWidth(cfg.qualityMode || 'auto');
      setDetectedWidth(streamW || 3840);

      const rawLocalFiltered =
        cfg.category === 'all' || cfg.category === 'custom' || cfg.category === 'recommend'
          ? CURATED_WALLPAPERS
          : CURATED_WALLPAPERS.filter((w) => w.category === cfg.category);

      const localFiltered = adaptCuratedPool(
        rawLocalFiltered.length > 0 ? rawLocalFiltered : CURATED_WALLPAPERS,
        streamW
      );

      try {
        const isAuth = isVipUnlocked || cfg.passcodeOrKey.trim().length > 0;
        const effectiveAdult = cfg.adultMode && isAuth;
        let queryParam = translateQuery(cfg.customQuery);
        if (cfg.category === 'recommend') {
          const recQueries = generatePersonalizedQueries(loadLocalFavorites(), loadLocalHistory());
          queryParam = recQueries.slice(0, 6).join(',');
        }

        const params = new URLSearchParams({
          category: cfg.category,
          q: queryParam,
          adult: effectiveAdult ? '1' : '0',
          purity: effectiveAdult ? cfg.purityMode : '100',
          key: cfg.passcodeOrKey.trim(),
          yande: cfg.enableYande ? '1' : '0',
          konachan: cfg.enableKonachan ? '1' : '0',
          w: String(streamW),
          page: String(cloudPageRef.current),
          seed: seedRef.current,
        });

        const res = await fetch(`/api/wallpapers?${params.toString()}`, { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          if (json && Array.isArray(json.data) && json.data.length > 0) {
            if (appendMode) {
              setWallpaperPool((prev) => {
                const existingIds = new Set(prev.map((item) => item.id));
                const freshItems = json.data.filter(
                  (item: WallpaperItem) => !existingIds.has(item.id)
                );
                return freshItems.length > 0 ? [...prev, ...freshItems] : prev;
              });
            } else {
              // In adult mode, strictly use returned adult online items without local SFW filler
              const initialPool = effectiveAdult
                ? json.data
                : (json.data.length >= 10 ? json.data : [...json.data, ...localFiltered]);
              setWallpaperPool(initialPool);
              setCurrentIndex(0);

              // Eagerly prefetch page 2 in background so user has a generous initial buffer of 35-50+ wallpapers
              if (json.data.length < 35) {
                setTimeout(() => {
                  if (!isRefillingRef.current) {
                    isRefillingRef.current = true;
                    fetchCloudWallpapers(cfg, true);
                  }
                }, 600);
              }
            }
            setIsFetchingPool(false);
            isRefillingRef.current = false;
            return;
          }
        }
      } catch {
        // Fallback to adapted local pool if offline
      }

      if (!appendMode) {
        setWallpaperPool(localFiltered);
        setCurrentIndex(0);
      }
      setIsFetchingPool(false);
      isRefillingRef.current = false;
    },
    [isVipUnlocked]
  );

  // Initial fetch on mount
  useEffect(() => {
    fetchCloudWallpapers(filterConfig, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-Refill when approaching end of pool (<= 5 items remaining)
  useEffect(() => {
    if (
      wallpaperPool.length > 4 &&
      currentIndex >= wallpaperPool.length - 5 &&
      !isRefillingRef.current &&
      !isFetchingPool
    ) {
      isRefillingRef.current = true;
      fetchCloudWallpapers(filterConfig, true);
    }
  }, [currentIndex, wallpaperPool.length, filterConfig, isFetchingPool, fetchCloudWallpapers]);

  // Update config & persist to localStorage
  const handleUpdateConfig = useCallback(
    (newConfig: PlayerFilterConfig, triggerFetch: boolean = false) => {
      const sanitizedConfig: PlayerFilterConfig = {
        ...newConfig,
        adultMode: newConfig.adultMode && (isVipUnlocked || newConfig.passcodeOrKey.trim().length > 0),
      };
      setFilterConfig(sanitizedConfig);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedConfig));
      } catch {
        // Ignore storage quota errors
      }
      if (triggerFetch) {
        fetchCloudWallpapers(sanitizedConfig, false);
      }
    },
    [fetchCloudWallpapers, isVipUnlocked]
  );

  // Next / Prev actions with proactive auto-fetch before pool exhausts
  const handleNext = useCallback(() => {
    setIsCurrentImageLoaded(false);
    setCurrentIndex((prev) => {
      const nextIdx = prev + 1;
      if (nextIdx >= wallpaperPool.length - 4 && !isRefillingRef.current && !isFetchingPool) {
        isRefillingRef.current = true;
        fetchCloudWallpapers(filterConfig, true);
      }
      return nextIdx % Math.max(1, wallpaperPool.length);
    });
  }, [wallpaperPool.length, filterConfig, isFetchingPool, fetchCloudWallpapers]);

  const handlePrev = useCallback(() => {
    setIsCurrentImageLoaded(false);
    setCurrentIndex(
      (prev) => (prev - 1 + Math.max(1, wallpaperPool.length)) % Math.max(1, wallpaperPool.length)
    );
  }, [wallpaperPool.length]);

  // Broken image handler: remove failed item from pool and advance immediately
  const handleImageError = useCallback(
    (failedId: string) => {
      setWallpaperPool((prev) => {
        if (prev.length <= 1) return adaptCuratedPool(CURATED_WALLPAPERS, detectedWidth);
        const filtered = prev.filter((item) => item.id !== failedId);
        return filtered.length > 0 ? filtered : adaptCuratedPool(CURATED_WALLPAPERS, detectedWidth);
      });
      setCurrentIndex((prev) => prev % Math.max(1, wallpaperPool.length - 1));
    },
    [wallpaperPool.length, detectedWidth]
  );

  // Smart Auto-Play Timer: Only starts counting 22s AFTER the current image has rendered
  useEffect(() => {
    if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);

    if (!autoPlay || activeTab !== 'player' || isCategoryModalOpen || !isCurrentImageLoaded) {
      return;
    }

    autoPlayTimerRef.current = setTimeout(() => {
      handleNext();
    }, 22000);

    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
    };
  }, [autoPlay, activeTab, isCategoryModalOpen, isCurrentImageLoaded, handleNext]);

  // Mouse idle detection to hide UI controls in player mode
  const resetIdleTimer = useCallback(() => {
    setUiVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    if (activeTab === 'player' && !isCategoryModalOpen) {
      hideTimerRef.current = setTimeout(() => {
        setUiVisible(false);
      }, 3500);
    }
  }, [activeTab, isCategoryModalOpen]);

  // Only extends idle timer if UI is already visible; keeps navigation quiet when UI is hidden
  const extendIdleTimerIfVisible = useCallback(() => {
    if (!uiVisibleRef.current) return;
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    if (activeTab === 'player' && !isCategoryModalOpen) {
      hideTimerRef.current = setTimeout(() => {
        setUiVisible(false);
      }, 3500);
    }
  }, [activeTab, isCategoryModalOpen]);

  // Toggle Zen Mode (pure wallpaper view vs normal UI)
  const handleToggleUi = useCallback(() => {
    if (uiVisibleRef.current) {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      setUiVisible(false);
    } else {
      resetIdleTimer();
    }
  }, [resetIdleTimer]);

  useEffect(() => {
    const handleMouseMove = () => resetIdleTimer();
    window.addEventListener('mousemove', handleMouseMove);
    resetIdleTimer();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [resetIdleTimer]);

  // Toggle Scale Mode (Auto -> Fit -> Cover)
  const toggleScaleMode = useCallback(() => {
    setScaleMode((prev) => {
      if (prev === 'auto') return 'fit';
      if (prev === 'fit') return 'cover';
      return 'auto';
    });
  }, []);

  // Save any wallpaper item (Direct safe download)
  const handleSaveWallpaper = useCallback(
    async (targetItem?: WallpaperItem) => {
      const item = targetItem || currentWallpaper;
      if (!item) return;
      const downloadUrl = item.rawUrl || item.url;
      const cleanSource = (item.source || 'Wallpaper').replace(/[^a-zA-Z0-9]/g, '');
      const filename = `Ambient4K_${cleanSource}_${item.id}.jpg`;
      showToast(`⬇️ 正在下载 4K 原图: ${filename}`);
      try {
        const blob = await fetchSafeBlob(downloadUrl);
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
      } catch {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.target = '_blank';
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    },
    [currentWallpaper, showToast]
  );

  // Favorite / Unfavorite Toggle with Heart Burst & Cloud Sync
  const handleToggleFavorite = useCallback(
    (targetItem?: WallpaperItem, clickPos?: { x: number; y: number }) => {
      const item = targetItem || currentWallpaper;
      if (!item) return;

      const isAlreadyFav = favorites.some((f) => f.id === item.id);
      let nextFavs: WallpaperItem[];
      let nextDeleted = [...deletedFavIds];

      if (isAlreadyFav) {
        nextFavs = favorites.filter((f) => f.id !== item.id);
        if (!nextDeleted.includes(item.id)) nextDeleted.push(item.id);
        showToast('💔 已取消收藏');
      } else {
        const enriched: WallpaperItem = { ...item, dateAdded: Date.now() };
        nextFavs = [enriched, ...favorites.filter((f) => f.id !== item.id)];
        nextDeleted = nextDeleted.filter((id) => id !== item.id);
        showToast('❤️ 已加入收藏夹');
      }

      setFavorites(nextFavs);
      saveLocalFavorites(nextFavs);
      setDeletedFavIds(nextDeleted);
      saveDeletedFavoriteIds(nextDeleted);

      if (activeTab === 'player') {
        const pos = clickPos || { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        setHeartBurst({ x: pos.x, y: pos.y, active: true, isFav: !isAlreadyFav });
        setTimeout(() => setHeartBurst(null), 700);
      }

      if (isCloudSyncEnabled) {
        handleSyncWithCloud(filterConfig.passcodeOrKey, nextFavs, nextDeleted, true);
      }
    },
    [currentWallpaper, favorites, deletedFavIds, activeTab, filterConfig.passcodeOrKey, isCloudSyncEnabled, showToast, handleSyncWithCloud]
  );

  // Batch Export Favorites to Local Directory (File System Access API or fallback)
  const handleBatchDownloadFavorites = useCallback(async () => {
    if (favorites.length === 0) return;
    const anyWin = window as any;
    if (typeof anyWin.showDirectoryPicker === 'function') {
      try {
        const dirHandle = await anyWin.showDirectoryPicker({ mode: 'readwrite' });
        showToast(`📂 开始批量导出 ${favorites.length} 张 4K 壁纸...`);
        let success = 0;
        for (const item of favorites) {
          try {
            const downloadUrl = item.rawUrl || item.url;
            const blob = await fetchSafeBlob(downloadUrl);
            const cleanSource = (item.source || 'Wallpaper').replace(/[^a-zA-Z0-9]/g, '');
            const fileName = `Ambient4K_${cleanSource}_${item.id}.jpg`;
            const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
            success += 1;
          } catch {
            // continue next
          }
        }
        showToast(`✅ 成功导出 ${success} 张 4K 壁纸至所选文件夹！`);
        return;
      } catch {
        // User cancelled directory picker
        return;
      }
    }
    // Fallback: export JSON backup if browser doesn't support showDirectoryPicker
    showToast('当前浏览器不支持目录直写，建议用 Chrome/Edge 或导出 JSON 备份');
  }, [favorites, showToast]);

  const handleExportFavoritesJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(favorites, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Ambient4K_Favorites_${favorites.length}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    showToast(`📦 已导出 ${favorites.length} 张收藏备份`);
  }, [favorites, showToast]);

  const handleImportFavoritesJson = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const parsed = JSON.parse(String(reader.result));
          const list: WallpaperItem[] = Array.isArray(parsed)
            ? parsed
            : Array.isArray(parsed?.favorites)
              ? parsed.favorites
              : [];
          if (list.length > 0) {
            const seen = new Set<string>();
            const merged: WallpaperItem[] = [];
            for (const item of [...list, ...favorites]) {
              if (item && item.id && !seen.has(item.id)) {
                seen.add(item.id);
                merged.push(item);
              }
            }
            setFavorites(merged);
            saveLocalFavorites(merged);
            showToast(`✅ 成功导入并合并 ${merged.length} 张收藏壁纸`);
            if (isCloudSyncEnabled) {
              handleSyncWithCloud(filterConfig.passcodeOrKey, merged, deletedFavIds, true);
            }
          }
        } catch {
          showToast('⚠️ JSON 文件格式无法识别');
        }
      };
      reader.readAsText(file);
    },
    [favorites, deletedFavIds, filterConfig.passcodeOrKey, isCloudSyncEnabled, showToast, handleSyncWithCloud]
  );

  // Sound change handler
  const handleSoundChange = (sound: SoundType) => {
    setCurrentSound(sound);
    soundManager.play(sound);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    soundManager.setVolume(vol);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard shortcut listener (Aligned with Native App: Space = Favorite, P = Play/Pause, G = Gallery)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleToggleFavorite();
        extendIdleTimerIfVisible();
      } else if (e.code === 'KeyP') {
        e.preventDefault();
        setAutoPlay((prev) => {
          showToast(!prev ? '▶ 继续自动轮播' : '⏸ 已暂停轮播');
          return !prev;
        });
        extendIdleTimerIfVisible();
      } else if (e.code === 'KeyG') {
        e.preventDefault();
        setActiveTab((prev) => (prev === 'player' ? 'gallery' : 'player'));
        setUiVisible(true);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
        extendIdleTimerIfVisible();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
        extendIdleTimerIfVisible();
      } else if (e.code === 'KeyH') {
        e.preventDefault();
        handleToggleUi();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        toggleScaleMode();
        extendIdleTimerIfVisible();
      } else if (e.code === 'KeyD' || e.key === 'D' || e.key === 'd') {
        e.preventDefault();
        handleSaveWallpaper();
        extendIdleTimerIfVisible();
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        setIsCategoryModalOpen((prev) => !prev);
        setUiVisible(true);
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        fetchCloudWallpapers(filterConfig, false);
        extendIdleTimerIfVisible();
      } else if (e.code === 'Escape') {
        if (isCategoryModalOpen) {
          setIsCategoryModalOpen(false);
        } else if (activeTab === 'gallery') {
          setActiveTab('player');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleToggleFavorite,
    handleNext,
    handlePrev,
    extendIdleTimerIfVisible,
    handleToggleUi,
    activeTab,
    isCategoryModalOpen,
    fetchCloudWallpapers,
    filterConfig,
    toggleScaleMode,
    handleSaveWallpaper,
    showToast,
  ]);

  const handleSelectGalleryCategory = useCallback(
    (cat: CategoryType) => {
      handleUpdateConfig({ ...filterConfig, category: cat }, true);
    },
    [filterConfig, handleUpdateConfig]
  );

  const handlePlaySpecificWallpaper = useCallback(
    (item: WallpaperItem) => {
      const idx = wallpaperPool.findIndex((w) => w.id === item.id);
      if (idx >= 0) {
        setCurrentIndex(idx);
      } else {
        setWallpaperPool((prev) => [item, ...prev]);
        setCurrentIndex(0);
      }
      setAutoPlay(false);
      setActiveTab('player');
      resetIdleTimer();
    },
    [wallpaperPool, resetIdleTimer]
  );

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden select-none transition-colors duration-300 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#f5f5f7] text-[#1d1d1f]'
      }`}
    >
      {/* Top Toast Capsule */}
      {toastMsg && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] px-4 py-2 rounded-full bg-black/75 backdrop-blur-xl border border-white/15 text-xs font-semibold text-white shadow-2xl pointer-events-none animate-in fade-in zoom-in-95 duration-200">
          {toastMsg}
        </div>
      )}

      {/* Top Header Navigation */}
      <HeaderNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setUiVisible(true);
        }}
        favoritesCount={favorites.length}
        isAdminUnlocked={isCloudSyncEnabled}
        onOpenSettings={() => {
          setIsCategoryModalOpen(true);
          setUiVisible(true);
        }}
        uiVisible={activeTab === 'gallery' || uiVisible || isCategoryModalOpen}
        lang={lang}
      />

      {/* MODE 1: FULLSCREEN 4K AMBIENT PLAYER */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
          activeTab === 'player' ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'
        }`}
        onDoubleClick={(e) => {
          handleToggleFavorite(currentWallpaper, { x: e.clientX, y: e.clientY });
        }}
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (
            target === e.currentTarget ||
            target.tagName === 'IMG' ||
            target.classList.contains('absolute')
          ) {
            handleToggleUi();
          }
        }}
      >
        {/* Progressive Dual-Buffer + 3-Item Sliding Window Preloader Stage */}
        <WallpaperStage
          wallpaper={currentWallpaper}
          preloadWallpapers={preloadWallpapers}
          scaleMode={scaleMode}
          onImageReady={() => setIsCurrentImageLoaded(true)}
          onImageError={handleImageError}
          uiVisible={uiVisible}
        />

        {/* Heart Burst Animation Overlay */}
        {heartBurst && heartBurst.active && (
          <div
            className="fixed z-50 pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-ping"
            style={{ left: heartBurst.x, top: heartBurst.y }}
          >
            <Heart
              className={`w-20 h-20 drop-shadow-[0_0_25px_rgba(244,63,94,0.85)] ${
                heartBurst.isFav ? 'text-rose-500 fill-rose-500' : 'text-slate-300'
              }`}
            />
          </div>
        )}

        {/* Ambient Clock and Date Widget */}
        <ClockWidget currentWallpaper={currentWallpaper} visible={uiVisible} />

        {/* Bottom Filmstrip Scrubber (Above Player Controls) */}
        <div className="fixed bottom-20 left-0 right-0 z-40 pointer-events-none">
          <FilmstripScrubber
            items={wallpaperPool}
            currentIndex={currentIndex}
            favoriteIds={favoriteIds}
            onSelectIndex={(idx) => {
              setIsCurrentImageLoaded(false);
              setCurrentIndex(idx);
              extendIdleTimerIfVisible();
            }}
            visible={(uiVisible || isCategoryModalOpen) && showFilmstrip}
          />
        </div>

        {/* Floating Player Controls Bar */}
        <PlayerControls
          onPrev={handlePrev}
          onNext={handleNext}
          autoPlay={autoPlay}
          onToggleAutoPlay={() => setAutoPlay(!autoPlay)}
          isCurrentFavorited={isCurrentFavorited}
          onToggleFavorite={() => handleToggleFavorite(currentWallpaper)}
          showFilmstrip={showFilmstrip}
          onToggleFilmstrip={() => setShowFilmstrip((prev) => !prev)}
          currentSound={currentSound}
          onSoundChange={handleSoundChange}
          volume={volume}
          onVolumeChange={handleVolumeChange}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onOpenGallery={() => {
            setActiveTab('gallery');
            setUiVisible(true);
          }}
          filterConfig={filterConfig}
          onOpenCategoryModal={() => {
            setIsCategoryModalOpen(true);
            setUiVisible(true);
          }}
          onRefreshPool={() => fetchCloudWallpapers(filterConfig, false)}
          isFetchingPool={isFetchingPool}
          scaleMode={scaleMode}
          onToggleScaleMode={toggleScaleMode}
          onSaveCurrentImage={() => handleSaveWallpaper(currentWallpaper)}
          onToggleZenMode={handleToggleUi}
          uiVisible={uiVisible || isCategoryModalOpen}
          lang={lang}
        />
      </div>

      {/* Category & Admin Cloud Sync Settings Modal */}
      <CategorySettingsModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        config={filterConfig}
        onUpdateConfig={handleUpdateConfig}
        isFetching={isFetchingPool}
        poolCount={wallpaperPool.length}
        detectedWidth={detectedWidth}
        isAdminUnlocked={isAdminUnlocked}
        onAdminVerified={setIsAdminUnlocked}
        ssoAuth={ssoAuth}
      />

      {/* MODE 2: APPLE PHOTOS STYLE MULTI-IMAGE GALLERY & FAVORITES HUB */}
      <div
        className={`absolute inset-0 overflow-hidden transition-opacity duration-500 ease-in-out ${
          activeTab === 'gallery' ? 'opacity-100 pointer-events-auto z-20' : 'opacity-0 pointer-events-none z-0'
        }`}
      >
        <GalleryView
          items={wallpaperPool}
          favorites={favorites}
          history={history}
          favoriteIds={favoriteIds}
          filterConfig={filterConfig}
          isAdminUnlocked={isCloudSyncEnabled}
          isSyncingCloud={isSyncingCloud}
          isFetchingPool={isFetchingPool}
          onSelectCategory={handleSelectGalleryCategory}
          onPlayWallpaper={handlePlaySpecificWallpaper}
          onToggleFavorite={(item) => handleToggleFavorite(item)}
          onDownloadWallpaper={(item) => handleSaveWallpaper(item)}
          onRefreshCategory={() => fetchCloudWallpapers(filterConfig, false)}
          onLoadMore={() => {
            if (!isRefillingRef.current && !isFetchingPool) {
              isRefillingRef.current = true;
              fetchCloudWallpapers(filterConfig, true);
            }
          }}
          onClearHistory={() => {
            setHistory([]);
            saveLocalHistory([]);
            showToast('🗑️ 已清空历史足迹');
          }}
          onManualCloudSync={() =>
            handleSyncWithCloud(filterConfig.passcodeOrKey, favorites, deletedFavIds, false)
          }
          onExportFavoritesJson={handleExportFavoritesJson}
          onImportFavoritesJson={handleImportFavoritesJson}
          onBatchDownloadFavorites={handleBatchDownloadFavorites}
          onOpenSettingsModal={() => setIsCategoryModalOpen(true)}
          onBackToPlayer={() => setActiveTab('player')}
        />
      </div>
    </div>
  );
}

export default App;

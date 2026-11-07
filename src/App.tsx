import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { CURATED_WALLPAPERS } from './data/wallpapers';
import { HeaderNav } from './components/HeaderNav';
import { ClockWidget } from './components/ClockWidget';
import { PlayerControls } from './components/PlayerControls';
import { ShowcaseSection } from './components/ShowcaseSection';
import { CategorySettingsModal } from './components/CategorySettingsModal';
import { WallpaperStage, ScaleMode } from './components/WallpaperStage';
import { soundManager } from './services/soundSynthesizer';
import { SoundType, PlayerFilterConfig, WallpaperItem, QualityMode } from './types';

const STORAGE_KEY = 'ambient4k_web_filter_v2';

const DEFAULT_FILTER_CONFIG: PlayerFilterConfig = {
  category: 'all',
  customQuery: '',
  adultMode: false,
  purityMode: '111',
  passcodeOrKey: '',
  enableYande: true,
  enableKonachan: true,
  qualityMode: 'auto',
};

function isPasscodeValid(passcodeOrKey: string): boolean {
  const trimmed = (passcodeOrKey || '').trim();
  return trimmed === 'bin0sky.tech' || trimmed.length >= 16;
}

function loadSavedConfig(): PlayerFilterConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FILTER_CONFIG;
    const parsed: PlayerFilterConfig = { ...DEFAULT_FILTER_CONFIG, ...JSON.parse(raw) };
    if (parsed.adultMode && !isPasscodeValid(parsed.passcodeOrKey)) {
      parsed.adultMode = false;
    }
    return parsed;
  } catch {
    return DEFAULT_FILTER_CONFIG;
  }
}

// IndexedDB Directory Handle Persistence (Remembers user's chosen wallpaper folder across saves)
const IDB_NAME = 'Ambient4K_FS_DB';
const IDB_STORE = 'fs_handles';
const IDB_KEY = 'saved_directory';

function openHandleDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) return reject(new Error('IndexedDB not supported'));
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(IDB_STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getStoredDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  try {
    const db = await openHandleDB();
    return new Promise((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(IDB_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function storeDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  try {
    const db = await openHandleDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      const req = store.put(handle, IDB_KEY);
      req.onsuccess = () => resolve(undefined);
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Ignore storage errors
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

  const [activeTab, setActiveTab] = useState<'player' | 'showcase'>('player');
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
  const [uiVisible, setUiVisible] = useState(true);
  const uiVisibleRef = useRef(uiVisible);
  useEffect(() => {
    uiVisibleRef.current = uiVisible;
  }, [uiVisible]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isFetchingPool, setIsFetchingPool] = useState(false);
  const [isCurrentImageLoaded, setIsCurrentImageLoaded] = useState(false);

  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefillingRef = useRef<boolean>(false);

  const cloudPageRef = useRef<number>(1);
  const seedRef = useRef<string>(Math.random().toString(36).substring(2, 8));

  const savedDirectoryHandleRef = useRef<any>(null);
  const [savedDirName, setSavedDirName] = useState<string | null>(null);

  // Load remembered directory handle on initial mount
  useEffect(() => {
    getStoredDirectoryHandle().then((handle) => {
      if (handle) {
        savedDirectoryHandleRef.current = handle;
        setSavedDirName(handle.name);
      }
    });
  }, []);

  const currentWallpaper = wallpaperPool[currentIndex] || CURATED_WALLPAPERS[0];

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
        cfg.category === 'all' || cfg.category === 'custom'
          ? CURATED_WALLPAPERS
          : CURATED_WALLPAPERS.filter((w) => w.category === cfg.category);

      const localFiltered = adaptCuratedPool(
        rawLocalFiltered.length > 0 ? rawLocalFiltered : CURATED_WALLPAPERS,
        streamW
      );

      try {
        const isAuth = isPasscodeValid(cfg.passcodeOrKey);
        const effectiveAdult = cfg.adultMode && isAuth;
        const params = new URLSearchParams({
          category: cfg.category,
          q: cfg.customQuery,
          adult: effectiveAdult ? '1' : '0',
          purity: effectiveAdult ? cfg.purityMode : '100',
          key: cfg.passcodeOrKey.trim(),
          yande: cfg.enableYande ? '1' : '0',
          konachan: cfg.enableKonachan ? '1' : '0',
          w: String(streamW),
          page: String(cloudPageRef.current),
          seed: seedRef.current,
        });

        const res = await fetch(`/api/wallpapers?${params.toString()}`);
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
    []
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
        adultMode: newConfig.adultMode && isPasscodeValid(newConfig.passcodeOrKey),
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
    [fetchCloudWallpapers]
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

  const [downloadNotice, setDownloadNotice] = useState<{
    text: string;
    dirName?: string;
  } | null>(null);

  // Save current wallpaper (Prompts once for folder selection, subsequent saves are instant and direct)
  const handleSaveCurrentImage = useCallback(
    async (forcePickNewFolder: boolean = false) => {
      if (!currentWallpaper) return;
      const downloadUrl = currentWallpaper.rawUrl || currentWallpaper.url;
      const cleanSource = (currentWallpaper.source || 'Wallpaper').replace(/[^a-zA-Z0-9]/g, '');
      const filename = `Ambient4K_${cleanSource}_${currentWallpaper.id}.jpg`;

      // 1. Modern File System Access API: Directory Picker (Chrome / Edge / Opera)
      if ('showDirectoryPicker' in window) {
        try {
          let dirHandle = savedDirectoryHandleRef.current;

          // If first time or user pressed Shift+D / clicked "更换文件夹", prompt for directory
          if (forcePickNewFolder || !dirHandle) {
            setDownloadNotice({ text: '请选择保存壁纸的文件夹（仅需指定一次，后续按 D 键静默存入）...' });
            dirHandle = await (window as any).showDirectoryPicker({
              mode: 'readwrite',
              startIn: 'downloads',
            });
            savedDirectoryHandleRef.current = dirHandle;
            setSavedDirName(dirHandle.name);
            await storeDirectoryHandle(dirHandle);
          } else {
            // Verify permission without repeatedly popping up the picker if denied
            let perm = 'denied';
            try {
              perm = await dirHandle.queryPermission({ mode: 'readwrite' });
              if (perm !== 'granted') {
                perm = await dirHandle.requestPermission({ mode: 'readwrite' });
              }
            } catch {
              // Ignore gesture requirement errors
            }
            if (perm !== 'granted') {
              throw new Error('Directory permission not granted, falling back to direct download');
            }
          }

          setDownloadNotice({ text: `正在保存到「${dirHandle.name}」...` });
          const blob = await fetchSafeBlob(downloadUrl);
          const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();

          setDownloadNotice({
            text: `✓ 已保存至文件夹「${dirHandle.name}」`,
            dirName: dirHandle.name,
          });
          setTimeout(() => setDownloadNotice(null), 4000);
          return;
        } catch (err: any) {
          if (err?.name === 'AbortError') {
            setDownloadNotice(null);
            return; // User cancelled picker
          }
          // If filesystem access encounters issues, fall through to safe blob download
        }
      }

      // 2. Cross-browser fallback: direct safe Blob download (NEVER navigates current tab away!)
      try {
        setDownloadNotice({ text: '正在下载 4K 原图...' });
        const blob = await fetchSafeBlob(downloadUrl);
        const blobUrl = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
        setDownloadNotice({ text: '✓ 已成功保存到下载目录！' });
        setTimeout(() => setDownloadNotice(null), 3500);
      } catch (dlErr: any) {
        // Last-resort fallback: open in a NEW window/tab so current ambient player is never lost
        window.open(downloadUrl, '_blank');
        setDownloadNotice({ text: '✓ 已在新窗口打开原图下载！' });
        setTimeout(() => setDownloadNotice(null), 3500);
      }
    },
    [currentWallpaper]
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

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setAutoPlay((prev) => !prev);
        extendIdleTimerIfVisible();
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
      } else if (e.code === 'KeyD') {
        e.preventDefault();
        handleSaveCurrentImage(e.shiftKey);
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
        } else if (activeTab === 'showcase') {
          setActiveTab('player');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleNext,
    handlePrev,
    extendIdleTimerIfVisible,
    handleToggleUi,
    activeTab,
    isCategoryModalOpen,
    fetchCloudWallpapers,
    filterConfig,
    toggleScaleMode,
    handleSaveCurrentImage,
  ]);

  // Download macOS Client trigger
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/Ambient4K_Universal_macOS13.zip';
    link.download = 'Ambient4K_Universal_macOS13.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`relative w-screen h-screen overflow-hidden select-none transition-colors duration-300 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-[#f5f5f7] text-[#1d1d1f]'
    }`}>
      {/* Top Header Navigation */}
      <HeaderNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setUiVisible(true);
        }}
        onDownloadClick={handleDownload}
        uiVisible={activeTab === 'showcase' || uiVisible || isCategoryModalOpen}
        lang={lang}
      />

      {/* MODE 1: FULLSCREEN 4K AMBIENT PLAYER */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
          activeTab === 'player' ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'
        }`}
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

        {/* Ambient Clock and Date Widget */}
        <ClockWidget currentWallpaper={currentWallpaper} visible={uiVisible} />

        {/* Floating Player Controls Bar */}
        <PlayerControls
          onPrev={handlePrev}
          onNext={handleNext}
          autoPlay={autoPlay}
          onToggleAutoPlay={() => setAutoPlay(!autoPlay)}
          currentSound={currentSound}
          onSoundChange={handleSoundChange}
          volume={volume}
          onVolumeChange={handleVolumeChange}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onOpenShowcase={() => {
            setActiveTab('showcase');
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
          onSaveCurrentImage={() => handleSaveCurrentImage(false)}
          savedDirName={savedDirName}
          onToggleZenMode={handleToggleUi}
          uiVisible={uiVisible || isCategoryModalOpen}
          lang={lang}
        />
      </div>

      {/* Floating Download Toast / Notice */}
      {downloadNotice && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-xs text-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="font-medium">{downloadNotice.text}</span>
          {downloadNotice.dirName && (
            <button
              onClick={() => handleSaveCurrentImage(true)}
              className="ml-2 text-amber-300 hover:text-amber-200 underline cursor-pointer font-medium shrink-0"
              title="重新选择壁纸保存文件夹 (快捷键: Shift+D)"
            >
              更换文件夹
            </button>
          )}
        </div>
      )}

      {/* Category & Adult Mode Settings Modal */}
      <CategorySettingsModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        config={filterConfig}
        onUpdateConfig={handleUpdateConfig}
        isFetching={isFetchingPool}
        poolCount={wallpaperPool.length}
        detectedWidth={detectedWidth}
      />

      {/* MODE 2: CLIENT SHOWCASE & DOWNLOAD HUB */}
      <div
        className={`absolute inset-0 overflow-y-auto transition-opacity duration-500 ease-in-out ${
          activeTab === 'showcase' ? 'opacity-100 pointer-events-auto z-20' : 'opacity-0 pointer-events-none z-0'
        }`}
      >
        <ShowcaseSection onBackToPlayer={() => setActiveTab('player')} lang={lang} isDark={isDark} />
      </div>
    </div>
  );
}

export default App;

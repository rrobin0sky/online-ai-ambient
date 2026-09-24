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

function loadSavedConfig(): PlayerFilterConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FILTER_CONFIG;
    return { ...DEFAULT_FILTER_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_FILTER_CONFIG;
  }
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
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isFetchingPool, setIsFetchingPool] = useState(false);
  const [isCurrentImageLoaded, setIsCurrentImageLoaded] = useState(false);

  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefillingRef = useRef<boolean>(false);

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

  // Fetch remote wallpapers via Cloudflare Worker API with screen-adaptive width
  const fetchCloudWallpapers = useCallback(
    async (cfg: PlayerFilterConfig, appendMode: boolean = false) => {
      if (!appendMode) {
        setIsFetchingPool(true);
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
        const params = new URLSearchParams({
          category: cfg.category,
          q: cfg.customQuery,
          adult: cfg.adultMode ? '1' : '0',
          purity: cfg.adultMode ? cfg.purityMode : '100',
          key: cfg.passcodeOrKey.trim(),
          yande: cfg.enableYande ? '1' : '0',
          konachan: cfg.enableKonachan ? '1' : '0',
          w: String(streamW),
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
              const combined =
                cfg.adultMode && cfg.purityMode === '001'
                  ? json.data
                  : [...json.data, ...localFiltered];
              setWallpaperPool(combined);
              setCurrentIndex(0);
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

  // Auto-Refill when approaching end of pool (<= 3 items remaining)
  useEffect(() => {
    if (
      wallpaperPool.length > 4 &&
      currentIndex >= wallpaperPool.length - 3 &&
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
      setFilterConfig(newConfig);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      } catch {
        // Ignore storage quota errors
      }
      if (triggerFetch) {
        fetchCloudWallpapers(newConfig, false);
      }
    },
    [fetchCloudWallpapers]
  );

  // Next / Prev actions
  const handleNext = useCallback(() => {
    setIsCurrentImageLoaded(false);
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, wallpaperPool.length));
  }, [wallpaperPool.length]);

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

  // Save current wallpaper (Always downloads 100% uncompressed rawUrl!)
  const handleSaveCurrentImage = useCallback(() => {
    if (!currentWallpaper) return;
    const link = document.createElement('a');
    link.href = currentWallpaper.rawUrl || currentWallpaper.url;
    link.target = '_blank';
    link.download = `Ambient4K_${currentWallpaper.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [currentWallpaper]);

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
        resetIdleTimer();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
        resetIdleTimer();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
        resetIdleTimer();
      } else if (e.code === 'KeyF') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        toggleScaleMode();
        resetIdleTimer();
      } else if (e.code === 'KeyD') {
        e.preventDefault();
        handleSaveCurrentImage();
        resetIdleTimer();
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        setIsCategoryModalOpen((prev) => !prev);
        setUiVisible(true);
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        fetchCloudWallpapers(filterConfig, false);
        resetIdleTimer();
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
    resetIdleTimer,
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
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 select-none">
      {/* Top Header Navigation */}
      <HeaderNav
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setUiVisible(true);
        }}
        onDownloadClick={handleDownload}
        uiVisible={activeTab === 'showcase' || uiVisible || isCategoryModalOpen}
      />

      {/* MODE 1: FULLSCREEN 4K AMBIENT PLAYER */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
          activeTab === 'player' ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'
        }`}
      >
        {/* Progressive Dual-Buffer + 3-Item Sliding Window Preloader Stage */}
        <WallpaperStage
          wallpaper={currentWallpaper}
          preloadWallpapers={preloadWallpapers}
          scaleMode={scaleMode}
          onImageReady={() => setIsCurrentImageLoaded(true)}
          onImageError={handleImageError}
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
          onSaveCurrentImage={handleSaveCurrentImage}
          uiVisible={uiVisible || isCategoryModalOpen}
        />
      </div>

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
        <ShowcaseSection onBackToPlayer={() => setActiveTab('player')} />
      </div>
    </div>
  );
}

export default App;

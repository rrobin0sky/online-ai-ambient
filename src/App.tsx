import { useState, useEffect, useRef, useCallback } from 'react';
import { CURATED_WALLPAPERS } from './data/wallpapers';
import { HeaderNav } from './components/HeaderNav';
import { ClockWidget } from './components/ClockWidget';
import { PlayerControls } from './components/PlayerControls';
import { ShowcaseSection } from './components/ShowcaseSection';
import { CategorySettingsModal } from './components/CategorySettingsModal';
import { soundManager } from './services/soundSynthesizer';
import { SoundType, PlayerFilterConfig, WallpaperItem } from './types';

const STORAGE_KEY = 'ambient4k_web_filter_v1';

const DEFAULT_FILTER_CONFIG: PlayerFilterConfig = {
  category: 'all',
  customQuery: '',
  adultMode: false,
  purityMode: '111',
  passcodeOrKey: '',
  enableYande: true,
  enableKonachan: true,
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

export function App() {
  const [activeTab, setActiveTab] = useState<'player' | 'showcase'>('player');
  const [filterConfig, setFilterConfig] = useState<PlayerFilterConfig>(loadSavedConfig);
  const [wallpaperPool, setWallpaperPool] = useState<WallpaperItem[]>(CURATED_WALLPAPERS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [currentSound, setCurrentSound] = useState<SoundType>('off');
  const [volume, setVolume] = useState(0.5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isFetchingPool, setIsFetchingPool] = useState(false);

  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentWallpaper = wallpaperPool[currentIndex] || CURATED_WALLPAPERS[0];

  // Fetch remote 4K wallpapers via Cloudflare Worker API
  const fetchCloudWallpapers = useCallback(async (cfg: PlayerFilterConfig) => {
    setIsFetchingPool(true);

    // 1. Instant local fallback filter so UI feels immediate
    const localFiltered =
      cfg.category === 'all' || cfg.category === 'custom'
        ? CURATED_WALLPAPERS
        : CURATED_WALLPAPERS.filter((w) => w.category === cfg.category);

    try {
      const params = new URLSearchParams({
        category: cfg.category,
        q: cfg.customQuery,
        adult: cfg.adultMode ? '1' : '0',
        purity: cfg.adultMode ? cfg.purityMode : '100',
        key: cfg.passcodeOrKey.trim(),
        yande: cfg.enableYande ? '1' : '0',
        konachan: cfg.enableKonachan ? '1' : '0',
      });

      const res = await fetch(`/api/wallpapers?${params.toString()}`);
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.data) && json.data.length > 0) {
          // If pure NSFW mode is enabled, prioritize remote pool exclusively; otherwise blend with curated
          const combined =
            cfg.adultMode && cfg.purityMode === '001'
              ? json.data
              : [...json.data, ...(localFiltered.length > 0 ? localFiltered : CURATED_WALLPAPERS)];
          setWallpaperPool(combined);
          setCurrentIndex(0);
          setIsFetchingPool(false);
          return;
        }
      }
    } catch {
      // Fallback to curated local pool if offline or local dev without worker
    }

    setWallpaperPool(localFiltered.length > 0 ? localFiltered : CURATED_WALLPAPERS);
    setCurrentIndex(0);
    setIsFetchingPool(false);
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    fetchCloudWallpapers(filterConfig);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        fetchCloudWallpapers(newConfig);
      }
    },
    [fetchCloudWallpapers]
  );

  // Next / Prev actions
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % wallpaperPool.length);
  }, [wallpaperPool.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + wallpaperPool.length) % wallpaperPool.length);
  }, [wallpaperPool.length]);

  // Auto wallpaper rotation (every 22 seconds)
  useEffect(() => {
    if (!autoPlay || activeTab !== 'player' || isCategoryModalOpen) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      handleNext();
    }, 22000);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [autoPlay, activeTab, isCategoryModalOpen, handleNext]);

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
      } else if (e.code === 'KeyC') {
        e.preventDefault();
        setIsCategoryModalOpen((prev) => !prev);
        setUiVisible(true);
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        fetchCloudWallpapers(filterConfig);
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
  ]);

  // Download trigger
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/Ambient4K_Universal_macOS13.zip';
    link.download = 'Ambient4K_Universal_macOS13.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pre-render current, prev and next images for smooth crossfade without overloading DOM
  const visibleIndices = new Set([
    currentIndex,
    (currentIndex + 1) % wallpaperPool.length,
    (currentIndex - 1 + wallpaperPool.length) % wallpaperPool.length,
  ]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black select-none">
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
        {/* Layered Crossfade 4K Wallpaper Images */}
        {wallpaperPool.map((wp, idx) => {
          if (!visibleIndices.has(idx)) return null;
          const isCurrent = idx === currentIndex;
          return (
            <div
              key={wp.id}
              className={`absolute inset-0 transition-all duration-1000 transform ${
                isCurrent
                  ? 'opacity-100 scale-100 z-10'
                  : 'opacity-0 scale-105 pointer-events-none z-0'
              }`}
            >
              <img
                src={wp.url}
                alt={wp.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              {/* Subtle Vignette and dark film gradient for readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-black/55 pointer-events-none" />
            </div>
          );
        })}

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
          onRefreshPool={() => fetchCloudWallpapers(filterConfig)}
          isFetchingPool={isFetchingPool}
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

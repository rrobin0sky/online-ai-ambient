import { useState, useEffect, useRef, useCallback } from 'react';
import { CURATED_WALLPAPERS } from './data/wallpapers';
import { HeaderNav } from './components/HeaderNav';
import { ClockWidget } from './components/ClockWidget';
import { PlayerControls } from './components/PlayerControls';
import { ShowcaseSection } from './components/ShowcaseSection';
import { soundManager } from './services/soundSynthesizer';
import { SoundType } from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<'player' | 'showcase'>('player');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);
  const [currentSound, setCurrentSound] = useState<SoundType>('off');
  const [volume, setVolume] = useState(0.5);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [uiVisible, setUiVisible] = useState(true);

  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentWallpaper = CURATED_WALLPAPERS[currentIndex];

  // Next / Prev actions
  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % CURATED_WALLPAPERS.length);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + CURATED_WALLPAPERS.length) % CURATED_WALLPAPERS.length);
  }, []);

  // Auto wallpaper rotation (every 25 seconds)
  useEffect(() => {
    if (!autoPlay || activeTab !== 'player') {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    autoPlayTimerRef.current = setInterval(() => {
      handleNext();
    }, 25000);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [autoPlay, activeTab, handleNext]);

  // Mouse idle detection to hide UI controls in player mode
  const resetIdleTimer = useCallback(() => {
    setUiVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    if (activeTab === 'player') {
      hideTimerRef.current = setTimeout(() => {
        setUiVisible(false);
      }, 3500);
    }
  }, [activeTab]);

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
      } else if (e.code === 'Escape') {
        if (activeTab === 'showcase') {
          setActiveTab('player');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, resetIdleTimer, activeTab]);

  // Download trigger
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = '/Ambient4K_Universal_macOS13.zip';
    link.download = 'Ambient4K_Universal_macOS13.zip';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
        uiVisible={activeTab === 'showcase' || uiVisible}
      />

      {/* MODE 1: FULLSCREEN 4K AMBIENT PLAYER */}
      <div
        className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
          activeTab === 'player' ? 'opacity-100 pointer-events-auto z-10' : 'opacity-0 pointer-events-none z-0'
        }`}
      >
        {/* Layered Crossfade 4K Wallpaper Images */}
        {CURATED_WALLPAPERS.map((wp, idx) => (
          <div
            key={wp.id}
            className={`absolute inset-0 bg-cover bg-center transition-all duration-1000 transform ${
              idx === currentIndex
                ? 'opacity-100 scale-100 filter-none'
                : 'opacity-0 scale-105 pointer-events-none'
            }`}
            style={{
              backgroundImage: `url(${wp.url})`,
            }}
          >
            {/* Subtle Vignette and dark film gradient for readablity */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/60 pointer-events-none" />
            <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />
          </div>
        ))}

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
          uiVisible={uiVisible}
        />
      </div>

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

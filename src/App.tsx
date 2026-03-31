import { useState, useCallback, useEffect, useRef } from 'react';
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Repeat, Shuffle, Music,
} from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SearchPage from './components/SearchPage';
import Queue from './components/Queue';
import Library from './components/Library';
import Settings from './components/Settings';
import SetupGuide from './components/SetupGuide';
import { Track, QueueTrack, BotSettings, Page } from './types';
import { getTrackCover } from './api/vk';
import { formatDuration } from './utils/cn';
import { pingBackend, setBackendUrl } from './api/backend';

let _id = 0;
const genId = () => `q_${++_id}_${Date.now()}`;

const DEFAULT_SETTINGS: BotSettings = {
  vkToken: '',
  tgBotToken: '',
  tgChatId: '',
  tgApiId: '',
  tgApiHash: '',
  tgPhone: '',
  backendUrl: 'http://localhost:8080',
};

function loadSettings(): BotSettings {
  try {
    const s = localStorage.getItem('tgmusicbot_v3');
    return s ? { ...DEFAULT_SETTINGS, ...JSON.parse(s) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [settings, setSettings] = useState<BotSettings>(loadSettings);
  const [queue, setQueue] = useState<QueueTrack[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playedToday, setPlayedToday] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);

  const currentTrack = currentIndex >= 0 && currentIndex < queue.length
    ? queue[currentIndex]
    : null;

  // Пингуем бэкенд каждые 5 секунд
  useEffect(() => {
    const check = async () => {
      setBackendUrl(settings.backendUrl);
      const ok = await pingBackend();
      setBackendOnline(ok);
    };
    check();
    const t = setInterval(check, 5000);
    return () => clearInterval(t);
  }, [settings.backendUrl]);

  const saveSettings = useCallback((s: BotSettings) => {
    setSettings(s);
    localStorage.setItem('tgmusicbot_v3', JSON.stringify(s));
    setBackendUrl(s.backendUrl);
  }, []);

  const addToQueue = useCallback((track: Track) => {
    const q: QueueTrack = {
      ...track,
      queueId: genId(),
      addedAt: Date.now(),
      status: 'waiting',
    };
    setQueue(prev => [...prev, q]);
  }, []);

  const playNow = useCallback((track: Track) => {
    const q: QueueTrack = {
      ...track,
      queueId: genId(),
      addedAt: Date.now(),
      status: 'playing',
    };
    setQueue(prev => [q, ...prev]);
    setCurrentIndex(0);
    setIsPlaying(true);
  }, []);

  const handleNext = useCallback(() => {
    setQueue(prev => {
      if (prev.length === 0) return prev;
      const next = prev.slice(1);
      setCurrentIndex(next.length > 0 ? 0 : -1);
      if (next.length > 0) setPlayedToday(c => c + 1);
      setIsPlaying(next.length > 0);
      return next;
    });
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentIndex(i => Math.max(0, i - 1));
  }, []);

  const handleTrackEnd = useCallback(() => {
    setPlayedToday(c => c + 1);
    handleNext();
  }, [handleNext]);

  const removeFromQueue = useCallback((queueId: string) => {
    setQueue(prev => {
      const idx = prev.findIndex(t => t.queueId === queueId);
      const next = prev.filter(t => t.queueId !== queueId);
      if (idx === currentIndex) {
        setCurrentIndex(next.length > 0 ? Math.min(currentIndex, next.length - 1) : -1);
        setIsPlaying(next.length > 0);
      } else if (idx < currentIndex) {
        setCurrentIndex(c => c - 1);
      }
      return next;
    });
  }, [currentIndex]);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentIndex(-1);
    setIsPlaying(false);
  }, []);

  const moveUp = useCallback((idx: number) => {
    if (idx === 0) return;
    setQueue(prev => {
      const next = [...prev];
      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      return next;
    });
    if (idx === currentIndex) setCurrentIndex(c => c - 1);
    else if (idx - 1 === currentIndex) setCurrentIndex(c => c + 1);
  }, [currentIndex]);

  const moveDown = useCallback((idx: number) => {
    setQueue(prev => {
      if (idx >= prev.length - 1) return prev;
      const next = [...prev];
      [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      return next;
    });
    if (idx === currentIndex) setCurrentIndex(c => c + 1);
    else if (idx + 1 === currentIndex) setCurrentIndex(c => c - 1);
  }, [currentIndex]);

  const jumpTo = useCallback((idx: number) => {
    setCurrentIndex(idx);
    setIsPlaying(true);
  }, []);

  const togglePlay = useCallback(() => {
    if (currentIndex < 0 && queue.length > 0) {
      setCurrentIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(p => !p);
    }
  }, [currentIndex, queue.length]);

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      <Sidebar activePage={page} onNavigate={setPage} queueCount={queue.length} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {page === 'dashboard' && (
            <Dashboard
              currentTrack={currentTrack}
              queue={queue}
              isPlaying={isPlaying}
              settings={settings}
              playedToday={playedToday}
              backendOnline={backendOnline}
              onNext={handleNext}
              onPrev={handlePrev}
              onTogglePlay={togglePlay}
              onNavigate={setPage}
            />
          )}
          {page === 'search' && (
            <SearchPage
              backendUrl={settings.backendUrl}
              queue={queue}
              currentTrack={currentTrack}
              onAddToQueue={addToQueue}
              onPlayNow={playNow}
              backendOnline={backendOnline}
            />
          )}
          {page === 'queue' && (
            <Queue
              queue={queue}
              currentIndex={currentIndex}
              isPlaying={isPlaying}
              onRemove={removeFromQueue}
              onMoveUp={moveUp}
              onMoveDown={moveDown}
              onJumpTo={jumpTo}
              onClear={clearQueue}
            />
          )}
          {page === 'library' && (
            <Library
              onAddToQueue={addToQueue}
              onPlayNow={playNow}
              backendOnline={backendOnline}
            />
          )}
          {page === 'settings' && (
            <Settings settings={settings} onSave={saveSettings} />
          )}
          {page === 'setup' && (
            <SetupGuide settings={settings} />
          )}
        </main>

        <BottomPlayer
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onNext={handleNext}
          onPrev={handlePrev}
          onTogglePlay={togglePlay}
          onTrackEnd={handleTrackEnd}
        />
      </div>
    </div>
  );
}

// ─── Bottom Player ─────────────────────────────────────────────────────────────
interface BottomPlayerProps {
  currentTrack: QueueTrack | null;
  isPlaying: boolean;
  onNext: () => void;
  onPrev: () => void;
  onTogglePlay: () => void;
  onTrackEnd: () => void;
}

function BottomPlayer({ currentTrack, isPlaying, onNext, onPrev, onTogglePlay, onTrackEnd }: BottomPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => { setImgError(false); }, [currentTrack?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;
    const url = (currentTrack as unknown as Record<string, unknown>).url as string | undefined;
    if (url && audio.src !== url) { audio.src = url; audio.load(); }
  }, [currentTrack?.id]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) audio.play().catch(() => {});
    else audio.pause();
  }, [isPlaying, currentTrack?.id]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = muted ? 0 : volume;
  }, [volume, muted]);

  const cover = currentTrack ? getTrackCover(currentTrack) : '';

  const handleTimeUpdate = () => {
    const a = audioRef.current;
    if (!a) return;
    setCurrentTime(a.currentTime);
    setDuration(a.duration || 0);
    setProgress(a.duration ? (a.currentTime / a.duration) * 100 : 0);
  };

  const handleEnded = () => {
    if (repeat && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else {
      onTrackEnd();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const a = audioRef.current;
    if (!a || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - rect.left) / rect.width) * duration;
  };

  return (
    <div className="h-20 bg-zinc-900 border-t border-zinc-800 px-4 flex items-center gap-4 shrink-0">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onLoadedMetadata={handleTimeUpdate}
        crossOrigin="anonymous"
      />

      {/* Track info */}
      <div className="flex items-center gap-3 w-60 min-w-0">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0 flex items-center justify-center">
          {cover && !imgError ? (
            <img
              src={cover}
              alt={currentTrack?.title}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <Music size={20} className="text-zinc-600" />
          )}
        </div>
        {currentTrack ? (
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{currentTrack.title}</p>
            <p className="text-zinc-400 text-xs truncate">{currentTrack.artist}</p>
          </div>
        ) : (
          <div>
            <p className="text-zinc-500 text-sm">Нет трека</p>
            <p className="text-zinc-600 text-xs">Добавь треки в очередь</p>
          </div>
        )}
      </div>

      {/* Controls + Progress */}
      <div className="flex-1 flex flex-col items-center gap-1">
        <div className="flex items-center gap-5">
          <button
            onClick={() => setShuffle(s => !s)}
            className={`transition-colors hover:text-white ${shuffle ? 'text-violet-400' : 'text-zinc-500'}`}
          >
            <Shuffle size={16} />
          </button>
          <button onClick={onPrev} className="text-zinc-400 hover:text-white transition-colors">
            <SkipBack size={20} />
          </button>
          <button
            onClick={onTogglePlay}
            className="w-9 h-9 bg-violet-600 hover:bg-violet-500 text-white rounded-full flex items-center justify-center transition-colors"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
          </button>
          <button onClick={onNext} className="text-zinc-400 hover:text-white transition-colors">
            <SkipForward size={20} />
          </button>
          <button
            onClick={() => setRepeat(r => !r)}
            className={`transition-colors hover:text-white ${repeat ? 'text-violet-400' : 'text-zinc-500'}`}
          >
            <Repeat size={16} />
          </button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2 w-full max-w-lg">
          <span className="text-zinc-500 text-xs w-9 text-right">{formatDuration(Math.floor(currentTime))}</span>
          <div className="flex-1 h-1 bg-zinc-700 rounded-full cursor-pointer group" onClick={handleSeek}>
            <div
              className="h-full bg-violet-500 rounded-full group-hover:bg-violet-400 transition-colors relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <span className="text-zinc-500 text-xs w-9">{formatDuration(Math.floor(duration || currentTrack?.duration || 0))}</span>
        </div>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 w-32">
        <button onClick={() => setMuted(m => !m)} className="text-zinc-400 hover:text-white transition-colors">
          {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={muted ? 0 : volume}
          onChange={e => { setVolume(Number(e.target.value)); setMuted(false); }}
          className="flex-1 accent-violet-500 h-1"
        />
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Music, Clock, ListMusic, Zap, Radio, ExternalLink, Wifi, WifiOff } from 'lucide-react';
import { QueueTrack, BotSettings, Page } from '../types';
import { getTrackCover } from '../api/vk';
import { formatDuration, cn } from '../utils/cn';

interface DashboardProps {
  currentTrack: QueueTrack | null;
  queue: QueueTrack[];
  isPlaying: boolean;
  settings: BotSettings;
  playedToday: number;
  backendOnline: boolean;
  onNext: () => void;
  onPrev: () => void;
  onTogglePlay: () => void;
  onNavigate: (p: Page) => void;
}

export default function Dashboard({
  currentTrack, queue, isPlaying, settings, playedToday,
  backendOnline, onNext, onPrev, onTogglePlay, onNavigate,
}: DashboardProps) {
  const [uptime, setUptime] = useState(0);
  const [startTime] = useState(Date.now());
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setUptime(Math.floor((Date.now() - startTime) / 1000)), 1000);
    return () => clearInterval(t);
  }, [startTime]);

  useEffect(() => { setImgError(false); }, [currentTrack?.id]);

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const configured = !!(settings.tgBotToken && settings.backendUrl);
  const cover = currentTrack ? getTrackCover(currentTrack) : '';

  const stats = [
    { label: 'Сыграно сегодня', value: String(playedToday), icon: Music, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'В очереди', value: String(queue.length), icon: ListMusic, color: 'text-violet-400', bg: 'bg-violet-500/10' },
    { label: 'Uptime', value: formatUptime(uptime), icon: Clock, color: 'text-green-400', bg: 'bg-green-500/10' },
    {
      label: 'Бэкенд',
      value: backendOnline ? 'Онлайн' : 'Офлайн',
      icon: backendOnline ? Wifi : WifiOff,
      color: backendOnline ? 'text-green-400' : 'text-red-400',
      bg: backendOnline ? 'bg-green-500/10' : 'bg-red-500/10',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Дашборд</h1>
          <p className="text-zinc-400 text-sm mt-1">Управление Telegram Music Bot</p>
        </div>
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl border',
          backendOnline ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
        )}>
          <div className={cn('w-2 h-2 rounded-full', backendOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400')} />
          <span className={cn('text-sm font-medium', backendOnline ? 'text-green-400' : 'text-red-400')}>
            {backendOnline ? 'Бэкенд онлайн' : 'Бэкенд офлайн'}
          </span>
        </div>
      </div>

      {/* Backend offline warning */}
      {!backendOnline && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-start gap-3">
          <WifiOff size={18} className="text-red-400 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-red-300 font-medium text-sm">Python бэкенд не запущен</p>
            <p className="text-red-400/70 text-xs mt-1">
              Запусти <code className="bg-red-900/40 px-1.5 py-0.5 rounded text-red-300">python backend.py</code> на своём сервере.
              Полный код и инструкция в разделе{' '}
              <button onClick={() => onNavigate('setup')} className="underline text-blue-400 hover:text-blue-300">
                «Инструкция»
              </button>
            </p>
          </div>
        </div>
      )}

      {/* Settings warning */}
      {!configured && backendOnline && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3">
          <Zap size={18} className="text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-amber-300 font-medium text-sm">Бот не настроен</p>
            <p className="text-amber-400/70 text-xs mt-0.5">
              Введи Telegram Bot Token в{' '}
              <button onClick={() => onNavigate('settings')} className="underline hover:text-amber-300">Настройках</button>
              , затем следуй{' '}
              <button onClick={() => onNavigate('setup')} className="underline hover:text-amber-300">Инструкции</button>
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', bg)}>
              <Icon size={20} className={color} />
            </div>
            <p className="text-zinc-400 text-xs mb-1">{label}</p>
            <p className="text-white font-bold text-lg leading-none">{value}</p>
          </div>
        ))}
      </div>

      {/* Now Playing + Queue */}
      <div className="grid grid-cols-2 gap-4">
        {/* Now Playing */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Radio size={16} className="text-violet-400" />
            <h2 className="text-white font-semibold text-sm">Сейчас играет</h2>
            {isPlaying && (
              <span className="ml-auto flex items-center gap-1.5 text-green-400 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                В эфире
              </span>
            )}
          </div>

          {currentTrack ? (
            <div className="space-y-4">
              {/* Cover */}
              <div className="aspect-square rounded-xl overflow-hidden bg-zinc-800 max-w-[180px] mx-auto">
                {cover && !imgError ? (
                  <img
                    src={cover}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-violet-900 to-zinc-900">
                    <Music size={48} className="text-violet-400" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="text-center">
                <p className="text-white font-bold text-base truncate">{currentTrack.title}</p>
                <p className="text-zinc-400 text-sm truncate">{currentTrack.artist}</p>
                <p className="text-zinc-600 text-xs mt-1">{formatDuration(currentTrack.duration)}</p>
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                <button onClick={onPrev} className="text-zinc-400 hover:text-white transition-colors">
                  <SkipBack size={22} />
                </button>
                <button
                  onClick={onTogglePlay}
                  className="w-11 h-11 bg-violet-600 hover:bg-violet-500 text-white rounded-full flex items-center justify-center transition-colors"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
                </button>
                <button onClick={onNext} className="text-zinc-400 hover:text-white transition-colors">
                  <SkipForward size={22} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center">
                <Music size={28} className="text-zinc-600" />
              </div>
              <div>
                <p className="text-zinc-400 text-sm">Очередь пуста</p>
                <p className="text-zinc-600 text-xs mt-1">Добавь треки через поиск</p>
              </div>
              <button
                onClick={() => onNavigate('search')}
                className="mt-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm rounded-xl transition-colors"
              >
                Найти треки
              </button>
            </div>
          )}
        </div>

        {/* Queue preview */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ListMusic size={16} className="text-violet-400" />
              <h2 className="text-white font-semibold text-sm">Далее в очереди</h2>
            </div>
            {queue.length > 0 && (
              <button
                onClick={() => onNavigate('queue')}
                className="text-zinc-500 hover:text-white text-xs flex items-center gap-1 transition-colors"
              >
                Все <ExternalLink size={11} />
              </button>
            )}
          </div>

          {queue.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
              <ListMusic size={28} className="text-zinc-700" />
              <p className="text-zinc-500 text-sm">Очередь пуста</p>
            </div>
          ) : (
            <div className="space-y-2">
              {queue.slice(0, 6).map((track, i) => {
                const trackCover = getTrackCover(track);
                const isCurrent = i === 0;
                return (
                  <div
                    key={track.queueId}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-xl',
                      isCurrent ? 'bg-violet-500/10' : 'hover:bg-white/5'
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-zinc-800 flex-shrink-0 flex items-center justify-center">
                      <img
                        src={trackCover}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={e => {
                          (e.target as HTMLImageElement).src =
                            `https://placehold.co/32x32/4f46e5/fff?text=${encodeURIComponent(track.artist[0] || '?')}`;
                        }}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn('text-xs font-medium truncate', isCurrent ? 'text-violet-300' : 'text-zinc-300')}>
                        {track.title}
                      </p>
                      <p className="text-zinc-500 text-xs truncate">{track.artist}</p>
                    </div>
                    <span className="text-zinc-600 text-xs shrink-0">{formatDuration(track.duration)}</span>
                  </div>
                );
              })}
              {queue.length > 6 && (
                <p className="text-zinc-600 text-xs text-center pt-1">
                  ещё {queue.length - 6} треков...
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Найти трек', desc: 'Поиск по VK Music', page: 'search' as Page, color: 'from-violet-600 to-violet-700' },
          { label: 'Очередь', desc: 'Управление треками', page: 'queue' as Page, color: 'from-blue-600 to-blue-700' },
          { label: 'Инструкция', desc: 'Запуск Python бота', page: 'setup' as Page, color: 'from-emerald-600 to-emerald-700' },
        ].map(({ label, desc, page, color }) => (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            className={cn('bg-gradient-to-br p-4 rounded-2xl text-left hover:opacity-90 transition-opacity', color)}
          >
            <p className="text-white font-bold text-sm">{label}</p>
            <p className="text-white/60 text-xs mt-0.5">{desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

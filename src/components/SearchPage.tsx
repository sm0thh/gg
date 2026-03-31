import { useState, useCallback } from 'react';
import { Search, Plus, Play, Music, Loader2, AlertCircle, Clock, CheckCircle, Zap } from 'lucide-react';
import { Track, QueueTrack } from '../types';
import { searchTracks } from '../api/backend';
import { getTrackCover, QUICK_SEARCHES, VK_GENRES } from '../api/vk';
import { formatDuration, cn } from '../utils/cn';

interface SearchPageProps {
  backendUrl: string;
  queue: QueueTrack[];
  currentTrack: QueueTrack | null;
  onAddToQueue: (track: Track) => void;
  onPlayNow: (track: Track) => void;
  backendOnline: boolean;
}

export default function SearchPage({ queue, currentTrack, onAddToQueue, onPlayNow, backendOnline }: SearchPageProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState(0);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const handleSearch = useCallback(async (q?: string) => {
    const searchQuery = (q ?? query).trim();
    if (!searchQuery) { setError('Введи название трека или артиста'); return; }

    setLoading(true);
    setError('');
    setSearched(true);
    setResults([]);

    try {
      const tracks = await searchTracks(searchQuery, 50);
      setResults(tracks);
      if (tracks.length === 0) setError('Ничего не найдено. Попробуй другой запрос.');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка поиска';
      if (msg.includes('Failed to fetch') || msg.includes('ECONNREFUSED') || msg.includes('timed out')) {
        setError('❌ Бэкенд недоступен. Запусти backend.py и проверь URL в настройках.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleQuickSearch = (q: string) => { setQuery(q); handleSearch(q); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); };

  const handleAdd = (track: Track) => {
    onAddToQueue(track);
    setAddedIds(prev => new Set(prev).add(track.id));
  };

  const isPlayingNow = (track: Track) => currentTrack?.id === track.id;
  const isInQueue = (track: Track) => queue.some(q => q.id === track.id);

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Поиск треков</h1>
        <p className="text-zinc-400 text-sm mt-1">Ищи любые треки через VK Music</p>
      </div>

      {/* Backend offline warning */}
      {!backendOnline && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-300 font-medium text-sm">Бэкенд не запущен</p>
            <p className="text-red-400/80 text-xs mt-1">
              Запусти <code className="bg-red-900/30 px-1 rounded">python backend.py</code> на своём сервере.
              Поиск и воспроизведение работают только через бэкенд. Код бота смотри в разделе{' '}
              <span className="text-blue-400">«Инструкция»</span>.
            </p>
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="MORGENSHTERN, Drake, Элджей..."
            className="w-full bg-zinc-800/80 border border-zinc-700 text-white rounded-xl pl-10 pr-4 py-3 text-sm placeholder-zinc-500 focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
        <button
          onClick={() => handleSearch()}
          disabled={loading || !backendOnline}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl px-5 py-3 text-sm font-medium transition-colors flex items-center gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          Найти
        </button>
      </div>

      {/* Genre filter */}
      <div className="flex gap-2 flex-wrap">
        {VK_GENRES.slice(0, 8).map(g => (
          <button
            key={g.id}
            onClick={() => setSelectedGenre(g.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border',
              selectedGenre === g.id
                ? 'bg-violet-600 border-violet-500 text-white'
                : 'bg-zinc-800/60 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'
            )}
          >
            {g.emoji} {g.name}
          </button>
        ))}
      </div>

      {/* Quick searches */}
      {!searched && (
        <div>
          <p className="text-zinc-400 text-xs font-medium uppercase tracking-wider mb-3 flex items-center gap-2">
            <Zap size={12} className="text-yellow-400" /> Быстрый поиск
          </p>
          <div className="flex flex-wrap gap-2">
            {QUICK_SEARCHES.map(q => (
              <button
                key={q}
                onClick={() => handleQuickSearch(q)}
                disabled={!backendOnline}
                className="bg-zinc-800/60 hover:bg-zinc-700/60 disabled:opacity-40 border border-zinc-700 hover:border-zinc-500 text-zinc-300 rounded-lg px-3 py-1.5 text-sm transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <Loader2 size={32} className="animate-spin text-violet-400 mx-auto" />
            <p className="text-zinc-400 text-sm">Ищем через VK Music...</p>
          </div>
        </div>
      )}

      {/* Results */}
      {!loading && results.length > 0 && (
        <div>
          <p className="text-zinc-400 text-xs mb-3">
            Найдено: <span className="text-white font-medium">{results.length}</span> треков
          </p>
          <div className="space-y-1">
            {results.map((track, i) => {
              const playing = isPlayingNow(track);
              const inQueue = isInQueue(track);
              const added = addedIds.has(track.id);

              return (
                <div
                  key={track.id}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border transition-all group',
                    playing
                      ? 'bg-violet-600/20 border-violet-500/40'
                      : 'bg-zinc-800/40 border-zinc-700/40 hover:bg-zinc-700/40 hover:border-zinc-600/40'
                  )}
                >
                  {/* Number / play indicator */}
                  <div className="w-7 text-center flex-shrink-0">
                    {playing ? (
                      <div className="flex justify-center gap-0.5 items-end h-4">
                        {[1, 2, 3].map(b => (
                          <div key={b} className="w-0.5 bg-violet-400 animate-pulse rounded-sm"
                            style={{ height: `${40 + b * 20}%`, animationDelay: `${b * 0.1}s` }} />
                        ))}
                      </div>
                    ) : (
                      <span className="text-zinc-500 text-xs">{i + 1}</span>
                    )}
                  </div>

                  {/* Cover */}
                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-700">
                    <img
                      src={getTrackCover(track)}
                      alt=""
                      className="w-full h-full object-cover"
                      onError={e => {
                        (e.target as HTMLImageElement).src =
                          `https://placehold.co/40x40/4f46e5/fff?text=${encodeURIComponent(track.artist[0] || '?')}`;
                      }}
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className={cn('font-medium text-sm truncate', playing ? 'text-violet-300' : 'text-white')}>
                      {track.title}
                    </p>
                    <p className="text-zinc-400 text-xs truncate">{track.artist}</p>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center gap-1 text-zinc-500 text-xs flex-shrink-0">
                    <Clock size={11} />
                    {formatDuration(track.duration)}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onPlayNow(track)}
                      title="Играть сейчас"
                      className="bg-violet-600 hover:bg-violet-500 text-white rounded-lg p-1.5 transition-colors"
                    >
                      <Play size={13} />
                    </button>
                    <button
                      onClick={() => handleAdd(track)}
                      title="В очередь"
                      className={cn(
                        'rounded-lg p-1.5 transition-colors',
                        added || inQueue
                          ? 'bg-green-600/30 text-green-400'
                          : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                      )}
                    >
                      {added || inQueue ? <CheckCircle size={13} /> : <Plus size={13} />}
                    </button>
                  </div>

                  {/* Added badge */}
                  {(added || inQueue) && !playing && (
                    <div className="flex items-center gap-1 text-green-400 text-xs flex-shrink-0">
                      <Music size={10} />
                      <span>В очереди</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && searched && results.length === 0 && !error && (
        <div className="text-center py-16">
          <Music size={40} className="text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400">Ничего не найдено</p>
          <p className="text-zinc-600 text-sm mt-1">Попробуй другой запрос</p>
        </div>
      )}
    </div>
  );
}

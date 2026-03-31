import { useState, useEffect } from 'react';
import { Music, Plus, Play, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Track } from '../types';
import { getPopular } from '../api/backend';
import { getTrackCover, VK_GENRES } from '../api/vk';
import { formatDuration, cn } from '../utils/cn';

interface LibraryProps {
  onAddToQueue: (track: Track) => void;
  onPlayNow: (track: Track) => void;
  backendOnline: boolean;
}

export default function Library({ onAddToQueue, onPlayNow, backendOnline }: LibraryProps) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedGenre, setSelectedGenre] = useState(0);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  const loadPopular = async (genreId: number) => {
    if (!backendOnline) {
      setError('Бэкенд не запущен. Запусти backend.py');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await getPopular(genreId, 50);
      setTracks(data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка загрузки';
      setError(msg.includes('fetch') ? 'Бэкенд недоступен. Запусти backend.py' : msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (backendOnline) loadPopular(selectedGenre);
  }, [backendOnline]);

  const handleGenre = (id: number) => {
    setSelectedGenre(id);
    loadPopular(id);
  };

  const handleAdd = (track: Track) => {
    onAddToQueue(track);
    setAddedIds(prev => new Set(prev).add(track.id));
  };

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Библиотека</h1>
          <p className="text-zinc-400 text-sm mt-1">Популярные треки VK по жанрам</p>
        </div>
        <button
          onClick={() => loadPopular(selectedGenre)}
          disabled={loading || !backendOnline}
          className="flex items-center gap-2 text-zinc-400 hover:text-white text-sm transition-colors disabled:opacity-40"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Обновить
        </button>
      </div>

      {/* Genre tabs */}
      <div className="flex gap-2 flex-wrap">
        {VK_GENRES.map(g => (
          <button
            key={g.id}
            onClick={() => handleGenre(g.id)}
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

      {/* Backend warning */}
      {!backendOnline && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-300 font-medium text-sm">Бэкенд не запущен</p>
            <p className="text-red-400/80 text-xs mt-1">
              Запусти <code className="bg-red-900/30 px-1 rounded">python backend.py</code> чтобы загрузить треки
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle size={16} className="text-red-400" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <Loader2 size={32} className="animate-spin text-violet-400 mx-auto" />
            <p className="text-zinc-400 text-sm">Загружаем популярные треки...</p>
          </div>
        </div>
      )}

      {/* Tracks grid */}
      {!loading && tracks.length > 0 && (
        <div className="space-y-1">
          <p className="text-zinc-500 text-xs mb-3">{tracks.length} треков</p>
          {tracks.map((track, i) => (
            <div
              key={track.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/40 hover:bg-zinc-700/40 hover:border-zinc-600/40 transition-all group"
            >
              <span className="w-7 text-zinc-500 text-xs text-center flex-shrink-0">{i + 1}</span>
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
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">{track.title}</p>
                <p className="text-zinc-400 text-xs truncate">{track.artist}</p>
              </div>
              <span className="text-zinc-500 text-xs flex-shrink-0">{formatDuration(track.duration)}</span>
              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={() => onPlayNow(track)}
                  className="bg-violet-600 hover:bg-violet-500 text-white rounded-lg p-1.5 transition-colors"
                >
                  <Play size={13} />
                </button>
                <button
                  onClick={() => handleAdd(track)}
                  className={cn(
                    'rounded-lg p-1.5 transition-colors',
                    addedIds.has(track.id)
                      ? 'bg-green-600/30 text-green-400'
                      : 'bg-zinc-700 hover:bg-zinc-600 text-zinc-300'
                  )}
                >
                  <Plus size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && tracks.length === 0 && backendOnline && (
        <div className="text-center py-16">
          <Music size={40} className="text-zinc-600 mx-auto mb-3" />
          <p className="text-zinc-400">Нет треков</p>
          <button onClick={() => loadPopular(selectedGenre)} className="mt-3 text-violet-400 text-sm hover:text-violet-300">
            Загрузить
          </button>
        </div>
      )}
    </div>
  );
}

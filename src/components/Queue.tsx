import { Music, Trash2, ChevronUp, ChevronDown, Play, ListMusic } from 'lucide-react';
import { QueueTrack } from '../types';
import { getTrackCover } from '../api/vk';
import { formatDuration, cn } from '../utils/cn';

interface QueueProps {
  queue: QueueTrack[];
  currentIndex: number;
  isPlaying: boolean;
  onRemove: (queueId: string) => void;
  onMoveUp: (idx: number) => void;
  onMoveDown: (idx: number) => void;
  onJumpTo: (idx: number) => void;
  onClear: () => void;
}

export default function Queue({
  queue, currentIndex, isPlaying, onRemove, onMoveUp, onMoveDown, onJumpTo, onClear,
}: QueueProps) {
  const totalDuration = queue.reduce((s, t) => s + t.duration, 0);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Очередь</h1>
          <p className="text-zinc-400 text-sm mt-1">
            {queue.length} треков · {formatDuration(totalDuration)} общая длительность
          </p>
        </div>
        {queue.length > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-sm rounded-xl transition-colors"
          >
            <Trash2 size={15} />
            Очистить
          </button>
        )}
      </div>

      {queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-20 h-20 rounded-3xl bg-zinc-800 flex items-center justify-center">
            <ListMusic size={32} className="text-zinc-600" />
          </div>
          <div className="text-center">
            <p className="text-zinc-400 text-sm font-medium">Очередь пуста</p>
            <p className="text-zinc-600 text-xs mt-1">Добавь треки через Поиск или Библиотеку</p>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {queue.map((track, i) => {
            const cover = getTrackCover(track);
            const isCurrent = i === currentIndex;
            const isActive = isCurrent && isPlaying;

            return (
              <div
                key={track.queueId}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-xl group transition-all',
                  isCurrent
                    ? 'bg-violet-500/10 border border-violet-500/20'
                    : 'hover:bg-zinc-800/60 border border-transparent'
                )}
              >
                {/* Position */}
                <div className="w-6 text-center shrink-0">
                  {isActive ? (
                    <div className="flex items-end justify-center gap-0.5 h-4">
                      {[0, 1, 2].map(j => (
                        <div
                          key={j}
                          className="w-0.5 bg-violet-400 rounded-full animate-bounce"
                          style={{ height: `${[12, 8, 16][j]}px`, animationDelay: `${j * 0.15}s` }}
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="text-zinc-600 text-xs">{i + 1}</span>
                  )}
                </div>

                {/* Cover */}
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 shrink-0 flex items-center justify-center">
                  <img
                    src={cover}
                    alt={track.title}
                    className="w-full h-full object-cover"
                    onError={e => {
                      (e.target as HTMLImageElement).src =
                        `https://placehold.co/40x40/4f46e5/fff?text=${encodeURIComponent(track.artist[0] || '?')}`;
                    }}
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium truncate', isCurrent ? 'text-violet-300' : 'text-white')}>
                    {track.title}
                  </p>
                  <p className="text-zinc-500 text-xs truncate">{track.artist}</p>
                </div>

                {/* Duration */}
                <span className="text-zinc-600 text-xs shrink-0">{formatDuration(track.duration)}</span>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => onJumpTo(i)}
                    title="Играть"
                    className="p-1.5 text-zinc-400 hover:text-white hover:bg-violet-600 rounded-lg transition-colors"
                  >
                    <Play size={13} />
                  </button>
                  <button
                    onClick={() => onMoveUp(i)}
                    disabled={i === 0}
                    title="Выше"
                    className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    <ChevronUp size={13} />
                  </button>
                  <button
                    onClick={() => onMoveDown(i)}
                    disabled={i === queue.length - 1}
                    title="Ниже"
                    className="p-1.5 text-zinc-400 hover:text-white disabled:opacity-30 hover:bg-zinc-700 rounded-lg transition-colors"
                  >
                    <ChevronDown size={13} />
                  </button>
                  <button
                    onClick={() => onRemove(track.queueId)}
                    title="Удалить"
                    className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Music size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

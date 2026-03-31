/**
 * Утилиты для работы с VK данными на фронтенде.
 * Реальные запросы к VK API делает ТОЛЬКО Python бэкенд.
 * Здесь только хелперы для обложек, жанров и быстрого поиска.
 */

import { Track } from '../types';

export const QUICK_SEARCHES = [
  'MORGENSHTERN',
  'Элджей',
  'Скриптонит',
  'Miyagi',
  'Drake',
  'The Weeknd',
  'Playboi Carti',
  'Travis Scott',
  'Макс Корж',
  'Niletto',
];

export const VK_GENRES: { id: number; name: string; emoji: string }[] = [
  { id: 0,  name: 'Все жанры',   emoji: '🎵' },
  { id: 1,  name: 'Rock',         emoji: '🎸' },
  { id: 2,  name: 'Pop',          emoji: '🎤' },
  { id: 3,  name: 'Rap & HipHop', emoji: '🎤' },
  { id: 4,  name: 'Easy Listening',emoji: '🎧' },
  { id: 5,  name: 'Dance & House',emoji: '💃' },
  { id: 6,  name: 'Instrumental', emoji: '🎹' },
  { id: 7,  name: 'Metal',        emoji: '🤘' },
  { id: 8,  name: 'Alternative',  emoji: '🎼' },
  { id: 10, name: 'Film & Game',  emoji: '🎬' },
  { id: 18, name: 'Electro & Dance', emoji: '⚡' },
  { id: 19, name: 'Drum & Bass',  emoji: '🥁' },
  { id: 21, name: 'Trance',       emoji: '🌊' },
];

/** Плейсхолдер обложки если VK не вернул */
export function getDefaultCover(artist: string): string {
  const colors = ['4f46e5', '7c3aed', 'db2777', 'dc2626', 'd97706', '059669', '0891b2'];
  const idx = artist.charCodeAt(0) % colors.length;
  const color = colors[idx];
  const letter = (artist[0] || '?').toUpperCase();
  return `https://placehold.co/300x300/${color}/ffffff?text=${encodeURIComponent(letter)}&font=montserrat`;
}

/** Лучшая доступная обложка из трека */
export function getTrackCover(track: Track): string {
  return track.cover || getDefaultCover(track.artist);
}

/** Форматирование времени */
export function formatDuration(sec: number): string {
  if (!sec || sec <= 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

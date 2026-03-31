/**
 * Все запросы идут на Python бэкенд (localhost:8080)
 * Бэкенд сам работает с VK API без CORS проблем
 */

import { Track, QueueTrack, BotStatus } from '../types';

let BASE_URL = 'http://localhost:8080';

export function setBackendUrl(url: string) {
  BASE_URL = url.replace(/\/$/, '');
}

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(8000),
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json();
}

// ─── Поиск треков через VK (на сервере) ───────────────────────────────────────
export async function searchTracks(query: string, count = 50): Promise<Track[]> {
  return req<Track[]>(`/api/search?q=${encodeURIComponent(query)}&count=${count}`);
}

// ─── Популярные по жанру ───────────────────────────────────────────────────────
export async function getPopular(genreId = 0, count = 50): Promise<Track[]> {
  return req<Track[]>(`/api/popular?genre_id=${genreId}&count=${count}`);
}

// ─── Статус бота ───────────────────────────────────────────────────────────────
export async function getBotStatus(): Promise<BotStatus> {
  return req<BotStatus>('/api/status');
}

// ─── Очередь ──────────────────────────────────────────────────────────────────
export async function getQueue(): Promise<QueueTrack[]> {
  return req<QueueTrack[]>('/api/queue');
}

export async function addToQueue(track: Track): Promise<{ ok: boolean }> {
  return req<{ ok: boolean }>('/api/queue/add', {
    method: 'POST',
    body: JSON.stringify(track),
  });
}

export async function removeFromQueue(queueId: string): Promise<{ ok: boolean }> {
  return req<{ ok: boolean }>(`/api/queue/remove/${queueId}`, { method: 'DELETE' });
}

export async function clearQueue(): Promise<{ ok: boolean }> {
  return req<{ ok: boolean }>('/api/queue/clear', { method: 'POST' });
}

// ─── Управление воспроизведением ──────────────────────────────────────────────
export async function playTrack(track: Track): Promise<{ ok: boolean }> {
  return req<{ ok: boolean }>('/api/play', {
    method: 'POST',
    body: JSON.stringify(track),
  });
}

export async function skipTrack(): Promise<{ ok: boolean }> {
  return req<{ ok: boolean }>('/api/skip', { method: 'POST' });
}

export async function pauseTrack(): Promise<{ ok: boolean }> {
  return req<{ ok: boolean }>('/api/pause', { method: 'POST' });
}

export async function resumeTrack(): Promise<{ ok: boolean }> {
  return req<{ ok: boolean }>('/api/resume', { method: 'POST' });
}

export async function stopBot(): Promise<{ ok: boolean }> {
  return req<{ ok: boolean }>('/api/stop', { method: 'POST' });
}

// ─── Пинг (проверка соединения с бэкендом) ────────────────────────────────────
export async function pingBackend(): Promise<boolean> {
  try {
    const r = await req<{ ok: boolean }>('/api/ping');
    return r.ok === true;
  } catch {
    return false;
  }
}

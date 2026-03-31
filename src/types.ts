export interface Track {
  id: string;
  artist: string;
  title: string;
  duration: number;
  cover?: string;
  source: 'vk' | 'manual';
  vkId?: number;
  vkOwnerId?: number;
}

export interface QueueTrack extends Track {
  queueId: string;
  addedAt: number;
  status: 'waiting' | 'playing' | 'error';
}

export interface BotSettings {
  vkToken: string;
  tgBotToken: string;
  tgChatId: string;
  tgApiId: string;
  tgApiHash: string;
  tgPhone: string;
  backendUrl: string;
}

export interface BotStatus {
  isConnected: boolean;
  isPlaying: boolean;
  currentTrack: QueueTrack | null;
  queueLength: number;
  playedToday: number;
  uptime: number;
  chatTitle: string;
  listeners: number;
}

export interface VKRawTrack {
  id: number;
  owner_id: number;
  artist: string;
  title: string;
  duration: number;
  url?: string;
  thumb?: VKThumb;
  album?: {
    id: number;
    title: string;
    thumb?: VKThumb;
  };
}

export interface VKThumb {
  photo_34?: string;
  photo_68?: string;
  photo_135?: string;
  photo_270?: string;
  photo_300?: string;
  photo_600?: string;
}

export type Page = 'dashboard' | 'search' | 'queue' | 'library' | 'settings' | 'setup';

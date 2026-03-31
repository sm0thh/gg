import { LayoutDashboard, Search, ListMusic, Library, Settings, BookOpen, Radio } from 'lucide-react';
import { Page } from '../types';
import { cn } from '../utils/cn';

interface SidebarProps {
  activePage: Page;
  onNavigate: (p: Page) => void;
  queueCount: number;
}

const NAV = [
  { id: 'dashboard' as Page, label: 'Дашборд', icon: LayoutDashboard },
  { id: 'search' as Page, label: 'Поиск', icon: Search },
  { id: 'queue' as Page, label: 'Очередь', icon: ListMusic },
  { id: 'library' as Page, label: 'Библиотека', icon: Library },
];

const BOTTOM_NAV = [
  { id: 'settings' as Page, label: 'Настройки', icon: Settings },
  { id: 'setup' as Page, label: 'Инструкция', icon: BookOpen },
];

export default function Sidebar({ activePage, onNavigate, queueCount }: SidebarProps) {
  return (
    <div className="w-56 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Radio size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-none">TG Music Bot</p>
            <p className="text-zinc-500 text-xs mt-0.5">VK Radio</p>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              activePage === id
                ? 'bg-white/10 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            )}
          >
            <Icon size={18} />
            <span>{label}</span>
            {id === 'queue' && queueCount > 0 && (
              <span className="ml-auto bg-blue-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {queueCount > 99 ? '99+' : queueCount}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="px-2 pb-3 border-t border-zinc-800 pt-3 space-y-0.5">
        {BOTTOM_NAV.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              activePage === id
                ? 'bg-white/10 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            )}
          >
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

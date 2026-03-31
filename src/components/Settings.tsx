import { useState } from 'react';
import { Save, Eye, EyeOff, CheckCircle, ExternalLink } from 'lucide-react';
import { BotSettings } from '../types';

interface SettingsProps {
  settings: BotSettings;
  onSave: (s: BotSettings) => void;
}

export default function Settings({ settings, onSave }: SettingsProps) {
  const [form, setForm] = useState<BotSettings>({ ...settings });
  const [showVkToken, setShowVkToken] = useState(false);
  const [showBotToken, setShowBotToken] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (key: keyof BotSettings, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSave = () => {
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Настройки</h1>
        <p className="text-zinc-400 text-sm mt-1">Конфигурация бота и подключение к VK</p>
      </div>

      {/* VK Section */}
      <Section title="🎵 VK Music API" subtitle="Нужен для поиска и получения треков">
        <Field
          label="VK Access Token"
          hint={
            <span>
              Получи на{' '}
              <a href="https://vkhost.github.io/" target="_blank" rel="noreferrer"
                className="text-blue-400 hover:underline inline-flex items-center gap-1">
                vkhost.github.io <ExternalLink size={11} />
              </a>
              {' '}→ выбери <strong>Kate Mobile</strong> → Разрешить → скопируй access_token из URL
            </span>
          }
        >
          <TokenInput
            value={form.vkToken}
            show={showVkToken}
            placeholder="vk1.a.xxxxxxxxxxxx"
            onChange={v => set('vkToken', v)}
            onToggle={() => setShowVkToken(s => !s)}
          />
        </Field>
      </Section>

      {/* Telegram Bot */}
      <Section title="🤖 Telegram Bot" subtitle="Управляющий бот (создай через @BotFather)">
        <Field label="Bot Token" hint="Создай бота через @BotFather и дай ему права администратора в чате">
          <TokenInput
            value={form.tgBotToken}
            show={showBotToken}
            placeholder="123456789:AABBccdd..."
            onChange={v => set('tgBotToken', v)}
            onToggle={() => setShowBotToken(s => !s)}
          />
        </Field>
        <Field label="Chat ID" hint="ID чата где бот будет крутить музыку. Например: -1001234567890">
          <input
            type="text"
            value={form.tgChatId}
            onChange={e => set('tgChatId', e.target.value)}
            placeholder="-1001234567890"
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-2.5 text-sm placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </Field>
      </Section>

      {/* PyTgCalls Userbot */}
      <Section title="📞 PyTgCalls (Userbot)" subtitle="Нужен для входа в голосовой чат Telegram">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4">
          <p className="text-amber-300 text-xs leading-relaxed">
            ⚠️ Для воспроизведения в голосовом чате нужен <strong>Telegram userbot</strong> (твой аккаунт, не бот).
            Получи <code className="bg-amber-900/30 px-1 rounded">api_id</code> и{' '}
            <code className="bg-amber-900/30 px-1 rounded">api_hash</code> на{' '}
            <a href="https://my.telegram.org" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">
              my.telegram.org
            </a>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="API ID">
            <input
              type="text"
              value={form.tgApiId}
              onChange={e => set('tgApiId', e.target.value)}
              placeholder="12345678"
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-2.5 text-sm placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </Field>
          <Field label="API Hash">
            <input
              type="text"
              value={form.tgApiHash}
              onChange={e => set('tgApiHash', e.target.value)}
              placeholder="abcdef1234567890..."
              className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-2.5 text-sm placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </Field>
        </div>
        <Field label="Номер телефона" hint="Номер аккаунта-userbot (с кодом страны). Например: +79991234567">
          <input
            type="text"
            value={form.tgPhone}
            onChange={e => set('tgPhone', e.target.value)}
            placeholder="+79991234567"
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-2.5 text-sm placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </Field>
      </Section>

      {/* Backend URL */}
      <Section title="🔗 Backend сервер" subtitle="URL где запущен Python бот (для связи с дашбордом)">
        <Field label="Backend URL" hint="Адрес Flask сервера бота. По умолчанию localhost:8080">
          <input
            type="text"
            value={form.backendUrl}
            onChange={e => set('backendUrl', e.target.value)}
            placeholder="http://localhost:8080"
            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-2.5 text-sm placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </Field>
      </Section>

      {/* Save button */}
      <button
        onClick={handleSave}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-colors"
      >
        {saved ? (
          <>
            <CheckCircle size={18} className="text-green-300" />
            <span>Сохранено!</span>
          </>
        ) : (
          <>
            <Save size={18} />
            <span>Сохранить настройки</span>
          </>
        )}
      </button>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="text-white font-semibold text-sm">{title}</h2>
        <p className="text-zinc-500 text-xs mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-zinc-300 text-xs font-medium">{label}</label>
      {children}
      {hint && <p className="text-zinc-600 text-xs leading-relaxed">{hint}</p>}
    </div>
  );
}

function TokenInput({
  value, show, placeholder, onChange, onToggle,
}: {
  value: string;
  show: boolean;
  placeholder: string;
  onChange: (v: string) => void;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-xl px-4 py-2.5 pr-10 text-sm placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
      >
        {show ? <EyeOff size={15} /> : <Eye size={15} />}
      </button>
    </div>
  );
}

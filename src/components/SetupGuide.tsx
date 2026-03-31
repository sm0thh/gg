import { useState } from 'react';
import { Copy, CheckCheck, ChevronDown, ChevronUp, CheckCircle, Circle, ExternalLink } from 'lucide-react';
import { BotSettings } from '../types';
import { cn } from '../utils/cn';

interface SetupGuideProps {
  settings: BotSettings;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg text-xs transition-colors flex-shrink-0"
    >
      {copied ? <><CheckCheck size={12} className="text-green-400" />Скопировано</> : <><Copy size={12} />Копировать</>}
    </button>
  );
}

function CodeBlock({ code, lang = 'bash' }: { code: string; lang?: string }) {
  return (
    <div className="relative bg-zinc-950 border border-zinc-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/80 border-b border-zinc-700">
        <span className="text-zinc-400 text-xs font-mono">{lang}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 text-sm text-green-400 overflow-x-auto font-mono leading-relaxed whitespace-pre">{code}</pre>
    </div>
  );
}

function InfoBox({ type = 'info', children }: { type?: 'info' | 'warn' | 'success'; children: React.ReactNode }) {
  const styles = {
    info: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
    warn: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
    success: 'bg-green-500/10 border-green-500/30 text-green-300',
  };
  return (
    <div className={cn('border rounded-xl p-3 text-sm', styles[type])}>
      {children}
    </div>
  );
}

function Step({ n, title, done, children, open, onToggle }: {
  n: number; title: string; done: boolean;
  children: React.ReactNode; open: boolean; onToggle: () => void;
}) {
  return (
    <div className={cn(
      'border rounded-2xl overflow-hidden transition-all',
      done ? 'border-green-500/40 bg-green-500/5' : 'border-zinc-700 bg-zinc-800/50'
    )}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition-colors text-left"
      >
        <div className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0',
          done ? 'bg-green-500 text-white' : 'bg-zinc-700 text-zinc-300'
        )}>
          {done ? '✓' : n}
        </div>
        <span className={cn('font-semibold flex-1', done ? 'text-green-400' : 'text-white')}>{title}</span>
        {done && <span className="text-green-400 text-xs">Готово</span>}
        {open ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3 border-t border-zinc-700/50 pt-4">{children}</div>}
    </div>
  );
}

function LinkButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition-colors"
    >
      {children} <ExternalLink size={14} />
    </a>
  );
}

function FileCard({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-zinc-900 border border-zinc-700 rounded-xl">
      <div className="w-8 h-8 bg-violet-600/20 border border-violet-500/30 rounded-lg flex items-center justify-center text-violet-400 text-xs font-bold">py</div>
      <div>
        <div className="text-white text-sm font-medium">{name}</div>
        <div className="text-zinc-500 text-xs">{desc}</div>
      </div>
    </div>
  );
}

export default function SetupGuide({ settings }: SetupGuideProps) {
  const [openStep, setOpenStep] = useState<number | null>(1);

  const toggle = (n: number) => setOpenStep(openStep === n ? null : n);

  const hasVk = !!settings.vkToken;
  const hasTg = !!(settings.tgBotToken && settings.tgApiId && settings.tgApiHash);
  const hasChat = !!settings.tgChatId;
  const hasBackend = !!settings.backendUrl;

  const renderEnvVars = () => {
    const vars = [
      `VK_TOKEN=${settings.vkToken || 'ВАШ_VK_TOKEN'}`,
      `BOT_TOKEN=${settings.tgBotToken || 'ВАШ_BOT_TOKEN'}`,
      `API_ID=${settings.tgApiId || 'ВАШ_API_ID'}`,
      `API_HASH=${settings.tgApiHash || 'ВАШ_API_HASH'}`,
      `PHONE=${settings.tgPhone || '+79001234567'}`,
      `CHAT_ID=${settings.tgChatId || '-100XXXXXXXXXX'}`,
    ];
    return vars.join('\n');
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">

      {/* Заголовок */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-white">🚀 Деплой на Render.com</h1>
        <p className="text-zinc-400">Бесплатно, без терминала, 5 минут</p>
      </div>

      {/* Прогресс */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'VK Token', done: hasVk },
          { label: 'Telegram', done: hasTg },
          { label: 'Chat ID', done: hasChat },
          { label: 'Backend', done: hasBackend },
        ].map((item, i) => (
          <div key={i} className={cn(
            'p-3 rounded-xl border text-center text-xs font-medium',
            item.done
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-zinc-800 border-zinc-700 text-zinc-500'
          )}>
            {item.done ? '✓' : '○'} {item.label}
          </div>
        ))}
      </div>

      {/* Шаги */}
      <div className="space-y-3">

        {/* Шаг 1 — VK Token */}
        <Step n={1} title="Получи VK Token" done={hasVk} open={openStep === 1} onToggle={() => toggle(1)}>
          <InfoBox type="info">
            VK Token даёт доступ к музыкальной базе ВКонтакте — миллионы треков включая MORGENSHTERN, Drake, Элджей и всех остальных.
          </InfoBox>
          <div className="space-y-2">
            <p className="text-zinc-300 text-sm font-medium">1. Открой ссылку ниже в браузере:</p>
            <LinkButton href="https://vkhost.github.io">Открыть vkhost.github.io</LinkButton>
          </div>
          <div className="space-y-2">
            <p className="text-zinc-300 text-sm font-medium">2. Нажми <span className="bg-zinc-700 px-2 py-0.5 rounded text-violet-300">Kate Mobile</span></p>
            <p className="text-zinc-300 text-sm font-medium">3. Нажми <span className="bg-zinc-700 px-2 py-0.5 rounded text-green-300">Разрешить</span></p>
            <p className="text-zinc-300 text-sm font-medium">4. Скопируй <code className="bg-zinc-700 px-2 py-0.5 rounded text-yellow-300">access_token=</code> из URL (длинная строка)</p>
          </div>
          <InfoBox type="warn">
            ⚠️ Нужна подписка VK Музыка (99₽/мес) иначе URL треков будут пустыми. Без неё поиск работает но треки не воспроизводятся.
          </InfoBox>
          <p className="text-zinc-400 text-sm">→ Вставь токен в <strong className="text-white">Настройки → VK Token</strong></p>
        </Step>

        {/* Шаг 2 — Telegram */}
        <Step n={2} title="Настрой Telegram" done={hasTg} open={openStep === 2} onToggle={() => toggle(2)}>
          <div className="space-y-4">
            <div className="space-y-2">
              <p className="text-zinc-300 text-sm font-semibold">🤖 Bot Token — от @BotFather:</p>
              <div className="flex gap-2">
                <LinkButton href="https://t.me/BotFather">Открыть @BotFather</LinkButton>
              </div>
              <CodeBlock lang="telegram" code={`/newbot\n→ Введи имя бота\n→ Введи username бота (например musicbot_myname_bot)\n→ Скопируй токен вида: 1234567890:ABCdef...`} />
            </div>
            <div className="space-y-2">
              <p className="text-zinc-300 text-sm font-semibold">🔑 API ID и API Hash — от my.telegram.org:</p>
              <LinkButton href="https://my.telegram.org/apps">Открыть my.telegram.org</LinkButton>
              <ol className="text-zinc-400 text-sm space-y-1 list-decimal list-inside">
                <li>Войди через номер телефона</li>
                <li>Нажми <strong className="text-white">API development tools</strong></li>
                <li>Создай приложение (название любое)</li>
                <li>Скопируй <code className="text-yellow-300">App api_id</code> и <code className="text-yellow-300">App api_hash</code></li>
              </ol>
            </div>
          </div>
          <p className="text-zinc-400 text-sm">→ Вставь всё в <strong className="text-white">Настройки</strong></p>
        </Step>

        {/* Шаг 3 — Chat ID */}
        <Step n={3} title="Получи Chat ID группы" done={hasChat} open={openStep === 3} onToggle={() => toggle(3)}>
          <InfoBox type="info">
            Chat ID — это ID группы/канала где бот будет крутить треки в голосовом чате.
          </InfoBox>
          <div className="space-y-2">
            <p className="text-zinc-300 text-sm font-semibold">Способ 1 — через бота:</p>
            <div className="flex gap-2">
              <LinkButton href="https://t.me/username_to_id_bot">@username_to_id_bot</LinkButton>
            </div>
            <p className="text-zinc-400 text-sm">Перешли любое сообщение из группы — бот ответит ID</p>
          </div>
          <div className="space-y-2">
            <p className="text-zinc-300 text-sm font-semibold">Способ 2 — через Telegram Web:</p>
            <ol className="text-zinc-400 text-sm space-y-1 list-decimal list-inside">
              <li>Открой <a href="https://web.telegram.org" className="text-violet-400 underline" target="_blank">web.telegram.org</a></li>
              <li>Открой нужную группу</li>
              <li>Посмотри URL: <code className="text-yellow-300">https://web.telegram.org/a/#-100XXXXXXXXXX</code></li>
              <li>Число после <code className="text-yellow-300">#</code> — это и есть Chat ID</li>
            </ol>
          </div>
          <InfoBox type="warn">
            ⚠️ Chat ID группы начинается с <strong>-100</strong> (например -1001234567890). Не забудь добавить бота в группу и дать ему права администратора!
          </InfoBox>
          <p className="text-zinc-400 text-sm">→ Вставь в <strong className="text-white">Настройки → Chat ID</strong></p>
        </Step>

        {/* Шаг 4 — GitHub */}
        <Step n={4} title="Залей бэкенд на GitHub" done={false} open={openStep === 4} onToggle={() => toggle(4)}>
          <InfoBox type="info">
            Нужно создать репозиторий с 3 файлами из папки <code className="text-violet-300">backend/</code>
          </InfoBox>

          <div className="space-y-2">
            <p className="text-zinc-300 text-sm font-semibold">📁 Нужные файлы:</p>
            <div className="space-y-2">
              <FileCard name="main.py" desc="Основной сервер — VK API + очередь треков" />
              <FileCard name="requirements.txt" desc="Зависимости Python (aiohttp)" />
              <FileCard name="render.yaml" desc="Конфиг деплоя для Render" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-zinc-300 text-sm font-semibold">Как залить на GitHub (без терминала):</p>
            <ol className="text-zinc-400 text-sm space-y-2 list-decimal list-inside">
              <li>Иди на <a href="https://github.com/new" className="text-violet-400 underline" target="_blank">github.com/new</a></li>
              <li>Назови репо: <code className="bg-zinc-700 px-1 rounded text-white">tg-music-bot</code></li>
              <li>Нажми <strong className="text-white">Create repository</strong></li>
              <li>Нажми <strong className="text-white">uploading an existing file</strong></li>
              <li>Перетащи 3 файла из папки <code className="text-violet-300">backend/</code></li>
              <li>Нажми <strong className="text-white">Commit changes</strong></li>
            </ol>
          </div>

          <InfoBox type="success">
            💡 Где найти файлы? В VS Code в панели слева — папка <strong>backend/</strong>. Правый клик на каждом файле → <strong>Reveal in Explorer</strong> (или Finder на Mac)
          </InfoBox>
        </Step>

        {/* Шаг 5 — Render деплой */}
        <Step n={5} title="Задеплой на Render.com" done={hasBackend} open={openStep === 5} onToggle={() => toggle(5)}>
          <div className="space-y-2">
            <p className="text-zinc-300 text-sm font-semibold">1. Зарегистрируйся на Render:</p>
            <LinkButton href="https://render.com">Открыть Render.com</LinkButton>
          </div>

          <div className="space-y-2">
            <p className="text-zinc-300 text-sm font-semibold">2. Создай новый Web Service:</p>
            <ol className="text-zinc-400 text-sm space-y-1 list-decimal list-inside">
              <li>Нажми <strong className="text-white">+ New</strong> → <strong className="text-white">Web Service</strong></li>
              <li>Выбери <strong className="text-white">Connect a repository</strong></li>
              <li>Подключи GitHub → выбери <code className="text-violet-300">tg-music-bot</code></li>
              <li>Render сам найдёт <code className="text-violet-300">render.yaml</code> и настроит всё</li>
            </ol>
          </div>

          <div className="space-y-2">
            <p className="text-zinc-300 text-sm font-semibold">3. Добавь переменные окружения:</p>
            <p className="text-zinc-400 text-sm">В разделе <strong className="text-white">Environment → Environment Variables</strong> добавь по одной:</p>
            <CodeBlock lang="env" code={renderEnvVars()} />
            <InfoBox type="warn">
              ⚠️ Выбери бесплатный тариф <strong>Free</strong>. Keep-alive пинг уже встроен в бэкенд — сервер не будет засыпать.
            </InfoBox>
          </div>

          <div className="space-y-2">
            <p className="text-zinc-300 text-sm font-semibold">4. Скопируй URL сервиса:</p>
            <ol className="text-zinc-400 text-sm space-y-1 list-decimal list-inside">
              <li>После деплоя вверху будет URL вида: <code className="text-green-300">https://tg-music-bot-xxxx.onrender.com</code></li>
              <li>Скопируй его</li>
              <li>Вставь в <strong className="text-white">Настройки → Backend URL</strong></li>
            </ol>
          </div>

          <InfoBox type="success">
            ✅ После сохранения в дашборде появится зелёный индикатор <strong>Бэкенд онлайн</strong> — всё работает!
          </InfoBox>
        </Step>

        {/* Шаг 6 — Проверка */}
        <Step n={6} title="Проверь что всё работает" done={hasBackend && hasVk} open={openStep === 6} onToggle={() => toggle(6)}>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              {hasBackend ? <CheckCircle size={16} className="text-green-400" /> : <Circle size={16} className="text-zinc-500" />}
              <span className={hasBackend ? 'text-green-400' : 'text-zinc-400'}>Backend URL задан в настройках</span>
            </div>
            <div className="flex items-center gap-3">
              {hasVk ? <CheckCircle size={16} className="text-green-400" /> : <Circle size={16} className="text-zinc-500" />}
              <span className={hasVk ? 'text-green-400' : 'text-zinc-400'}>VK Token задан</span>
            </div>
            <div className="flex items-center gap-3">
              {hasTg ? <CheckCircle size={16} className="text-green-400" /> : <Circle size={16} className="text-zinc-500" />}
              <span className={hasTg ? 'text-green-400' : 'text-zinc-400'}>Telegram Bot Token + API ID/Hash заданы</span>
            </div>
            <div className="flex items-center gap-3">
              {hasChat ? <CheckCircle size={16} className="text-green-400" /> : <Circle size={16} className="text-zinc-500" />}
              <span className={hasChat ? 'text-green-400' : 'text-zinc-400'}>Chat ID задан</span>
            </div>
          </div>

            {hasBackend && hasVk && hasTg && hasChat ? (
            <InfoBox type="success">
              🎉 Всё готово! Иди в раздел <strong>Поиск</strong>, найди MORGENSHTERN и нажми ▶ — трек добавится в очередь и начнёт играть в голосовом чате!
            </InfoBox>
          ) : (
            <InfoBox type="warn">
              Заполни все поля в <strong>Настройки</strong> и задеплой бэкенд на Render — тогда всё заработает.
            </InfoBox>
          )}
        </Step>

      </div>

      {/* FAQ */}
      <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl p-5 space-y-4">
        <h3 className="text-white font-semibold">❓ Частые вопросы</h3>
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-zinc-300 font-medium">Render показывает "Build failed"?</p>
            <p className="text-zinc-500">Проверь что загрузил все 3 файла: main.py, requirements.txt, render.yaml</p>
          </div>
          <div>
            <p className="text-zinc-300 font-medium">Поиск работает но треки не играют?</p>
            <p className="text-zinc-500">Нужна подписка VK Музыка — без неё URL треков пустые</p>
          </div>
          <div>
            <p className="text-zinc-300 font-medium">Бот не заходит в голосовой чат?</p>
            <p className="text-zinc-500">Добавь бота в группу и дай права администратора. Голосовой чат должен быть уже запущен.</p>
          </div>
          <div>
            <p className="text-zinc-300 font-medium">Render засыпает через 15 минут?</p>
            <p className="text-zinc-500">Keep-alive пинг уже встроен в main.py — он пингует сам себя каждые 14 минут автоматически.</p>
          </div>
        </div>
      </div>

    </div>
  );
}

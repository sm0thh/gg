import { useState } from 'react';
import { Copy, CheckCheck, ChevronDown, ChevronUp, Terminal, CheckCircle, Circle } from 'lucide-react';
import { BotSettings } from '../types';
import { cn } from '../utils/cn';

interface SetupGuideProps {
  settings: BotSettings;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg text-xs transition-colors"
    >
      {copied ? <><CheckCheck size={12} className="text-green-400" /> Скопировано</> : <><Copy size={12} /> Копировать</>}
    </button>
  );
}

function CodeBlock({ code, lang = 'python' }: { code: string; lang?: string }) {
  return (
    <div className="relative bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-800/80 border-b border-zinc-700">
        <span className="text-zinc-400 text-xs font-mono">{lang}</span>
        <CopyButton text={code} />
      </div>
      <pre className="p-4 text-sm text-zinc-300 overflow-x-auto font-mono leading-relaxed whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

function Step({ n, title, done, children, open, onToggle }: {
  n: number; title: string; done: boolean;
  children: React.ReactNode; open: boolean; onToggle: () => void;
}) {
  return (
    <div className={cn('border rounded-2xl overflow-hidden transition-colors', done ? 'border-green-500/30' : 'border-zinc-800')}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-zinc-800/30 transition-colors"
      >
        {done ? <CheckCircle size={20} className="text-green-400 flex-shrink-0" /> : <Circle size={20} className="text-zinc-600 flex-shrink-0" />}
        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-800 text-zinc-400 text-xs font-bold flex items-center justify-center">{n}</span>
        <span className="font-medium text-white flex-1">{title}</span>
        {open ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3 border-t border-zinc-800 pt-4">{children}</div>}
    </div>
  );
}

export default function SetupGuide({ settings }: SetupGuideProps) {
  const [openStep, setOpenStep] = useState<number>(0);
  const toggle = (n: number) => setOpenStep(s => s === n ? -1 : n);

  const s = settings;

  const REQUIREMENTS = `pyrogram==2.0.106
TgCrypto
pytgcalls==3.0.0.dev29
aiohttp
vk_api`;

  const BACKEND_CODE = `#!/usr/bin/env python3
"""
TG Music Bot Backend  —  backend.py
====================================
Запуск:  python backend.py
Порт:    8080

Зависимости:
  pip install pyrogram TgCrypto pytgcalls==3.0.0.dev29 aiohttp vk_api
"""

import asyncio
import logging
import json
import time
from aiohttp import web
import aiohttp
import vk_api
from pyrogram import Client, filters
from pyrogram.types import Message
from pytgcalls import PyTgCalls
from pytgcalls.types import AudioPiped

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

# ╔══════════════════════════════════════════╗
# ║           НАСТРОЙКИ — ЗАПОЛНИ           ║
# ╚══════════════════════════════════════════╝
API_ID    = ${s.tgApiId || 'ВАШ_API_ID'}          # my.telegram.org
API_HASH  = "${s.tgApiHash || 'ВАШ_API_HASH'}"    # my.telegram.org
BOT_TOKEN = "${s.tgBotToken || 'ВАШ_BOT_TOKEN'}"  # @BotFather
VK_TOKEN  = "${s.vkToken || 'ВАШ_VK_TOKEN'}"      # vkhost.github.io → Kate Mobile
CHAT_ID   = ${s.tgChatId || 'ВАШ_CHAT_ID'}        # ID чата, например -1001234567890
PHONE     = "${s.tgPhone || '+79991234567'}"       # Номер userbot аккаунта
PORT      = 8080
# ═══════════════════════════════════════════

# ─── Глобальное состояние ─────────────────────────────────────────────────────
queue: list[dict] = []
current_track: dict | None = None
is_playing = False
played_today = 0
start_time = time.time()

# ─── Клиенты ──────────────────────────────────────────────────────────────────
userbot   = Client("userbot_session", api_id=API_ID, api_hash=API_HASH, phone_number=PHONE)
bot       = Client("bot_session",    api_id=API_ID, api_hash=API_HASH, bot_token=BOT_TOKEN)
calls     = PyTgCalls(userbot)

# ─── VK API ───────────────────────────────────────────────────────────────────
def vk_search_sync(query: str, count: int = 50) -> list[dict]:
    """Синхронный поиск треков VK"""
    try:
        vk = vk_api.VkApi(token=VK_TOKEN)
        audio = vk_api.audio.VkAudio(vk)
        results = audio.search(q=query, count=count)
        tracks = []
        for item in results:
            url = item.get("url", "")
            if not url:
                continue
            tracks.append({
                "id":       f"vk_{item.get('owner_id')}_{item.get('id')}",
                "artist":   item.get("artist", "Unknown"),
                "title":    item.get("title", "Unknown"),
                "duration": item.get("duration", 0),
                "cover":    _get_cover(item),
                "source":   "vk",
                "url":      url,
            })
        return tracks
    except Exception as e:
        log.error(f"VK search error: {e}")
        return []

def vk_popular_sync(genre_id: int = 0, count: int = 50) -> list[dict]:
    """Популярные треки VK по жанру"""
    try:
        vk = vk_api.VkApi(token=VK_TOKEN)
        result = vk.method("audio.getPopular", {
            "genre_id": genre_id,
            "count": count,
            "only_eng": 0,
        })
        tracks = []
        for item in result:
            url = item.get("url", "")
            if not url:
                continue
            tracks.append({
                "id":       f"vk_{item.get('owner_id')}_{item.get('id')}",
                "artist":   item.get("artist", "Unknown"),
                "title":    item.get("title", "Unknown"),
                "duration": item.get("duration", 0),
                "cover":    _get_cover(item),
                "source":   "vk",
                "url":      url,
            })
        return tracks
    except Exception as e:
        log.error(f"VK popular error: {e}")
        return []

def _get_cover(item: dict) -> str:
    """Извлекает URL обложки из VK трека"""
    try:
        thumb = item.get("album", {}).get("thumb", {}) or {}
        for key in ["photo_600", "photo_300", "photo_270", "photo_135"]:
            if thumb.get(key):
                return thumb[key]
    except Exception:
        pass
    return ""

# ─── Воспроизведение ──────────────────────────────────────────────────────────
async def play_next():
    global current_track, is_playing, played_today
    if not queue:
        is_playing = False
        current_track = None
        log.info("Очередь пуста, остановка")
        return

    track = queue.pop(0)
    url = track.get("url", "")

    if not url:
        log.warning(f"Нет URL для трека: {track.get('artist')} - {track.get('title')}, пропускаем")
        await play_next()
        return

    current_track = track
    is_playing = True
    played_today += 1

    log.info(f"▶ Играем: {track['artist']} - {track['title']}")

    try:
        await calls.join_group_call(
            CHAT_ID,
            AudioPiped(url),
            stream_type=None,
        )
    except Exception as e:
        log.error(f"Ошибка воспроизведения: {e}")
        await asyncio.sleep(2)
        await play_next()

@calls.on_stream_end()
async def stream_end_handler(_, update):
    log.info("Трек закончился, переходим к следующему")
    await play_next()

# ─── REST API для дашборда ────────────────────────────────────────────────────
routes = web.RouteTableDef()

def cors_headers():
    return {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    }

def json_resp(data, status=200):
    return web.Response(
        text=json.dumps(data, ensure_ascii=False),
        content_type="application/json",
        headers=cors_headers(),
        status=status,
    )

@routes.options("/{tail:.*}")
async def options_handler(request):
    return web.Response(headers=cors_headers())

@routes.get("/api/ping")
async def ping(request):
    return json_resp({"ok": True, "version": "1.0"})

@routes.get("/api/status")
async def status(request):
    uptime = int(time.time() - start_time)
    return json_resp({
        "isConnected": True,
        "isPlaying":   is_playing,
        "currentTrack": current_track,
        "queueLength": len(queue),
        "playedToday": played_today,
        "uptime":      uptime,
        "chatTitle":   str(CHAT_ID),
        "listeners":   0,
    })

@routes.get("/api/search")
async def search(request):
    q = request.rel_url.query.get("q", "").strip()
    count = int(request.rel_url.query.get("count", 50))
    if not q:
        return json_resp({"error": "Пустой запрос"}, 400)
    loop = asyncio.get_event_loop()
    tracks = await loop.run_in_executor(None, vk_search_sync, q, count)
    return json_resp(tracks)

@routes.get("/api/popular")
async def popular(request):
    genre_id = int(request.rel_url.query.get("genre_id", 0))
    count = int(request.rel_url.query.get("count", 50))
    loop = asyncio.get_event_loop()
    tracks = await loop.run_in_executor(None, vk_popular_sync, genre_id, count)
    return json_resp(tracks)

@routes.get("/api/queue")
async def get_queue(request):
    return json_resp(queue)

@routes.post("/api/queue/add")
async def add_to_queue(request):
    track = await request.json()
    queue.append(track)
    log.info(f"+ В очередь: {track.get('artist')} - {track.get('title')}")
    if not is_playing:
        asyncio.create_task(play_next())
    return json_resp({"ok": True})

@routes.delete("/api/queue/remove/{queue_id}")
async def remove_from_queue(request):
    qid = request.match_info["queue_id"]
    before = len(queue)
    queue[:] = [t for t in queue if t.get("queueId") != qid]
    return json_resp({"ok": before != len(queue)})

@routes.post("/api/queue/clear")
async def clear_queue(request):
    queue.clear()
    return json_resp({"ok": True})

@routes.post("/api/play")
async def play(request):
    track = await request.json()
    queue.insert(0, track)
    asyncio.create_task(play_next())
    return json_resp({"ok": True})

@routes.post("/api/skip")
async def skip(request):
    asyncio.create_task(play_next())
    return json_resp({"ok": True})

@routes.post("/api/pause")
async def pause(request):
    global is_playing
    try:
        await calls.pause_stream(CHAT_ID)
        is_playing = False
    except Exception as e:
        log.error(f"Pause error: {e}")
    return json_resp({"ok": True})

@routes.post("/api/resume")
async def resume(request):
    global is_playing
    try:
        await calls.resume_stream(CHAT_ID)
        is_playing = True
    except Exception as e:
        log.error(f"Resume error: {e}")
    return json_resp({"ok": True})

@routes.post("/api/stop")
async def stop(request):
    global is_playing, current_track
    try:
        await calls.leave_group_call(CHAT_ID)
    except Exception:
        pass
    queue.clear()
    is_playing = False
    current_track = None
    return json_resp({"ok": True})

# ─── Telegram команды ──────────────────────────────────────────────────────────
@bot.on_message(filters.command("play") & filters.chat(CHAT_ID))
async def cmd_play(client: Client, message: Message):
    q = " ".join(message.command[1:])
    if not q:
        await message.reply("❓ Использование: /play Исполнитель - Название")
        return
    await message.reply(f"🔍 Ищу: **{q}**...")
    loop = asyncio.get_event_loop()
    tracks = await loop.run_in_executor(None, vk_search_sync, q, 1)
    if not tracks:
        await message.reply("❌ Ничего не найдено")
        return
    track = tracks[0]
    queue.append(track)
    await message.reply(
        f"✅ Добавлено в очередь:\\n"
        f"🎵 **{track['artist']} — {track['title']}**"
    )
    if not is_playing:
        asyncio.create_task(play_next())

@bot.on_message(filters.command("np") & filters.chat(CHAT_ID))
async def cmd_np(client: Client, message: Message):
    if current_track and is_playing:
        mins, secs = divmod(current_track.get("duration", 0), 60)
        await message.reply(
            f"▶ **Сейчас играет:**\\n"
            f"🎵 {current_track['artist']} — {current_track['title']}\\n"
            f"⏱ {mins}:{secs:02d} | В очереди: {len(queue)} треков"
        )
    else:
        await message.reply("🔇 Ничего не играет")

@bot.on_message(filters.command("skip") & filters.chat(CHAT_ID))
async def cmd_skip(client: Client, message: Message):
    await message.reply("⏭ Пропускаем...")
    asyncio.create_task(play_next())

@bot.on_message(filters.command("stop") & filters.chat(CHAT_ID))
async def cmd_stop(client: Client, message: Message):
    global is_playing, current_track
    try:
        await calls.leave_group_call(CHAT_ID)
    except Exception:
        pass
    queue.clear()
    is_playing = False
    current_track = None
    await message.reply("⏹ Остановлено, очередь очищена")

@bot.on_message(filters.command("queue") & filters.chat(CHAT_ID))
async def cmd_queue(client: Client, message: Message):
    if not queue:
        await message.reply("📭 Очередь пуста")
        return
    lines = [f"{i+1}. {t['artist']} — {t['title']}" for i, t in enumerate(queue[:10])]
    if len(queue) > 10:
        lines.append(f"... и ещё {len(queue)-10} треков")
    await message.reply("🎵 **Очередь:**\\n" + "\\n".join(lines))

# ─── Запуск ───────────────────────────────────────────────────────────────────
async def main():
    log.info("🚀 Запускаем TG Music Bot Backend...")

    # Запускаем aiohttp сервер
    app = web.Application()
    app.add_routes(routes)
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", PORT)
    await site.start()
    log.info(f"✅ API сервер запущен на http://0.0.0.0:{PORT}")

    # Запускаем Telegram клиенты
    await userbot.start()
    log.info("✅ Userbot подключён")

    await bot.start()
    log.info("✅ Bot подключён")

    await calls.start()
    log.info("✅ PyTgCalls запущен")
    log.info("🎵 Бот готов к работе! Используй /play в Telegram чате")

    # Держим живым
    await asyncio.Event().wait()

if __name__ == "__main__":
    asyncio.run(main())
`;

  const INSTALL_CMD = `# 1. Создай папку и перейди в неё
mkdir tgmusicbot && cd tgmusicbot

# 2. Создай виртуальное окружение (рекомендуется)
python -m venv venv
source venv/bin/activate   # Linux/Mac
# venv\\Scripts\\activate   # Windows

# 3. Установи зависимости
pip install pyrogram TgCrypto "pytgcalls==3.0.0.dev29" aiohttp vk_api

# 4. Скопируй backend.py в эту папку и запусти
python backend.py`;

  const SYSTEMD_SERVICE = `# /etc/systemd/system/tgmusicbot.service
[Unit]
Description=TG Music Bot
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/tgmusicbot
ExecStart=/home/ubuntu/tgmusicbot/venv/bin/python backend.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target`;

  const steps = [
    {
      title: 'Получи VK Token (Kate Mobile)',
      done: !!s.vkToken,
      content: (
        <div className="space-y-3">
          <p className="text-zinc-400 text-sm">Это главное — без него треки не будут находиться:</p>
          <ol className="space-y-2 text-sm">
            {[
              <>Иди на <a href="https://vkhost.github.io" target="_blank" rel="noreferrer" className="text-blue-400 underline">vkhost.github.io</a></>,
              <>Нажми <strong className="text-white">Kate Mobile</strong> → <strong className="text-white">Разрешить</strong></>,
              <>В URL найди <code className="bg-zinc-800 px-1 rounded text-violet-300">access_token=vk1.a.XXXXX</code></>,
              <>Скопируй токен и вставь в <button className="text-blue-400 underline">Настройки → VK Token</button></>,
            ].map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-zinc-300">
                <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-amber-300 text-xs">
            ⚠️ Токен живёт ~1 год. Если поиск перестал работать — обнови токен тем же способом.
          </div>
        </div>
      ),
    },
    {
      title: 'Получи Telegram API ID и API Hash',
      done: !!(s.tgApiId && s.tgApiHash),
      content: (
        <div className="space-y-3">
          <ol className="space-y-2 text-sm">
            {[
              <>Иди на <a href="https://my.telegram.org" target="_blank" rel="noreferrer" className="text-blue-400 underline">my.telegram.org</a> → войди</>,
              <><strong className="text-white">API Development Tools</strong> → создай приложение</>,
              <>Скопируй <code className="bg-zinc-800 px-1 rounded text-violet-300">App api_id</code> и <code className="bg-zinc-800 px-1 rounded text-violet-300">App api_hash</code></>,
              <>Вставь в <span className="text-blue-400">Настройки → PyTgCalls</span></>,
            ].map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-zinc-300">
                <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                <span>{t}</span>
              </li>
            ))}
          </ol>
        </div>
      ),
    },
    {
      title: 'Создай Telegram бота через @BotFather',
      done: !!s.tgBotToken,
      content: (
        <div className="space-y-3 text-sm">
          {[
            <>Напиши <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-blue-400 underline">@BotFather</a> в Telegram</>,
            <><code className="bg-zinc-800 px-1 rounded">/newbot</code> → задай имя и username</>,
            <>Скопируй токен и вставь в <span className="text-blue-400">Настройки → Bot Token</span></>,
            <>Добавь бота в свой чат и дай права <strong className="text-white">Администратора</strong></>,
            <>Chat ID: напиши в чат <a href="https://t.me/userinfobot" target="_blank" rel="noreferrer" className="text-blue-400 underline">@userinfobot</a> и скопируй ID</>,
          ].map((t, i) => (
            <li key={i} className="flex items-start gap-2 text-zinc-300 list-none">
              <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
              <span>{t}</span>
            </li>
          ))}
        </div>
      ),
    },
    {
      title: 'Установи зависимости и запусти бэкенд',
      done: false,
      content: (
        <div className="space-y-4">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 text-blue-300 text-xs flex items-start gap-2">
            <Terminal size={14} className="flex-shrink-0 mt-0.5" />
            <span>Нужен Linux/Mac сервер (или Windows WSL). Python 3.10+</span>
          </div>
          <CodeBlock code={INSTALL_CMD} lang="bash" />
        </div>
      ),
    },
    {
      title: 'Скопируй и запусти backend.py',
      done: false,
      content: (
        <div className="space-y-4">
          <p className="text-zinc-400 text-sm">
            Полный код бота. Настройки уже подставлены из твоих данных в разделе Настройки:
          </p>
          <CodeBlock code={BACKEND_CODE} lang="python" />
          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 text-green-300 text-sm">
            ✅ После запуска дашборд автоматически подключится к бэкенду на{' '}
            <code className="bg-green-900/30 px-1 rounded">{s.backendUrl || 'http://localhost:8080'}</code>
          </div>
        </div>
      ),
    },
    {
      title: '24/7 — автозапуск через systemd (Linux)',
      done: false,
      content: (
        <div className="space-y-4">
          <p className="text-zinc-400 text-sm">Чтобы бот не останавливался при перезагрузке сервера:</p>
          <CodeBlock code={SYSTEMD_SERVICE} lang="ini" />
          <CodeBlock
            code={`sudo systemctl daemon-reload
sudo systemctl enable tgmusicbot
sudo systemctl start tgmusicbot
sudo systemctl status tgmusicbot  # проверь статус`}
            lang="bash"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Инструкция по запуску</h1>
        <p className="text-zinc-400 text-sm mt-1">Полная настройка бота от А до Я</p>
      </div>

      {/* Progress */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-zinc-400 text-sm">Прогресс настройки</span>
          <span className="text-white text-sm font-bold">
            {steps.filter(s => s.done).length}/{steps.length}
          </span>
        </div>
        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-600 to-blue-500 rounded-full transition-all"
            style={{ width: `${(steps.filter(s => s.done).length / steps.length) * 100}%` }}
          />
        </div>
        <div className="flex gap-2 mt-3 flex-wrap">
          {steps.map((step, i) => (
            <div key={i} className={cn(
              'flex items-center gap-1 text-xs px-2 py-1 rounded-lg',
              step.done ? 'bg-green-500/10 text-green-400' : 'bg-zinc-800 text-zinc-500'
            )}>
              {step.done ? <CheckCircle size={10} /> : <Circle size={10} />}
              Шаг {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, i) => (
          <Step
            key={i}
            n={i + 1}
            title={step.title}
            done={step.done}
            open={openStep === i}
            onToggle={() => toggle(i)}
          >
            {step.content}
          </Step>
        ))}
      </div>

      {/* Requirements.txt */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
        <h3 className="text-white font-semibold text-sm">📄 requirements.txt</h3>
        <CodeBlock code={REQUIREMENTS} lang="text" />
      </div>
    </div>
  );
}

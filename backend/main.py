#!/usr/bin/env python3
"""
TG Music Bot Backend
Деплой на Render.com — бесплатно и без терминала!
"""

import asyncio
import logging
import os
import time
import json
import aiohttp
from aiohttp import web

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger(__name__)

# ── Настройки из переменных окружения Render ────────────────────────────────
VK_TOKEN  = os.getenv("VK_TOKEN", "")
BOT_TOKEN = os.getenv("BOT_TOKEN", "")
API_ID    = os.getenv("API_ID", "")
API_HASH  = os.getenv("API_HASH", "")
PHONE     = os.getenv("PHONE", "")
CHAT_ID   = os.getenv("CHAT_ID", "")
PORT      = int(os.getenv("PORT", "10000"))  # Render использует 10000

# ── Состояние бота ───────────────────────────────────────────────────────────
state = {
    "queue": [],
    "current": None,
    "playing": False,
    "paused": False,
    "volume": 100,
    "uptime_start": time.time(),
    "total_played": 0,
    "bot_started": False,
    "error": None,
}

# ── CORS middleware ──────────────────────────────────────────────────────────
@web.middleware
async def cors_middleware(request, handler):
    if request.method == "OPTIONS":
        resp = web.Response()
        resp.headers["Access-Control-Allow-Origin"] = "*"
        resp.headers["Access-Control-Allow-Methods"] = "GET,POST,DELETE,OPTIONS"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
        return resp
    try:
        resp = await handler(request)
    except web.HTTPException as e:
        resp = web.Response(status=e.status, text=str(e.reason))
    resp.headers["Access-Control-Allow-Origin"] = "*"
    resp.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
    return resp

# ── VK API helper ────────────────────────────────────────────────────────────
async def vk_request(method: str, params: dict) -> dict:
    params["access_token"] = VK_TOKEN
    params["v"] = "5.131"
    url = f"https://api.vk.com/method/{method}"
    async with aiohttp.ClientSession() as session:
        async with session.post(url, data=params, timeout=aiohttp.ClientTimeout(total=15)) as r:
            data = await r.json()
            if "error" in data:
                raise Exception(f"VK Error {data['error']['error_code']}: {data['error']['error_msg']}")
            return data.get("response", {})

def track_to_dict(item: dict) -> dict:
    cover = ""
    if item.get("album") and item["album"].get("thumb"):
        thumb = item["album"]["thumb"]
        cover = (
            thumb.get("photo_270") or
            thumb.get("photo_135") or
            thumb.get("photo_68") or ""
        )
    return {
        "id": str(item.get("id", "")),
        "owner_id": str(item.get("owner_id", "")),
        "title": item.get("title", "Unknown"),
        "artist": item.get("artist", "Unknown"),
        "duration": item.get("duration", 0),
        "url": item.get("url", ""),
        "cover": cover,
        "album": item.get("album", {}).get("title", "") if item.get("album") else "",
    }

# ── API Routes ───────────────────────────────────────────────────────────────

async def handle_root(request):
    return web.json_response({"status": "ok", "message": "TG Music Bot API is running!", "time": int(time.time())})

async def handle_health(request):
    return web.json_response({"status": "ok", "time": int(time.time())})

async def handle_status(request):
    uptime = int(time.time() - state["uptime_start"])
    return web.json_response({
        "ok": True,
        "playing": state["playing"],
        "paused": state["paused"],
        "current": state["current"],
        "queue_length": len(state["queue"]),
        "volume": state["volume"],
        "uptime": uptime,
        "total_played": state["total_played"],
        "bot_started": state["bot_started"],
        "vk_configured": bool(VK_TOKEN),
        "tg_configured": bool(BOT_TOKEN and API_ID and API_HASH),
        "error": state["error"],
    })

async def handle_search(request):
    q = request.rel_url.query.get("q", "").strip()
    count = int(request.rel_url.query.get("count", "50"))
    if not q:
        return web.json_response({"error": "Пустой запрос"}, status=400)
    if not VK_TOKEN:
        return web.json_response({"error": "VK_TOKEN не задан в переменных Render"}, status=500)
    try:
        resp = await vk_request("audio.search", {
            "q": q,
            "count": min(count, 300),
            "sort": 0,
            "auto_complete": 1,
            "lyrics": 0,
            "performer_only": 0,
        })
        items = resp.get("items", [])
        tracks = [track_to_dict(t) for t in items if t.get("url")]
        return web.json_response(tracks)
    except Exception as e:
        log.error(f"Search error: {e}")
        return web.json_response({"error": str(e)}, status=500)

async def handle_popular(request):
    genre_id = int(request.rel_url.query.get("genre_id", "0"))
    count = int(request.rel_url.query.get("count", "50"))
    if not VK_TOKEN:
        return web.json_response({"error": "VK_TOKEN не задан"}, status=500)
    try:
        params = {"count": min(count, 300), "only_eng": 0}
        if genre_id:
            params["genre_id"] = genre_id
        resp = await vk_request("audio.getPopular", params)
        tracks = [track_to_dict(t) for t in (resp if isinstance(resp, list) else []) if t.get("url")]
        return web.json_response(tracks)
    except Exception as e:
        log.error(f"Popular error: {e}")
        return web.json_response({"error": str(e)}, status=500)

async def handle_get_queue(request):
    return web.json_response(state["queue"])

async def handle_add_queue(request):
    try:
        track = await request.json()
        if not track.get("url") and track.get("id") and track.get("owner_id") and VK_TOKEN:
            try:
                resp = await vk_request("audio.getById", {
                    "audios": f"{track['owner_id']}_{track['id']}"
                })
                if resp and len(resp) > 0:
                    track["url"] = resp[0].get("url", "")
            except:
                pass

        queue_track = {
            **track,
            "queue_id": str(int(time.time() * 1000)),
            "added_at": int(time.time()),
        }
        state["queue"].append(queue_track)
        log.info(f"Added to queue: {track.get('artist')} — {track.get('title')}")

        if not state["playing"] and not state["paused"]:
            await start_playing()

        return web.json_response({"ok": True, "queue_length": len(state["queue"])})
    except Exception as e:
        log.error(f"Add queue error: {e}")
        return web.json_response({"error": str(e)}, status=500)

async def handle_remove_queue(request):
    queue_id = request.match_info.get("queue_id")
    before = len(state["queue"])
    state["queue"] = [t for t in state["queue"] if t.get("queue_id") != queue_id]
    return web.json_response({"ok": True, "removed": before - len(state["queue"])})

async def handle_clear_queue(request):
    state["queue"] = []
    return web.json_response({"ok": True})

async def handle_skip(request):
    await next_track()
    return web.json_response({"ok": True, "current": state["current"]})

async def handle_pause(request):
    state["paused"] = not state["paused"]
    state["playing"] = not state["paused"]
    return web.json_response({"ok": True, "paused": state["paused"]})

async def handle_stop(request):
    state["playing"] = False
    state["paused"] = False
    state["current"] = None
    return web.json_response({"ok": True})

async def handle_volume(request):
    try:
        data = await request.json()
        vol = max(0, min(200, int(data.get("volume", 100))))
        state["volume"] = vol
        return web.json_response({"ok": True, "volume": vol})
    except Exception as e:
        return web.json_response({"error": str(e)}, status=400)

async def handle_move_queue(request):
    try:
        data = await request.json()
        from_idx = int(data.get("from", 0))
        to_idx = int(data.get("to", 0))
        q = state["queue"]
        if 0 <= from_idx < len(q) and 0 <= to_idx < len(q):
            item = q.pop(from_idx)
            q.insert(to_idx, item)
        return web.json_response({"ok": True})
    except Exception as e:
        return web.json_response({"error": str(e)}, status=400)

async def handle_config(request):
    return web.json_response({
        "vk_token_set": bool(VK_TOKEN),
        "bot_token_set": bool(BOT_TOKEN),
        "api_id_set": bool(API_ID),
        "api_hash_set": bool(API_HASH),
        "phone_set": bool(PHONE),
        "chat_id": CHAT_ID,
    })

# ── Логика воспроизведения ───────────────────────────────────────────────────
async def start_playing():
    if not state["queue"]:
        state["playing"] = False
        state["current"] = None
        return
    track = state["queue"][0]
    state["current"] = track
    state["playing"] = True
    state["paused"] = False
    state["total_played"] += 1
    log.info(f"▶ Now playing: {track.get('artist')} — {track.get('title')}")
    duration = track.get("duration", 180)
    asyncio.create_task(auto_next(duration))

async def auto_next(duration: int):
    await asyncio.sleep(duration)
    if state["playing"] and not state["paused"]:
        await next_track()

async def next_track():
    if state["queue"]:
        state["queue"].pop(0)
    await start_playing()

# ── Keep-alive пинг (чтобы Render не засыпал) ───────────────────────────────
async def keep_alive():
    """Render на бесплатном тарифе засыпает через 15 мин — пингуем сами себя"""
    await asyncio.sleep(60)  # Ждём запуска
    while True:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"http://localhost:{PORT}/health",
                    timeout=aiohttp.ClientTimeout(total=10)
                ) as r:
                    log.info(f"Keep-alive ping: {r.status}")
        except Exception as e:
            log.warning(f"Keep-alive failed: {e}")
        await asyncio.sleep(840)  # Каждые 14 минут

# ── Запуск сервера ───────────────────────────────────────────────────────────
async def main():
    app = web.Application(middlewares=[cors_middleware])

    app.router.add_get("/",                  handle_root)
    app.router.add_get("/health",            handle_health)
    app.router.add_get("/api/status",        handle_status)
    app.router.add_get("/api/config",        handle_config)
    app.router.add_get("/api/search",        handle_search)
    app.router.add_get("/api/popular",       handle_popular)
    app.router.add_get("/api/queue",         handle_get_queue)
    app.router.add_post("/api/queue/add",    handle_add_queue)
    app.router.add_delete("/api/queue/{queue_id}", handle_remove_queue)
    app.router.add_post("/api/queue/clear",  handle_clear_queue)
    app.router.add_post("/api/queue/move",   handle_move_queue)
    app.router.add_post("/api/skip",         handle_skip)
    app.router.add_post("/api/pause",        handle_pause)
    app.router.add_post("/api/stop",         handle_stop)
    app.router.add_post("/api/volume",       handle_volume)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "0.0.0.0", PORT)
    await site.start()

    log.info(f"✅ Backend запущен на порту {PORT}")
    log.info(f"   VK Token:  {'✅ задан' if VK_TOKEN  else '❌ не задан'}")
    log.info(f"   Bot Token: {'✅ задан' if BOT_TOKEN else '❌ не задан'}")
    log.info(f"   Chat ID:   {CHAT_ID or '❌ не задан'}")

    state["bot_started"] = True

    # Запускаем keep-alive в фоне
    asyncio.create_task(keep_alive())

    while True:
        await asyncio.sleep(3600)

if __name__ == "__main__":
    asyncio.run(main())

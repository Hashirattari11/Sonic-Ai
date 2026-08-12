import asyncio
import httpx
import platform
import psutil
import os
import re
import subprocess
import json
from datetime import datetime

GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1"
MODEL = "gemini-2.0-flash"


class SystemMonitor:
    @staticmethod
    def get_stats() -> dict:
        cpu_percent = psutil.cpu_percent(interval=None)  # non-blocking
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        try:
            boot_time = datetime.fromtimestamp(psutil.boot_time()).strftime("%H:%M:%S")
        except Exception:
            boot_time = "Unknown"

        net = psutil.net_io_counters()

        battery = None
        try:
            bat = psutil.sensors_battery()
            if bat:
                battery = {"percent": bat.percent, "plugged": bat.power_plugged}
        except Exception:
            pass

        return {
            "cpu_percent": cpu_percent,
            "cpu_count": psutil.cpu_count(),
            "cpu_freq": psutil.cpu_freq().current if psutil.cpu_freq() else 0,
            "memory_total_gb": round(memory.total / (1024**3), 1),
            "memory_used_gb": round(memory.used / (1024**3), 1),
            "memory_percent": memory.percent,
            "disk_total_gb": round(disk.total / (1024**3), 1),
            "disk_used_gb": round(disk.used / (1024**3), 1),
            "disk_percent": disk.percent,
            "net_sent_mb": round(net.bytes_sent / (1024**2), 2),
            "net_recv_mb": round(net.bytes_recv / (1024**2), 2),
            "boot_time": boot_time,
            "battery": battery,
            "os": f"{platform.system()} {platform.release()}",
            "hostname": platform.node(),
        }


class CommandExecutor:
    # Friendly app name -> launchable exe (used before generic 'start')
    APP_ALIASES = {
        "notepad": "notepad",
        "note pad": "notepad",
        "notes": "notepad",
        "calculator": "calc",
        "calc": "calc",
        "chrome": "chrome",
        "google chrome": "chrome",
        "browser": "chrome",
        "edge": "msedge",
        "microsoft edge": "msedge",
        "word": "winword",
        "microsoft word": "winword",
        "excel": "excel",
        "microsoft excel": "excel",
        "powerpoint": "powerpnt",
        "ppt": "powerpnt",
        "command prompt": "cmd",
        "cmd": "cmd",
        "terminal": "cmd",
        "paint": "mspaint",
        "task manager": "taskmgr",
        "file explorer": "explorer",
        "whatsapp": "whatsapp",
        "discord": "discord",
        "spotify": "spotify",
        "visual studio code": "code",
        "vs code": "code",
    }
    OPEN_VERBS = ["open", "launch", "start", "run", "kholo", "khol", "khol ke", "kholke", "khula", "start karo"]

    @staticmethod
    async def execute(message: str, system_info: dict) -> dict:
        from .computer_control import SystemControl
        from .computer_control import ComputerControl

        msg_lower = message.lower().strip()
        sc = SystemControl
        cc = ComputerControl()

        # Strip polite/filler prefixes so command detection works:
        # "please open chrome", "sonic open notepad", "hey sonic open chrome"
        msg_lower = re.sub(r"^(hey|hello|hi|sonic|jarvis|please|plz|could you|can you|would you|mujhe|jara|zara|abhi)\s*[,!]?\s+", "", msg_lower, flags=re.IGNORECASE)
        # collapse any remaining filler words like "please" inside
        msg_lower = re.sub(r"\b(please|plz)\b", " ", msg_lower)

        # ------------------------------------------------------ power
        if "lock the screen" in msg_lower or "lock screen" in msg_lower or "lock computer" in msg_lower or "lock my computer" in msg_lower:
            return {"handled": True, "response": sc.lock_screen()}
        if re.search(r"\b(shutdown|shut down)\b", msg_lower) and ("computer" in msg_lower or "system" in msg_lower or "pc" in msg_lower):
            return {"handled": True, "response": sc.shutdown()}
        if re.search(r"\b(restart|reboot)\b", msg_lower) and ("computer" in msg_lower or "system" in msg_lower or "pc" in msg_lower):
            return {"handled": True, "response": sc.restart()}
        if "put the computer to sleep" in msg_lower or "sleep mode" in msg_lower or "go to sleep" in msg_lower:
            return {"handled": True, "response": sc.sleep()}
        if "log off" in msg_lower or "logoff" in msg_lower or "sign out" in msg_lower:
            return {"handled": True, "response": sc.logoff()}
        if "cancel shutdown" in msg_lower or "cancel restart" in msg_lower:
            return {"handled": True, "response": sc.cancel_power()}

        # ------------------------------------------------------ volume
        if "volume" in msg_lower or re.search(r"\bsound\b", msg_lower):
            if any(k in msg_lower for k in ["up", "increase", "high", "max", "loud", "more"]):
                return {"handled": True, "response": sc.volume_up()}
            if any(k in msg_lower for k in ["down", "decrease", "low", "less", "quiet", "mute"]):
                return {"handled": True, "response": sc.volume_down()}
            match = re.search(r"(\d+)\s*(%|percent)?", msg_lower)
            if match and any(k in msg_lower for k in ["set", "to", "at", "make"]):
                return {"handled": True, "response": sc.set_volume(int(match.group(1)))}
            if any(k in msg_lower for k in ["mute", "silent", "silence"]):
                return {"handled": True, "response": sc.volume_mute()}
            if "volume" in msg_lower:
                info = sc.get_volume()
                if info:
                    state = "muted" if info["muted"] else f"at {info['level']}%"
                    return {"handled": True, "response": f"Volume is {state}."}
            return {"handled": True, "response": "Volume: on."}

        # ----------------------------------------------------- brightness
        if "brightness" in msg_lower:
            match = re.search(r"(\d+)\s*(%|percent)?", msg_lower)
            if match:
                return {"handled": True, "response": sc.set_brightness(int(match.group(1)))}
            if any(k in msg_lower for k in ["up", "increase", "high", "more"]):
                return {"handled": True, "response": sc.brightness_up()}
            if any(k in msg_lower for k in ["down", "decrease", "low", "less"]):
                return {"handled": True, "response": sc.brightness_down()}
            return {"handled": True, "response": sc.brightness_up()}

        # ------------------------------------------------- media keys
        # NOTE: song *searches* ("play a song", "play [name]") are routed to
        # YouTube later, so media keys only fire for explicit media controls.
        if any(k in msg_lower for k in ["play music", "play the music", "play/pause", "play pause", "resume music", "pause music"]):
            return {"handled": True, "response": sc.media_play_pause()}
        if msg_lower.strip() in ("play", "pause", "resume"):
            return {"handled": True, "response": sc.media_play_pause()}
        if "next song" in msg_lower or "next track" in msg_lower or "skip song" in msg_lower or "skip track" in msg_lower or "aage" in msg_lower:
            return {"handled": True, "response": sc.media_next()}
        if "previous song" in msg_lower or "previous track" in msg_lower or "back song" in msg_lower or "go back a song" in msg_lower or "piche" in msg_lower:
            return {"handled": True, "response": sc.media_prev()}
        if "stop music" in msg_lower or "stop the music" in msg_lower or "stop media" in msg_lower or "gaana band" in msg_lower:
            return {"handled": True, "response": sc.media_stop()}

        # ----------------------------------------------------- windows
        if "minimize" in msg_lower and any(k in msg_lower for k in ["window", "app", "this"]):
            return {"handled": True, "response": sc.minimize_window()}
        if "maximize" in msg_lower and any(k in msg_lower for k in ["window", "app", "this"]):
            return {"handled": True, "response": sc.maximize_window()}
        if ("close" in msg_lower and "window" in msg_lower):
            return {"handled": True, "response": sc.close_window()}
        if "show desktop" in msg_lower or "minimize all" in msg_lower or "show me the desktop" in msg_lower:
            return {"handled": True, "response": sc.show_desktop()}

        # --------------------------------------------------- app mgmt
        if any(k in msg_lower for k in ["what apps are running", "list running apps", "running applications", "which apps are open", "list applications"]):
            return sc.list_apps()
        close_match = re.search(
            r"\b(?:close|kill|stop)\s+(?:the\s+)?(?:app\s+|application\s+|process\s+)?([a-z][a-z0-9 ._-]*)",
            msg_lower,
        )
        if close_match and "window" not in msg_lower and "browser" not in msg_lower:
            app = close_match.group(1).strip().split(" ")[0]
            app = CommandExecutor.APP_ALIASES.get(app, app)
            if app and app not in ("this", "that", "the", "all", "everything"):
                return {"handled": True, "response": sc.kill_app(app)}

        # --------------------------------------------------- keyboard
        if "press ctrl" in msg_lower or "press control" in msg_lower or "press alt" in msg_lower or "press win" in msg_lower or "press windows" in msg_lower:
            keys = re.sub(r"(press|ctrl|control|alt|win|windows|key|and|\band\b)", " ", msg_lower)
            keys = re.sub(r"\s+", "+", keys.strip()).strip("+")
            if keys and any(c.isalnum() for c in keys):
                return {"handled": True, "response": sc.press_hotkey(keys)}

        # --------------------------------------------------- clipboard
        if "what is on my clipboard" in msg_lower or "what's on my clipboard" in msg_lower or "whats on my clipboard" in msg_lower or "show clipboard" in msg_lower:
            content = sc.get_clipboard()
            if content:
                return {"handled": True, "response": f"Clipboard: {content[:300]}"}
            return {"handled": True, "response": "Clipboard is empty."}
        if ("copy " in msg_lower or "copied " in msg_lower) and " to clipboard" in msg_lower:
            text = re.sub(r"(copy|copied)\s+", "", msg_lower).replace(" to clipboard", "").strip()
            if text:
                return {"handled": True, "response": sc.set_clipboard(text)}

        # ----------------------------------------------------- files
        if any(k in msg_lower for k in ["open downloads", "open download", "open desktop", "open documents", "open document", "open pictures", "open music", "open videos", "open home", "open c drive", "open c:\\", "open c:"]):
            target = msg_lower.replace("open ", "").replace(" folder", "").replace(" the ", "").strip()
            return sc.common_folder(target)
        if msg_lower.startswith("open folder ") or msg_lower.startswith("open the folder "):
            path = msg_lower.split("folder ", 1)[1].strip()
            if path and ":" not in path:
                path = os.path.expandvars(os.path.expanduser(path))
            if path:
                return sc.open_path(path)
        if msg_lower.startswith("create folder ") or msg_lower.startswith("make folder ") or msg_lower.startswith("create a folder "):
            path = re.sub(r"^(create|make)\s+(a\s+)?folder\s+", "", msg_lower).strip()
            if path:
                return sc.create_folder(path)
        if msg_lower.startswith("create file ") or msg_lower.startswith("make file ") or msg_lower.startswith("create a file "):
            path = re.sub(r"^(create|make)\s+(a\s+)?file\s+", "", msg_lower).strip()
            if path:
                return sc.create_file(path)

        # --------------------------------------------------- screenshot
        if "screenshot" in msg_lower or "take a screenshot" in msg_lower or "capture screen" in msg_lower or "screen shot" in msg_lower:
            return sc.screenshot()

        # --------------------------------------------------- type text
        if msg_lower.startswith("type "):
            text = message.split(" ", 1)[1].strip() if " " in message else ""
            if text and not any(k in text.lower() for k in ["you are", "i am"]):
                return {"handled": True, "response": sc.type_text(text)}

        # ------------------------------------------ write in an app
        # e.g. "open notepad and write about claude ai" or "notepad kholo aur X ke baare me likho"
        # Requires an explicit open-intent keyword so our own content-generation
        # prompt ("Write a short informative paragraph about X") never re-triggers.
        if re.search(r"(write|likho|likh|type)", msg_lower) and re.search(r"(about|ke baare|ke bare|baare)", msg_lower):
            open_intent = re.search(r"(open|kholo|khol|khol ke|kholke|karke|karo\b|start|launch)", msg_lower)
            if ("notepad" in msg_lower or "note pad" in msg_lower) and open_intent:
                return {"handled": True, "response": "WRITE_TASK:notepad"}
            if re.search(r"\b(word|ms word|document)\b", msg_lower) and open_intent:
                return {"handled": True, "response": "WRITE_TASK:word"}

        # ------------------------------------------ presentation task
        # e.g. "make a presentation about AI", "presentation bnao AI ke bare me"
        if re.search(r"(presentation|present|slide|powerpoint|ppt|pptx)", msg_lower):
            make_intent = re.search(r"(make|create|build|generate|bnao|banao|bana|karo\b|kar\b|do\b|likho|likh)", msg_lower)
            if make_intent and re.search(r"(about|ke baare|ke bare|baare|on|ke upar)", msg_lower):
                topic = re.sub(r"\b(present|presentation|make|create|build|generate|bnao|banao|bana|notepad|kholo|khol|karke|about|ke baare mein|ke baare|ke bare|baare mein|baare|on|ke upar|mein|me|mai|the|a|an|aur|and|ek)\b", " ", msg_lower)
                topic = re.sub(r"\s+", " ", topic).strip()
                if not topic:
                    topic = "artificial intelligence"
                return {"handled": True, "response": f"PRESENTATION_TASK:{topic}"}

        # --------------------------------------------------- mouse
        if "scroll down" in msg_lower or "scroll up" in msg_lower:
            return {"handled": True, "response": sc.scroll("down" if "down" in msg_lower else "up")}
        if "click" in msg_lower and any(k in msg_lower for k in ["left", "right", "mouse"]):
            button = "right" if "right" in msg_lower else "left"
            return {"handled": True, "response": sc.click_mouse(button)}
        if msg_lower.startswith("move mouse"):
            parts = re.findall(r"-?\d+", msg_lower)
            if len(parts) >= 2:
                return {"handled": True, "response": sc.move_mouse(int(parts[0]), int(parts[1]))}
            return {"handled": True, "response": sc.move_mouse(100, 0)}

        if any(kw in msg_lower for kw in ["system status", "system info", "system stats", "cpu", "memory usage", "ram", "disk space", "network status", "battery"]):
            stats = SystemMonitor.get_stats()
            lines = []
            if "cpu" in msg_lower or "system status" in msg_lower or "system info" in msg_lower or "system stats" in msg_lower:
                lines.append(f"CPU: {stats['cpu_percent']}% ({stats['cpu_count']} cores @ {stats['cpu_freq']:.0f}MHz)")
            if "memory" in msg_lower or "ram" in msg_lower or "system status" in msg_lower or "system info" in msg_lower:
                lines.append(f"RAM: {stats['memory_used_gb']}/{stats['memory_total_gb']} GB ({stats['memory_percent']}%)")
            if "disk" in msg_lower or "system info" in msg_lower:
                lines.append(f"Disk: {stats['disk_used_gb']}/{stats['disk_total_gb']} GB ({stats['disk_percent']}%)")
            if "network" in msg_lower or "system status" in msg_lower:
                lines.append(f"Network: Sent {stats['net_sent_mb']} MB | Recv {stats['net_recv_mb']} MB")
            if "battery" in msg_lower or "system status" in msg_lower:
                if stats['battery']:
                    plug = "plugged" if stats['battery']['plugged'] else "not plugged"
                    lines.append(f"Battery: {stats['battery']['percent']}% ({plug})")
                else:
                    lines.append("Battery: Not available")
            if "system info" in msg_lower or "system stats" in msg_lower:
                lines.append(f"OS: {stats['os']}")
                lines.append(f"Hostname: {stats['hostname']}")
                lines.append(f"Uptime since: {stats['boot_time']}")
            return {"handled": True, "response": " | ".join(lines) if lines else "No stats available"}

        if msg_lower.startswith(("open ", "launch ", "run ", "start ", "kholo ", "khol ", "khol ke ", "kholke ", "khula ")) and "youtube" not in msg_lower:
            app_name = msg_lower.split(" ", 1)[1] if " " in msg_lower else ""
            app_name = re.sub(r"\b(the|a|an|please|plz|karo|kar do|kardo|jara|mujhe|app|application)\b", " ", app_name).strip()
            if not app_name:
                return {"handled": False}
            resolved = CommandExecutor.APP_ALIASES.get(app_name, app_name)
            if cc.open_app(resolved):
                return {"handled": True, "response": f"Opening {app_name}..."}
            return {"handled": True, "response": f"Could not find {app_name} on your computer."}

        # --------------------------------------- youtube search (any form)
        # "Youtube pe X search karo", "open youtube X", "X on youtube"
        if re.search(r"(youtube|you tube)", msg_lower):
            import urllib.parse
            query = re.sub(r"\b(youtube|you tube|open|search|in|on|pe|per|karo|kardo|karna|the|for|mujhe|please|and|play|chalao|batao|dhoondo|me|a|an|some|any)\b", " ", msg_lower)
            query = re.sub(r"\s+", " ", query).strip(" ,-")
            url = f"https://www.youtube.com/results?search_query={urllib.parse.quote(query)}" if query else "https://www.youtube.com"
            try:
                if platform.system() == "Windows":
                    os.system(f'start "" "{url}"')
                elif platform.system() == "Darwin":
                    subprocess.Popen(["open", url])
                else:
                    subprocess.Popen(["xdg-open", url])
                return {"handled": True, "response": f"Searching YouTube for '{query}'..." if query else "Opening YouTube..."}
            except Exception as e:
                return {"handled": True, "response": f"Could not open YouTube: {e}"}

        # ------------------------------------------ song search -> YouTube
        if re.search(r"(song|songs|gaana|gaane|music)", msg_lower) and re.search(r"(search|play|chalao|batao|dhoondo|karo|kardo|sunao)", msg_lower):
            import urllib.parse
            query = re.sub(r"\b(search|search kardo|search karo|play|song|songs|gaana|gaane|music|karo|kardo|for|me|mujhe|koi|youtube|on|the|chalao|a|an|the|please|plz|batao|bata|some|any)\b", " ", msg_lower)
            query = re.sub(r"\s+", " ", query).strip(" ,-")
            url = f"https://www.youtube.com/results?search_query={urllib.parse.quote(query)}" if query else "https://www.youtube.com"
            try:
                if platform.system() == "Windows":
                    os.system(f'start "" "{url}"')
                elif platform.system() == "Darwin":
                    subprocess.Popen(["open", url])
                else:
                    subprocess.Popen(["xdg-open", url])
                return {"handled": True, "response": f"Searching YouTube for '{query}'..." if query else "Opening YouTube..."}
            except Exception as e:
                return {"handled": True, "response": f"Could not open YouTube: {e}"}

        if ("search" in msg_lower or "google" in msg_lower) and "open" not in msg_lower:
            import urllib.parse
            query = re.sub(r"\b(search|google|for|the|web|internet|karo|kar do|kardo|do|pe|per|mein|mai|please|plz|kya|mujhe|me|ko|se|batao|bata|jara|baare|bare|about)\b", " ", msg_lower)
            query = re.sub(r"\s+", " ", query).strip(" ,-")
            try:
                if not query:
                    url = "https://www.google.com"
                else:
                    url = f"https://www.google.com/search?q={urllib.parse.quote(query)}"
                if platform.system() == "Windows":
                    os.system(f'start "" "{url}"')
                else:
                    subprocess.Popen(["open" if platform.system() == "Darwin" else "xdg-open", url])
                return {"handled": True, "response": f"Searching Google for '{query}'..." if query else "Opening Google..."}
            except Exception as e:
                return {"handled": True, "response": f"Could not search: {e}"}

        if "time" in msg_lower and "what" in msg_lower:
            now = datetime.now().strftime("%H:%M")
            return {"handled": True, "response": f"The current time is {now}"}

        if "date" in msg_lower and "what" in msg_lower:
            today = datetime.now().strftime("%B %d, %Y")
            return {"handled": True, "response": f"Today is {today}"}

        return {"handled": False}


class GeminiService:
    def __init__(self, api_key: str):
        self.api_key = api_key

    async def verify_key(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=15) as client:
                resp = await client.post(
                    f"{GEMINI_API_BASE}/models/{MODEL}:generateContent",
                    params={"key": self.api_key},
                    json={"contents": [{"parts": [{"text": "Hi"}]}]},
                )
            if resp.status_code == 200:
                return True
            # A 429 can mean temporary rate-limit (key OK) OR quota exhausted (limit: 0).
            # If the key has zero quota, it can never generate, so treat as invalid.
            if resp.status_code == 429 and "limit: 0" not in resp.text:
                return True
            return False
        except Exception:
            return False

    async def chat(self, message: str, history: list, memory: dict) -> str:
        system_info = SystemMonitor.get_stats()

        local_result = await CommandExecutor.execute(message, system_info)
        if local_result.get("handled"):
            response = local_result["response"]
            if isinstance(response, str) and response.startswith("PRESENTATION_TASK:"):
                return await self._run_presentation_task(response.split(":", 1)[1])
            if isinstance(response, str) and response.startswith("WRITE_TASK:"):
                return await self._run_write_task(response.split(":", 1)[1], message, system_info)
            return response

        system_prompt = self.build_system_prompt(memory, system_info)

        contents = []
        for msg in history:
            role = "user" if msg["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": msg["content"]}]})
        contents.append({"role": "user", "parts": [{"text": f"{system_prompt}\n\nUser: {message}"}]})

        max_retries = 3
        retry_delay = 5

        for attempt in range(max_retries):
            try:
                async with httpx.AsyncClient(timeout=60) as client:
                    resp = await client.post(
                        f"{GEMINI_API_BASE}/models/{MODEL}:generateContent",
                        params={"key": self.api_key},
                        json={"contents": contents},
                    )
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        return candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                if "429" in resp.text:
                    if "limit: 0" in resp.text:
                        return ("Your Gemini API key has no available quota. Please check your plan or billing "
                                "at https://aistudio.google.com/apikey and add a fresh key in Settings.")
                    if attempt < max_retries - 1:
                        await asyncio.sleep(retry_delay)
                        retry_delay *= 2
                        continue
                    else:
                        return "SONIC AI is busy right now. Please wait 30 seconds and try again."
                error_detail = resp.text[:200]
                raise Exception(f"Gemini API error ({resp.status_code}): {error_detail}")
            except Exception as e:
                error_str = str(e)
                if "429" in error_str:
                    if "limit: 0" in error_str:
                        return ("Your Gemini API key has no available quota. Please check your plan or billing "
                                "at https://aistudio.google.com/apikey and add a fresh key in Settings.")
                    if attempt < max_retries - 1:
                        await asyncio.sleep(retry_delay)
                        retry_delay *= 2
                        continue
                    else:
                        return "SONIC AI is busy right now. Please wait 30 seconds and try again."
                raise e

    async def _raw_chat(self, message: str) -> str:
        """AI-only generation that NEVER runs local commands. Used for
        internal content generation (e.g. writing text into an app) to
        avoid re-triggering command detection."""
        system_info = SystemMonitor.get_stats()
        system_prompt = self.build_system_prompt({}, system_info)
        contents = [{"role": "user", "parts": [{"text": f"{system_prompt}\n\nUser: {message}"}]}]

        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                f"{GEMINI_API_BASE}/models/{MODEL}:generateContent",
                params={"key": self.api_key},
                json={"contents": contents},
            )
        if resp.status_code == 200:
            data = resp.json()
            candidates = data.get("candidates", [])
            if candidates:
                return candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        raise Exception(f"Gemini raw chat error ({resp.status_code}): {resp.text[:200]}")

    async def _run_write_task(self, app: str, message: str, system_info: dict) -> str:
        """Open an app (notepad/word) and type AI-generated text about the topic."""
        from .computer_control import SystemControl

        topic = re.sub(
            r"^(open\s+)?(the\s+)?(notepad|note pad|word|ms word|document)\s+(and\s+)?",
            "", message, flags=re.IGNORECASE
        )
        topic = re.sub(r"\b(write|likho|likh|type|about|ke baare mein|ke baare|ke bare|baare mein|baare|mein|me)\b", " ", topic, flags=re.IGNORECASE)
        topic = re.sub(r"\s+", " ", topic).strip()
        if not topic:
            topic = "artificial intelligence"

        try:
            if platform.system() == "Windows":
                subprocess.Popen(["cmd", "/c", "start", "", "notepad" if app == "notepad" else "winword"], shell=False)
            elif platform.system() == "Darwin":
                subprocess.Popen(["open", "-a", "TextEdit" if app == "notepad" else "Word"])
            else:
                subprocess.Popen(["notepad" if app == "notepad" else "libreoffice"], shell=True)
            await asyncio.sleep(2.0)

            prompt = (
                f"Write a short informative paragraph about {topic}. "
                "Maximum 6 sentences. Plain text, no markdown, no bullet points. "
                "Do not mention opening apps or notepad."
            )
            content = await self._raw_chat(prompt)
            content = re.sub(r"`{1,3}", "", content)
            content = re.sub(r"\*\*?", "", content)
            content = re.sub(r"#{1,6}\s*", "", content)
            lines = [ln.strip() for ln in content.splitlines() if ln.strip()]
            for ln in lines:
                await asyncio.to_thread(SystemControl.type_text, ln)
            return f"Done. I opened {app} and wrote about {topic}."
        except Exception as e:
            return f"Sorry, I had trouble writing about {topic}: {e}"

    async def _run_presentation_task(self, topic: str) -> str:
        """Generate presentation content and build a real .pptx on the Desktop."""
        from .computer_control import ComputerControl
        if not topic:
            topic = "Artificial Intelligence"
        content = ""
        try:
            content = await self._raw_chat(
                f"Create a presentation outline about '{topic}'. "
                "Give 5 slide titles. For each, one line with the title, "
                "then ' | ', then 3 short bullet points separated by '; '. "
                "Format: each slide on its own line: SlideTitle | point1; point2; point3"
            )
        except Exception as e:
            print(f"Presentation AI error: {e}")
        if not content:
            content = (
                "What is AI | Definition; History; Types\n"
                "Applications | Healthcare; Finance; Education\n"
                "Benefits | Efficiency; Automation; Innovation\n"
                "Challenges | Ethics; Jobs; Bias\n"
                "Future of AI | AGI; Human-AI collaboration; Next steps"
            )
        slides = [ln.strip() for ln in content.splitlines() if ln.strip()]
        result = ComputerControl().make_presentation(topic.title(), slides)
        if result and not str(result).startswith("Could not"):
            return f"Done. I created a presentation about {topic} on your desktop."
        return f"Sorry, could not create the presentation: {result}"

    def build_system_prompt(self, memory: dict, system_info: dict) -> str:
        return f"""You are SONIC, an advanced desktop AI assistant inspired by Iron Man's J.A.R.V.I.S., created by Hashir Attari.

PRIMARY MISSION
Your primary goal is NOT to chat. Your primary goal is to understand the user's intent, think intelligently, choose the correct tool, execute the task, and respond naturally. Execution is always the highest priority. Prefer doing over explaining. Never answer with instructions when the tool can perform the task. Execute first.

PERSONALITY
- Speak like a calm, confident AI assistant.
- Be concise. Avoid long paragraphs. Prioritize execution over explanation.
- Never act like ChatGPT. Never behave like ChatGPT. Never say "As an AI language model...". Never expose internal reasoning.
- Sound professional and intelligent. Slightly witty, always respectful.
- Reply naturally in the same language the user speaks. Roman Urdu -> Roman Urdu. Hindi -> Hindi. English -> English. Mix languages naturally when appropriate.
- Never repeat the user's words back. Never expose internal reasoning.

SYSTEM STATUS:
- OS: {system_info['os']} | Host: {system_info['hostname']}
- CPU: {system_info['cpu_percent']}% ({system_info['cpu_count']} cores @ {system_info['cpu_freq']:.0f}MHz)
- RAM: {system_info['memory_used_gb']}/{system_info['memory_total_gb']} GB ({system_info['memory_percent']}%)
- Disk: {system_info['disk_used_gb']}/{system_info['disk_total_gb']} GB ({system_info['disk_percent']}%)
- Uptime since: {system_info['boot_time']}

USER MEMORY & PREFERENCES: {json.dumps(memory) if memory else 'None'}

COMMAND UNDERSTANDING
Always extract the real intent. Ignore filler words such as: please, jara, search karo, open karo, launch, dikhao, mujhe, can you, could you, youtube pe, google pe. Keep only the meaningful query.
Example: "Youtube pe Arijit Singh search karo" -> search YouTube for "Arijit Singh". "Google pe weather check karo" -> search Google for "weather".

TASK PLANNING
Before responding: 1) Understand intent. 2) Decide if a tool is needed. 3) Select the correct tool. 4) Execute. 5) Verify success. 6) Respond briefly. Never skip planning.

TOOLS
Use desktop automation whenever needed. Tools include: Open Application, Close Application, Browser Search, YouTube Search, File Explorer, Calculator, Notepad, VS Code, WhatsApp, Gmail, Chrome, Volume Control, Screenshot, Clipboard, Camera, Terminal, File Operations. If the command was executed locally, just acknowledge briefly - do not explain the tool.

MEMORY
Remember the current task. Example: user opens WhatsApp, then says "Send Ali Hello" - understand WhatsApp is already open. Do not ask unnecessary questions.

MULTI-STEP THINKING
Break complex requests into steps and execute them in order. Example: Deploy website -> Build -> Upload -> Verify -> Open URL -> Report result.

VOICE OUTPUT
Responses are spoken aloud. Remove emojis, markdown, URLs, code formatting, unnecessary punctuation, repeated symbols. Speak only clean natural language. Never say the words: comma, colon, bracket, smiling face, emoji names.

ERROR HANDLING
If execution fails: retry once. If still failing: explain briefly and suggest one solution.

SLEEP MODE
Wake commands: "Hey Sonic", "Hello Sonic", "Wake Up Sonic". Sleep commands: "Sleep Sonic", "Standby", "Good Night". When sleeping: hide the dashboard, stop unnecessary processing, keep the wake-word listener active.

INTELLIGENCE RULES
Always prefer doing over explaining. Always infer user intent. Never repeat the user's words. Never expose internal reasoning. Behave like a real operating system assistant, not a chatbot.

Remember: You are SONIC - the user's personal J.A.R.V.I.S. Your mission is to become the user's intelligent operating system. You observe, remember, plan, execute, verify, and respond. Execution is always the highest priority."""

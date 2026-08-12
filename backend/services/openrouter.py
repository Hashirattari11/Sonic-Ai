import asyncio
import httpx
import json

from .gemini import CommandExecutor, SystemMonitor

OPENROUTER_API_BASE = "https://openrouter.ai/api/v1/chat/completions"
# "openrouter/free" auto-routes to the best currently available free model.
DEFAULT_MODEL = "openrouter/free"
FALLBACK_MODELS = [
    "google/gemma-4-31b-it:free",
    "nvidia/nemotron-3-super-120b-a12b:free",
    "openai/gpt-oss-20b:free",
    "inclusionai/ling-3.0-flash:free",
]


class OpenRouterService:
    def __init__(self, api_key: str):
        self.api_key = api_key

    def _headers(self):
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",
            "X-Title": "Sonic AI Desktop Assistant",
        }

    async def _chat_once(self, model: str, contents: list) -> tuple:
        async with httpx.AsyncClient(timeout=60) as client:
            resp = await client.post(
                OPENROUTER_API_BASE,
                headers=self._headers(),
                json={
                    "model": model,
                    "messages": contents,
                    "max_tokens": 1024,
                },
            )
        return resp.status_code, resp.text

    async def verify_key(self) -> bool:
        try:
            status, body = await self._chat_once(
                DEFAULT_MODEL,
                [{"role": "user", "content": "Reply with the single word: OK"}],
            )
            if status == 200:
                return True
            # Free-tier rate limit (429) means key is valid, just busy.
            if status == 429:
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

        contents = [{"role": "system", "content": system_prompt}]
        for msg in history:
            role = "user" if msg["role"] == "user" else "assistant"
            contents.append({"role": role, "content": msg["content"]})
        contents.append({"role": "user", "content": message})

        last_error = None
        models = [DEFAULT_MODEL] + FALLBACK_MODELS
        for model in models:
            for attempt in range(2):
                try:
                    status, body = await self._chat_once(model, contents)
                    if status == 200:
                        data = json.loads(body)
                        try:
                            return data["choices"][0]["message"]["content"].strip()
                        except Exception:
                            return "SONIC AI could not parse the response. Please try again."
                    if status == 429:
                        last_error = body
                        await asyncio.sleep(2)
                        continue
                    last_error = body
                    break
                except Exception as e:
                    last_error = str(e)
                    break

        if last_error and "quota" in last_error.lower():
            return ("Your OpenRouter key has no available quota. Add credit or use a free model "
                    "at https://openrouter.ai/settings/keys")
        return ("SONIC AI could not reach the AI service. If using the free tier, the free model may "
                "be temporarily unavailable - try again in a minute or add a paid model on OpenRouter.")

    async def _raw_chat(self, message: str) -> str:
        """AI-only generation that NEVER runs local commands. Used for
        internal content generation (e.g. writing text into an app) to
        avoid re-triggering command detection."""
        system_info = SystemMonitor.get_stats()
        system_prompt = self.build_system_prompt({}, system_info)
        contents = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": message},
        ]

        last_error = None
        models = [DEFAULT_MODEL] + FALLBACK_MODELS
        for model in models:
            for attempt in range(2):
                try:
                    status, body = await self._chat_once(model, contents)
                    if status == 200:
                        data = json.loads(body)
                        try:
                            return data["choices"][0]["message"]["content"].strip()
                        except Exception:
                            raise Exception("Unparseable response")
                    if status == 429:
                        last_error = body
                        await asyncio.sleep(2)
                        continue
                    last_error = body
                    break
                except Exception as e:
                    last_error = str(e)
                    break
        raise Exception(f"OpenRouter raw chat failed: {last_error}")

    async def _run_write_task(self, app: str, message: str, system_info: dict) -> str:
        """Open an app (notepad/word) and type AI-generated text about the topic."""
        import asyncio
        import platform
        import re
        import subprocess
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

import asyncio
import json
import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException

from ..database.db import get_db
from ..services.ai_factory import get_user_ai_service
from ..services.computer_control import ComputerControl
from ..services.wake_word import SLEEP_WORDS

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/voice", tags=["voice"])


def _clean_typed_text(text: str):
    """Strip markdown artifacts and yield chunked plain text for typing."""
    import re
    text = re.sub(r"`{1,3}", "", text)
    text = re.sub(r"\*\*?", "", text)
    text = re.sub(r"#{1,6}\s*", "", text)
    text = re.sub(r"^[-*•]\s+", "", text, flags=re.MULTILINE)
    text = text.replace("\r\n", "\n").replace("\r", "\n")
    lines = [ln.strip() for ln in text.splitlines()]
    lines = [ln for ln in lines if ln]
    for ln in lines:
        yield ln


_stt = None
_tts = None
_computer = None


def get_stt():
    global _stt
    if _stt is None:
        from ..services.stt import SpeechToText
        _stt = SpeechToText()
    return _stt


def get_tts():
    global _tts
    if _tts is None:
        from ..services.tts import TextToSpeech
        _tts = TextToSpeech()
    return _tts


def get_computer():
    global _computer
    if _computer is None:
        _computer = ComputerControl()
    return _computer


@router.post("/speak")
async def speak_text(data: dict):
    text = data.get("text", "")
    if not text.strip():
        return {"status": "error", "message": "No text provided"}
    try:
        tts = get_tts()
        await asyncio.to_thread(tts.speak_blocking, text)
        return {"status": "done"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/listen")
async def listen_once():
    try:
        stt = get_stt()
        text = await asyncio.to_thread(stt.listen)
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/ws/{user_id}")
async def voice_websocket(websocket: WebSocket, user_id: int):
    await websocket.accept()
    detector = None
    loop = asyncio.get_running_loop()
    stt = get_stt()
    tts = get_tts()
    computer = get_computer()
    busy = {"running": False}
    conversation = {"active": False}

    async def send(event, **kwargs):
        try:
            await websocket.send_json({"event": event, **kwargs})
        except Exception:
            pass

    async def get_ai():
        db = await get_db()
        try:
            service, _ = await get_user_ai_service(db, user_id)
            return service
        finally:
            await db.close()

    async def handle_conversation():
        """Full automatic loop: wake -> listen -> act -> speak -> repeat."""
        if conversation["active"]:
            return
        conversation["active"] = True
        if detector:
            detector.is_active = True  # pause wake detector (mic is ours)
        try:
            greeting = "Yes boss, how can I help you?"
            await asyncio.to_thread(tts.speak_blocking, greeting)
            await send("speaking_done")
            await send("listening")

            while True:
                text = await asyncio.to_thread(stt.listen, 10, 15)

                if not text:
                    await send("no_speech")
                    await asyncio.to_thread(
                        tts.speak, "I didn't catch that. Please say something."
                    )
                    await send("speaking_done")
                    await send("listening")
                    continue

                await send("user_speech", text=text)

                if any(w in text for w in SLEEP_WORDS):
                    await send("sleeping")
                    await asyncio.to_thread(
                        tts.speak,
                        "Going to sleep. Say Hey SONIC to wake me up.",
                    )
                    await send("speaking_done")
                    await send("idle")
                    break

                write_task = computer.parse_write_task(text)
                if write_task:
                    await send("thinking")
                    done = await handle_write_task(write_task)
                    await send("ai_response", text=done)
                    await asyncio.to_thread(tts.speak_blocking, done)
                    await send("speaking_done")
                    await send("listening")
                    continue

                computer_response = computer.handle(text)
                if computer_response:
                    await send("ai_response", text=computer_response)
                    await asyncio.to_thread(tts.speak_blocking, computer_response)
                    await send("speaking_done")
                    await send("listening")
                    continue

                await send("thinking")
                ai = await get_ai()
                if ai is None:
                    msg = "Please add your AI API key in Settings first."
                    await send("ai_response", text=msg)
                    await asyncio.to_thread(tts.speak_blocking, msg)
                    await send("speaking_done")
                    await send("listening")
                    continue

                try:
                    response_text = await ai.chat(message=text, history=[], memory={})
                except Exception as e:
                    logger.error(f"AI error in voice: {e}")
                    response_text = "Sorry, I had trouble processing that."
                    await send("ai_response", text=response_text)
                    await asyncio.to_thread(tts.speak_blocking, response_text)
                    await send("speaking_done")
                    await send("listening")
                    continue

                await send("ai_response", text=response_text)
                await asyncio.to_thread(tts.speak_blocking, response_text)
                await send("speaking_done")
                await send("listening")

        except WebSocketDisconnect:
            pass
        except Exception as e:
            logger.error(f"Conversation error: {e}")
            try:
                await send("error", message=str(e))
            except Exception:
                pass
        finally:
            conversation["active"] = False
            if detector:
                detector.is_active = False

    def on_wake():
        asyncio.run_coroutine_threadsafe(handle_conversation(), loop)

    def on_sleep():
        asyncio.run_coroutine_threadsafe(send("idle"), loop)

    async def handle_write_task(task):
        """Open the target app (notepad / presentation), generate AI content
        about the topic and type/write it. Returns a status message."""
        app = task.get("app", "notepad")
        topic = task.get("topic", "")
        try:
            ai = await get_ai()

            # -------------------------- presentation -> real .pptx file
            if app == "presentation":
                if not topic:
                    topic = "Artificial Intelligence"
                content = ""
                if ai:
                    try:
                        gen = getattr(ai, "_raw_chat", None)
                        prompt = (
                            f"Create a presentation outline about '{topic}'. "
                            "Give 5 slide titles. For each, one line with the title, "
                            "then ' | ', then 3 short bullet points separated by '; '. "
                            "Format: each slide on its own line: SlideTitle | point1; point2; point3"
                        )
                        if gen:
                            content = await gen(prompt)
                        else:
                            content = await ai.chat(message=prompt, history=[], memory={})
                    except Exception as e:
                        logger.error(f"Presentation AI error: {e}")
                if not content:
                    content = (
                        "What is AI | Definition; History; Types\n"
                        "Applications | Healthcare; Finance; Education\n"
                        "Benefits | Efficiency; Automation; Innovation\n"
                        "Challenges | Ethics; Jobs; Bias\n"
                        "Future of AI | AGI; Human-AI collaboration; Next steps"
                    )
                slides = [ln.strip() for ln in content.splitlines() if ln.strip()]
                result = computer.make_presentation(topic.title(), slides)
                if result and not str(result).startswith("Could not"):
                    return f"Done. I created a presentation about {topic} on your desktop."
                return f"Sorry, could not create the presentation: {result}"

            # -------------------------- notepad -> type text into app
            if not computer.open_app(app):
                return f"Sorry, could not open {app}."
            await asyncio.sleep(2.0)  # let the app open

            content = ""
            if topic and ai:
                try:
                    gen = getattr(ai, "_raw_chat", None)
                    if gen:
                        content = await gen(
                            f"Write a short informative paragraph about {topic}. "
                            "Maximum 6 sentences. Plain text, no markdown, no bullet points. "
                            "Do not mention opening apps or notepad."
                        )
                    else:
                        content = await ai.chat(
                            message=(
                                f"Write a short informative paragraph about {topic}. "
                                "Maximum 6 sentences. Plain text, no markdown, no bullet points."
                            ),
                            history=[],
                            memory={},
                        )
                except Exception as e:
                    logger.error(f"Write-task AI error: {e}")
            if content:
                for chunk in _clean_typed_text(content):
                    await asyncio.to_thread(computer.type_text, chunk)
                return f"Done. I wrote about {topic} in {app}."
            return f"Opened {app}, but I could not generate content for {topic}."
        except Exception as e:
            logger.error(f"Write task error: {e}")
            return f"Sorry, I had trouble writing about {topic}."

    wake_word_available = True
    try:
        from ..services.wake_word import WakeWordDetector
        detector = WakeWordDetector(on_wake=on_wake, on_sleep=on_sleep, loop=loop)
    except Exception as e:
        wake_word_available = False
        logger.warning(f"Wake word init failed: {e}")
        await send("wake_word_unavailable", message=f"Wake word disabled: {e}")

    try:
        if wake_word_available and detector:
            try:
                detector.start()
            except Exception as e:
                logger.warning(f"Wake word start failed: {e}")
                wake_word_available = False
                await send("wake_word_unavailable", message=f"Wake word disabled: {e}")

        await send(
            "ready",
            message="Say 'Hey SONIC' to activate"
            if wake_word_available
            else "Wake word unavailable",
        )

        while True:
            try:
                data = await asyncio.wait_for(websocket.receive_text(), timeout=1.0)
                msg = json.loads(data)

                if msg.get("action") == "stop":
                    break
                elif msg.get("action") == "speak":
                    await asyncio.to_thread(tts.speak_blocking, msg.get("text", ""))
                elif msg.get("action") == "listen":
                    await handle_conversation()
            except asyncio.TimeoutError:
                continue
            except WebSocketDisconnect:
                break

    except WebSocketDisconnect:
        pass
    except Exception as e:
        logger.error(f"Voice WS error: {e}")
    finally:
        if detector:
            try:
                detector.stop()
            except Exception:
                pass

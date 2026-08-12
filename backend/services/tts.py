import asyncio
import os
import re
import subprocess
import threading
import tempfile

import edge_tts

# Microsoft neural voices (free, high quality).
EN_VOICE = "en-US-GuyNeural"
HI_VOICE = "hi-IN-MadhurNeural"  # male Hindi

_DEVANAGARI = re.compile(r"[\u0900-\u097F]")

# Unicode blocks for emoji / pictographs / symbols that must never be spoken.
_EMOJI_RE = re.compile(
    "["
    "\U0001F300-\U0001FAFF"
    "\U0001F000-\U0001F0FF"
    "\U0001F1E6-\U0001F1FF"
    "\U00002600-\U000027BF"
    "\U00002300-\U000023FF"
    "\U00002B00-\U00002BFF"
    "\U00002700-\U000027BF"
    "\U0000FE00-\U0000FE0F"
    "\U0001F900-\U0001F9FF"
    "\U0000200D"
    "\U00002049"
    "\U0000203C"
    "\U0000FF00-\U0000FFEF"
    "\U00002500-\U000025BF"
    "\U000025C0-\U000025FF"
    "]+"
)


def clean_for_speech(text: str) -> str:
    """Strip anything that should never be read aloud: emojis, markdown
    markers, URLs, excessive punctuation. Keeps clean natural language."""
    if not text:
        return ""
    t = _EMOJI_RE.sub(" ", text)
    t = re.sub(r"https?://\S+|www\.\S+", " ", t)
    t = re.sub(r"[`*_~#]{1,6}", " ", t)          # markdown
    t = re.sub(r"\b(comma|colon|semicolon|bracket|asterisk|hashtag|smiling face|emoji)\b", " ", t, flags=re.IGNORECASE)
    t = re.sub(r"[(){}\[\]]", " ", t)
    t = re.sub(r"[\x00-\x1F]", " ", t)
    # collapse runs of punctuation like !!! or ... or ??? into a single mark
    t = re.sub(r"([!?.,])\1{1,}", r"\1", t)
    # URLs of spoken punctuation-ish symbols replaced with spaces
    t = re.sub(r"[^\w\s.,!?'-]", " ", t, flags=re.UNICODE)
    # smart quotes / fancy dashes to plain
    t = t.replace("\u2014", " ").replace("\u2013", " ").replace("\u201c", " ").replace("\u201d", " ")
    t = re.sub(r"\s+", " ", t).strip()
    return t


def _looks_hindi(text: str) -> bool:
    if _DEVANAGARI.search(text):
        return True
    # Common Hinglish/Roman-Hindi tokens -> speak in Hindi voice
    hindi_hints = [
        "namaste", "kaise ho", "main", "hoon", "hai", "haan", "nahi", "batao",
        "bata", "karo", "karo", "kar do", "kholo", "likho", "chalao", "bhai",
        "boss", "aap", "tum", "mujhe", "mera", "kya", "kaun", "kahan", "kab",
        "yeh", "woh", "sir", "theek", "gaana", "song", "sonic", "jarvis",
    ]
    words = text.lower().split()
    if not words:
        return False
    hits = sum(1 for w in words if w.strip(".,!?") in hindi_hints or w.strip(".,!?") in ("hi", "hindi"))
    return hits >= 1


class TextToSpeech:
    """High-quality neural TTS via Microsoft Edge (edge-tts).

    Automatically picks Hindi (hi-IN-MadhurNeural) for Hindi/Devanagari text
    and English (en-US-GuyNeural) otherwise. Speech happens on a worker thread
    so the event loop never blocks. speak() is asynchronous-friendly: it
    enqueues the phrase; use speak_blocking() if sequencing matters.
    """

    def __init__(self):
        self.is_speaking = False
        self._lock = threading.Lock()
        self._audio_players = []  # keep mp3 references alive while playing

    # ------------------------------------------------ internal synth + play
    async def _synth_to_file(self, text: str) -> str:
        fd, path = tempfile.mkstemp(suffix=".mp3", prefix="sonic_tts_")
        os.close(fd)
        text = clean_for_speech(text)
        voice = HI_VOICE if _looks_hindi(text) else EN_VOICE
        comm = edge_tts.Communicate(text, voice, rate="+8%", volume="+0%")
        await comm.save(path)
        return path

    def _play_file(self, path: str):
        try:
            subprocess.run(
                ["powershell", "-NoProfile", "-NonInteractive", "-Command",
                 f"(New-Object Media.SoundPlayer '{path}').PlaySync()"],
                capture_output=True, timeout=120,
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
            )
        finally:
            try:
                os.remove(path)
            except Exception:
                pass

    # ------------------------------------------------ public API
    def speak_blocking(self, text: str):
        """Synthesize + play synchronously (used when sequencing matters)."""
        if not text or not text.strip():
            return
        try:
            loop = asyncio.new_event_loop()
            try:
                path = loop.run_until_complete(self._synth_to_file(text))
            finally:
                loop.close()
            self._play_file(path)
        except Exception as e:
            print(f"TTS error: {e}")
            self._fallback_speak(text)

    def speak(self, text: str):
        """Queue TTS on a worker thread (non-blocking)."""
        if not text or not text.strip():
            return
        t = threading.Thread(target=self.speak_blocking, args=(text,), daemon=True)
        t.start()

    def _fallback_speak(self, text: str):
        """Last-resort: Windows SAPI so something is always said."""
        try:
            safe = text.replace("'", "''")
            ps = (
                "Add-Type -AssemblyName System.Speech;"
                "$s = New-Object System.Speech.Synthesis.SpeechSynthesizer;"
                "$s.Rate = 1;"
                f"$s.Speak('{safe}')"
            )
            subprocess.run(
                ["powershell", "-NoProfile", "-NonInteractive", "-Command", ps],
                capture_output=True, timeout=60,
                creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
            )
        except Exception as e:
            print(f"TTS fallback error: {e}")

    def stop(self):
        with self._lock:
            self.is_speaking = False

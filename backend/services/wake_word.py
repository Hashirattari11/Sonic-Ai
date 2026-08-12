import threading
import time

import asyncio

WAKE_WORDS = [
    "hey sonic", "hello sonic", "wake up sonic", "sonic",
    "hey jarvis", "hello jarvis", "wake up jarvis", "jarvis",
]
SLEEP_WORDS = [
    "sleep sonic", "go to sleep", "sleep", "standby", "good night",
    "goodbye", "goodbye sonic", "stop listening", "bye sonic", "shut down",
    "so ja", "so jao", "band ho jao", "band ho ja", "sone do", "sone ja",
]


class WakeWordDetector:
    """Listens in a background thread for a wake word.

    When a wake word is heard, `on_wake` fires (and the detector goes inactive
    so it does NOT fight the conversation loop for the microphone). When a
    sleep word is heard, `on_sleep` fires. Setting `is_active = False` resumes
    wake-word detection.
    """

    def __init__(self, on_wake=None, on_sleep=None, loop=None):
        self.on_wake = on_wake
        self.on_sleep = on_sleep
        self.loop = loop
        self.is_running = False
        self.is_active = False
        self.thread = None
        self.recognizer = None
        self._sr = None
        self._init_recognizer()

    def _init_recognizer(self):
        try:
            import speech_recognition as sr
            self._sr = sr
            self.recognizer = sr.Recognizer()
            self.recognizer.energy_threshold = 300
            self.recognizer.dynamic_energy_threshold = True
        except Exception as e:
            print(f"Wake word init warning: {e}")
            self.recognizer = None
            self._sr = None

    def start(self):
        self.is_running = True
        self.thread = threading.Thread(target=self._listen, daemon=True)
        self.thread.start()

    def stop(self):
        self.is_running = False

    def _trigger(self, callback):
        if not callback:
            return
        if self.loop is not None:
            try:
                asyncio.run_coroutine_threadsafe(callback(), self.loop)
                return
            except Exception:
                pass
        callback()

    def _listen(self):
        if not self._sr or not self.recognizer:
            self._init_recognizer()
            if not self._sr or not self.recognizer:
                print("Wake word unavailable: speech_recognition missing")
                return

        while self.is_running:
            if self.is_active:
                time.sleep(0.3)
                continue

            try:
                with self._sr.Microphone() as source:
                    self.recognizer.adjust_for_ambient_noise(source, duration=0.3)
                    audio = self.recognizer.listen(source, timeout=5, phrase_time_limit=4)
                    text = self.recognizer.recognize_google(audio).lower()
                    print(f"Wake word heard: {text}")

                    for sleep_word in SLEEP_WORDS:
                        if sleep_word in text:
                            print(f"Sleep word detected: {sleep_word}")
                            self._trigger(self.on_sleep)
                            return

                    for wake_word in WAKE_WORDS:
                        if wake_word in text:
                            print(f"Wake word detected: {wake_word}")
                            self._trigger(self.on_wake)
                            break

            except self._sr.WaitTimeoutError:
                continue
            except self._sr.UnknownValueError:
                continue
            except Exception as e:
                print(f"Wake word error: {e}")
                time.sleep(0.5)
                continue

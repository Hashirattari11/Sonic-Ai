class SpeechToText:
    def __init__(self):
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
            self.recognizer.pause_threshold = 0.8
        except Exception as e:
            print(f"STT init warning: {e}")
            self.recognizer = None
            self._sr = None

    def listen(self, timeout=10, phrase_limit=15) -> str:
        """Blocking microphone listen. Returns recognized text ('' if none)."""
        if not self.recognizer:
            self._init_recognizer()
            if not self.recognizer or not self._sr:
                return ""

        try:
            with self._sr.Microphone() as source:
                self.recognizer.adjust_for_ambient_noise(source, duration=0.5)
                audio = self.recognizer.listen(
                    source, timeout=timeout, phrase_time_limit=phrase_limit
                )
                return self.recognizer.recognize_google(audio)
        except self._sr.WaitTimeoutError:
            return ""
        except self._sr.UnknownValueError:
            return ""
        except Exception as e:
            print(f"STT error: {e}")
            return ""

    def record_until_silence(self, max_duration=30) -> str:
        return self.listen(timeout=10, phrase_limit=max_duration)

    async def transcribe_file(self, file_path: str) -> str:
        try:
            import speech_recognition as sr
        except ImportError:
            return ""
        if not self.recognizer:
            self._init_recognizer()
            if not self.recognizer:
                return ""
        try:
            with sr.AudioFile(file_path) as source:
                audio = self.recognizer.record(source)
            return self.recognizer.recognize_google(audio)
        except Exception as e:
            print(f"STT transcribe_file error: {e}")
            return ""

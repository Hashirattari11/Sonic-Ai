import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Bot, AudioWaveform, Loader2 } from 'lucide-react';

const statusConfig = {
  idle:     { label: 'Say "Hey SONIC" to activate', color: '#00d4ff' },
  listening:{ label: 'Listening...',                color: '#00ff88' },
  thinking: { label: 'Thinking...',                 color: '#7b2ff7' },
  speaking: { label: 'Speaking...',                 color: '#ffaa00' },
};

const VoiceModal = ({ isOpen, onClose, userId }) => {
  const [status, setStatus] = useState('idle');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [wakeWordAvailable, setWakeWordAvailable] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    if (!isOpen || !userId) return;

    setStatus('idle');
    setTranscript('');
    setResponse('');
    setWakeWordAvailable(true);
    setIsListening(false);

    wsRef.current = new WebSocket(`ws://localhost:8000/voice/ws/${userId}`);

    wsRef.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      switch (data.event) {
        case 'wake_word_detected': setStatus('listening'); break;
        case 'listening':          setStatus('listening'); setIsListening(true); break;
        case 'user_speech':        setTranscript(data.text); setStatus('thinking'); break;
        case 'thinking':           setStatus('thinking'); break;
        case 'ai_response':        setResponse(data.text); setStatus('speaking'); break;
        case 'speaking_done':      setStatus('idle'); setIsListening(false); break;
        case 'no_speech':          setStatus('idle'); setIsListening(false); break;
        case 'wake_word_unavailable': setWakeWordAvailable(false); break;
        case 'tts_unavailable':    setResponse(data.text); break;
        case 'error':              setResponse(data.message); setStatus('idle'); setIsListening(false); break;
        case 'ready':              break;
        default: break;
      }
    };

    wsRef.current.onclose = () => setIsListening(false);

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'stop' }));
      }
      wsRef.current?.close();
    };
  }, [isOpen, userId]);

  const handleListen = () => {
    if (isListening || !wsRef.current) return;
    if (wsRef.current.readyState !== WebSocket.OPEN) {
      setResponse('Voice server is not connected. Make sure the app is running.');
      return;
    }
    wsRef.current.send(JSON.stringify({ action: 'listen' }));
  };

  const cfg = statusConfig[status];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full max-w-lg glass-card rounded-3xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)]">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <Mic size={18} className="text-[var(--accent)]" /> Voice Mode
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-8 flex flex-col items-center gap-6">
              <div className="relative">
                <motion.div
                  className="w-44 h-44 rounded-full flex items-center justify-center"
                  animate={{
                    boxShadow: [
                      `0 0 40px ${cfg.color}40`,
                      `0 0 ${status === 'listening' || status === 'speaking' ? 90 : 60}px ${cfg.color}80`,
                      `0 0 40px ${cfg.color}40`,
                    ],
                  }}
                  transition={{ duration: status === 'idle' ? 3 : 1.2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <motion.div
                    className="w-32 h-32 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${cfg.color}22` }}
                    animate={{ scale: status === 'thinking' ? [1, 1.15, 1] : [1, 1.08, 1] }}
                    transition={{ duration: status === 'idle' ? 3 : 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <motion.div
                      className="w-20 h-20 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: cfg.color }}
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: status === 'thinking' ? 1 : 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      {status === 'speaking' ? (
                        <AudioWaveform size={30} className="text-white" />
                      ) : status === 'listening' ? (
                        <Mic size={30} className="text-white" />
                      ) : status === 'thinking' ? (
                        <Loader2 size={30} className="text-white animate-spin" />
                      ) : (
                        <Bot size={30} className="text-white" />
                      )}
                    </motion.div>
                  </motion.div>
                </motion.div>
              </div>

              <div>
                <p className="text-lg font-medium text-center" style={{ color: cfg.color }}>
                  {status === 'idle'
                    ? (wakeWordAvailable ? 'Say "Hey SONIC" to activate' : 'Click Listen to start talking')
                    : cfg.label}
                </p>
                <p className="text-xs text-[var(--text-secondary)] text-center mt-1">
                  {wakeWordAvailable ? 'Wake word: "Hey SONIC"' : 'Wake word disabled — using manual listen'}
                </p>
              </div>

              {status === 'idle' && !wakeWordAvailable && (
                <motion.button
                  onClick={handleListen}
                  disabled={isListening}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-[var(--success)] to-[#00cc6a] text-white font-semibold shadow-lg disabled:opacity-50"
                >
                  {isListening ? <Loader2 size={18} className="animate-spin" /> : <Mic size={18} />}
                  {isListening ? 'Listening...' : 'Click to Listen'}
                </motion.button>
              )}

              {transcript && (
                <div className="w-full p-4 rounded-xl bg-white/5 border border-white/8">
                  <p className="text-xs text-[var(--text-secondary)] mb-1 flex items-center gap-1"><Mic size={12} /> You said</p>
                  <p className="text-sm text-[var(--text-primary)]">{transcript}</p>
                </div>
              )}

              {response && (
                <div className="w-full p-4 rounded-xl bg-gradient-to-br gradient-accent-10 border border-accent-20">
                  <p className="text-xs text-[var(--text-secondary)] mb-1 flex items-center gap-1"><Bot size={12} /> SONIC AI</p>
                  <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">{response}</p>
                </div>
              )}

              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/8 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
              >
                Close
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VoiceModal;

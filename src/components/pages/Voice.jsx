import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, AudioWaveform, Loader2, Moon } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const BACKEND = 'http://localhost:8000';

const STATUS = {
  idle:      { label: 'Say "Hey SONIC" to activate', color: '#00d4ff' },
  listening: { label: 'Listening...',                color: '#00ff88' },
  thinking:  { label: 'Thinking...',                 color: '#7b2ff7' },
  speaking:  { label: 'Speaking...',                 color: '#ffaa00' },
  sleeping:  { label: 'Sleeping...',                 color: '#8899aa' },
  error:     { label: 'Error — reconnecting...',     color: '#ff4466' },
  connecting:{ label: 'Connecting...',               color: '#00d4ff' },
};

const WAVE_BARS = [0.4, 0.8, 1.2, 0.7, 1.5, 0.9, 0.5];

const Voice = () => {
  const { user } = useAuthStore();
  const [status, setStatus] = useState('connecting');
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimer = useRef(null);
  const mountedRef = useRef(true);

  const connectWS = useCallback(() => {
    if (!user?.id) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    if (!mountedRef.current) return;
    const ws = new WebSocket(`ws://localhost:8000/voice/ws/${user.id}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setStatus('idle');
    };

    ws.onmessage = (e) => {
      if (!mountedRef.current) return;
      const data = JSON.parse(e.data);

      switch (data.event) {
        case 'ready':
          setStatus('idle');
          break;
        case 'wake_word_detected':
        case 'listening':
          setStatus('listening');
          setTranscript('');
          setResponse('');
          break;
        case 'user_speech':
          setTranscript(data.text);
          setStatus('thinking');
          break;
        case 'thinking':
          setStatus('thinking');
          break;
        case 'ai_response':
          setResponse(data.text);
          setStatus('speaking');
          break;
        case 'speaking_done':
          setStatus('idle');
          break;
        case 'no_speech':
          setStatus('idle');
          break;
        case 'sleeping':
          setStatus('sleeping');
          break;
        case 'idle':
          setStatus('idle');
          break;
        case 'wake_word_unavailable':
          setStatus('error');
          break;
        case 'tts_unavailable':
          setResponse(data.message || 'Voice output unavailable');
          setStatus('idle');
          break;
        case 'error':
          setResponse(data.message || 'Something went wrong');
          setStatus('error');
          break;
        default:
          break;
      }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      setIsConnected(false);
      setStatus('connecting');
      scheduleReconnect();
    };

    ws.onerror = () => {
      if (!mountedRef.current) return;
      setStatus('error');
      try {
        ws.close();
      } catch {}
    };
  }, [user?.id]);

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return;
    if (reconnectTimer.current) return;
    reconnectTimer.current = setTimeout(() => {
      reconnectTimer.current = null;
      if (mountedRef.current && user?.id) {
        setStatus('connecting');
        connectWS();
      }
    }, 3000);
  }, [user?.id, connectWS]);

  useEffect(() => {
    mountedRef.current = true;
    if (user?.id) {
      connectWS();
    }
    return () => {
      mountedRef.current = false;
      if (reconnectTimer.current) {
        clearTimeout(reconnectTimer.current);
        reconnectTimer.current = null;
      }
      try {
        wsRef.current?.send(JSON.stringify({ action: 'stop' }));
      } catch {}
      try {
        wsRef.current?.close();
      } catch {}
      wsRef.current = null;
    };
  }, [user?.id, connectWS]);

  const currentStatus = STATUS[status] || STATUS.idle;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin flex flex-col items-center justify-center gap-8 p-8 bg-[var(--bg-primary)]">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gradient">SONIC Voice Mode</h1>
        <p className="text-sm mt-1 text-[var(--text-secondary)]">
          {isConnected
            ? 'Automatic — say "Hey SONIC" to activate'
            : 'Connecting to voice service...'}
        </p>
      </div>

      <div className="relative flex items-center justify-center">
        {['speaking', 'listening', 'thinking'].includes(status) && (
          <>
            <motion.div
              className="absolute rounded-full"
              style={{ width: 280, height: 280, border: `2px solid ${currentStatus.color}22` }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{ width: 240, height: 240, border: `2px solid ${currentStatus.color}44` }}
              animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0.1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
            />
          </>
        )}

        <motion.div
          className="rounded-full flex items-center justify-center select-none"
          style={{
            width: 200,
            height: 200,
            background: `radial-gradient(circle at 35% 35%, ${currentStatus.color}88, ${currentStatus.color}22)`,
            boxShadow: `0 0 60px ${currentStatus.color}44, 0 0 120px ${currentStatus.color}22`,
            border: `2px solid ${currentStatus.color}66`,
          }}
          animate={
            status === 'thinking'
              ? { rotate: 360 }
              : status === 'sleeping'
              ? { scale: [1, 0.94, 1] }
              : status === 'idle'
              ? { scale: [1, 1.04, 1] }
              : { scale: [1, 1.08, 1] }
          }
          transition={
            status === 'thinking'
              ? { duration: 3, repeat: Infinity, ease: 'linear' }
              : { duration: 2, repeat: Infinity }
          }
        >
          {status === 'speaking' ? (
            <AudioWaveform size={64} color={currentStatus.color} />
          ) : status === 'listening' ? (
            <div className="flex items-end gap-1" style={{ height: 64 }}>
              {WAVE_BARS.map((h, i) => (
                <motion.div
                  key={i}
                  style={{
                    width: 6,
                    height: 24 * h,
                    borderRadius: 4,
                    background: currentStatus.color,
                  }}
                  animate={{ scaleY: [1, 1.8, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.08 }}
                />
              ))}
            </div>
          ) : status === 'thinking' ? (
            <Loader2 size={64} color={currentStatus.color} />
          ) : status === 'sleeping' ? (
            <Moon size={64} color={currentStatus.color} />
          ) : (
            <Bot size={64} color={currentStatus.color} />
          )}
        </motion.div>
      </div>

      <motion.p
        key={status}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-lg font-medium"
        style={{ color: currentStatus.color }}
      >
        {currentStatus.label}
      </motion.p>

      <div className="w-full max-w-lg flex flex-col gap-3">
        <AnimatePresence>
          {transcript && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl p-4 text-right glass-card"
            >
              <p className="text-xs mb-1 text-[var(--text-secondary)]">You</p>
              <p className="text-[var(--text-primary)]">{transcript}</p>
            </motion.div>
          )}

          {response && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="rounded-xl p-4 glass-card"
              style={{ border: '1px solid #00d4ff33' }}
            >
              <p className="text-xs mb-1 text-[var(--accent)]">SONIC AI</p>
              <p className="text-[var(--text-primary)] whitespace-pre-wrap">{response}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Voice;

import React from 'react';
import { motion } from 'framer-motion';
import { X, Minus, Square } from 'lucide-react';
import { useElectron } from '../../hooks/useElectron';

const TitleBar = () => {
  const { isElectron, isMaximized, minimize, maximize, close } = useElectron();

  if (!isElectron) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-10 z-50 flex items-center justify-between px-3 titlebar-drag glass-dark border-b border-[var(--glass-border)]">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 p-1 rounded-lg bg-gradient-to-br gradient-accent-20 border border-accent-30">
          <div className="relative p-1.5 rounded-md bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)]">
            <span className="text-[10px] font-black text-[var(--bg-primary)]">S</span>
          </div>
          <span className="font-bold text-sm bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] bg-clip-text text-transparent">Sonic</span>
        </div>
      </div>

      <div className="flex items-center gap-1 titlebar-button">
        <button onClick={minimize} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-colors" aria-label="Minimize">
          <Minus size={16} />
        </button>
        <button onClick={maximize} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/10 transition-colors" aria-label={isMaximized ? 'Restore' : 'Maximize'}>
          {isMaximized ? (
            <span className="text-[10px] font-bold">▣</span>
          ) : (
            <Square size={14} />
          )}
        </button>
        <button onClick={close} className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--danger)] hover:bg-danger-10 transition-colors" aria-label="Close">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
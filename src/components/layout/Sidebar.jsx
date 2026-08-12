import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, MessageSquare, Settings, History, User, Mic,
  ChevronRight, ChevronLeft, Bot, Zap
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useThemeStore } from '../../stores/themeStore';
import { useNavigate } from 'react-router-dom';

const navItems = [
  { id: 'dashboard', icon: Home, label: 'Dashboard', href: '/dashboard' },
  { id: 'voice', icon: Mic, label: 'Voice', href: '/voice' },
  { id: 'chat', icon: MessageSquare, label: 'Chat', href: '/chat' },
  { id: 'history', icon: History, label: 'History', href: '/history' },
  { id: 'settings', icon: Settings, label: 'Settings', href: '/settings' },
];

const Sidebar = ({ isCollapsed, onToggle }) => {
  const { user } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState('dashboard');
  const [hoveredItem, setHoveredItem] = useState(null);

  const handleItemClick = (itemId) => {
    setActiveItem(itemId);
    const item = navItems.find((i) => i.id === itemId);
    if (item) navigate(item.href);
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 64 : 220 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`fixed left-0 top-0 z-40 h-screen bg-bg-secondary-80 backdrop-blur-2xl border-r border-[var(--glass-border)] flex flex-col overflow-hidden ${isCollapsed ? 'w-16' : 'w-[220px]'}`}
      style={{ height: 'calc(100vh - 40px)', top: '40px' }}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--glass-border)]">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex items-center gap-3"
            >
              <div className="relative p-2 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)]">
                <Bot size={20} className="text-[var(--bg-primary)]" />
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[var(--success)]"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <span className="font-bold text-lg text-[var(--text-primary)] bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] bg-clip-text text-transparent">
                Sonic
              </span>
            </motion.div>
          )}
          <motion.button
            onClick={onToggle}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass)] transition-colors flex-shrink-0"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </motion.button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          <AnimatePresence mode="popLayout">
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                onMouseEnter={() => !isCollapsed && setHoveredItem(item.id)}
                onMouseLeave={() => setHoveredItem(null)}
                className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 ${
                  activeItem === item.id
                    ? 'bg-gradient-to-r gradient-accent-20 text-[var(--accent)] border border-accent-30'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass)]'
                } ${isCollapsed ? 'justify-center' : ''}`}
                style={{ 
                  borderLeft: activeItem === item.id ? '3px solid var(--accent)' : hoveredItem === item.id ? '3px solid var(--accent)' : '3px solid transparent' 
                }}
                aria-label={item.label}
                aria-current={activeItem === item.id ? 'page' : undefined}
              >
                <span className="flex-shrink-0">
                  <item.icon size={20} />
                </span>
                {!isCollapsed && (
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  </AnimatePresence>
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        </nav>

        <div className="p-3 border-t border-[var(--glass-border)]">
          <div className="relative">
            <motion.div
              className="w-full h-16 rounded-xl bg-gradient-to-br gradient-accent-20 border border-accent-30 flex items-center justify-center cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              animate={{ 
                boxShadow: [
                  '0 0 20px rgba(0, 212, 255, 0.3)',
                  '0 0 40px rgba(0, 212, 255, 0.5)',
                  '0 0 20px rgba(0, 212, 255, 0.3)'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center">
                  <Zap size={18} className="text-[var(--bg-primary)]" />
                </div>
                <motion.div
                  className="absolute inset-0 rounded-full border border-accent-50"
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border border-accent-secondary-30"
                  animate={{ scale: [1, 1.6, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                />
              </div>
            </motion.div>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 text-center"
              >
                <p className="text-xs text-[var(--text-secondary)] uppercase tracking-wider">Sonic AI Core</p>
                <p className="text-xs font-medium text-[var(--accent)]">Status: Active</p>
              </motion.div>
            )}
          </div>
        </div>

        {!isCollapsed && user && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 border-t border-[var(--glass-border)]"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center">
                <User size={18} className="text-[var(--bg-primary)]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-[var(--text-primary)] truncate">{user.name}</p>
                <p className="text-xs text-[var(--text-secondary)] truncate">{user.email}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </motion.aside>
  );
};

export default Sidebar;
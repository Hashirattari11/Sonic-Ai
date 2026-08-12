import React from 'react';
import { motion } from 'framer-motion';
import { Search, Sun, Moon, User, Menu, Bell, Settings, LogOut } from 'lucide-react';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';

const Topbar = ({ onMenuClick }) => {
  const { isDark, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [showSearch, setShowSearch] = React.useState(false);
  const [showUserMenu, setShowUserMenu] = React.useState(false);

  React.useEffect(() => {
    const handleClickOutside = (e) => {
      if (showUserMenu && !e.target.closest('.user-menu')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

  const handleSearchFocus = () => setShowSearch(true);
  const handleSearchBlur = () => setTimeout(() => setShowSearch(false), 200);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 glass-dark border-b border-[var(--glass-border)] z-40 flex items-center justify-between px-4 titlebar-drag">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="titlebar-button p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        
        <div className="relative">
          <button
            onClick={handleSearchFocus}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors w-full md:w-64 lg:w-80"
          >
            <Search size={18} className="text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search Sonic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              className="bg-transparent border-none outline-none text-[var(--text-primary)] placeholder-[var(--text-secondary)] w-full text-sm"
            />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="titlebar-button p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="titlebar-button p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] relative"
          aria-label="Notifications"
        >
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--danger)] rounded-full" />
        </motion.button>

        <div className="relative user-menu">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-white/5 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center">
              <User size={16} className="text-[var(--bg-primary)]" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-[var(--text-primary)]">{user?.name || 'User'}</p>
              <p className="text-xs text-[var(--text-secondary)]">{user?.email || 'user@sonic.ai'}</p>
            </div>
          </button>

          {showUserMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 top-full mt-2 w-56 glass-card rounded-xl border border-[var(--glass-border)] shadow-glow overflow-hidden py-2"
            >
              <button className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-white/5 transition-colors text-[var(--text-primary)]">
                <User size={18} />
                Profile
              </button>
              <button className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-white/5 transition-colors text-[var(--text-primary)]">
                <Settings size={18} />
                Settings
              </button>
              <hr className="my-2 border-[var(--glass-border)]" />
              <button 
                onClick={logout}
                className="w-full px-4 py-2 text-left flex items-center gap-2 hover:bg-white/5 transition-colors text-[var(--danger)]"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
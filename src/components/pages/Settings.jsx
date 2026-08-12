import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, Key, Palette, Info, Eye, EyeOff, Check, X, CheckCircle, XCircle, Globe, Monitor, Moon, Sun, Loader2, ExternalLink } from 'lucide-react';
import Toggle from '../ui/Toggle';
import { useThemeStore } from '../../stores/themeStore';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../api';

const tabs = [
  { id: 'general', label: 'General', icon: Settings2 },
  { id: 'api-keys', label: 'API Keys', icon: Key },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'about', label: 'About', icon: Info },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const { isDark, toggleTheme, accentColor, setAccentColor } = useThemeStore();
  const { user, token, setApiKeyStatus } = useAuthStore();

  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState('openrouter');
  const [showApiKey, setShowApiKey] = useState(false);
  const [keyStatus, setKeyStatus] = useState('unset');
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [maskedKey, setMaskedKey] = useState('');
  const [showChangeBox, setShowChangeBox] = useState(false);
  const [language, setLanguage] = useState('en');
  const [startOnBoot, setStartOnBoot] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [theme, setTheme] = useState(isDark ? 'dark' : 'light');

  const accentOptions = [
    { name: 'Cyan', value: '#00d4ff' },
    { name: 'Purple', value: '#7b2ff7' },
    { name: 'Green', value: '#00ff88' },
    { name: 'Orange', value: '#ffaa00' },
  ];

  useEffect(() => {
    const checkKey = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`http://localhost:8000/settings/api-key/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.is_verified) {
            setKeyStatus('verified');
            setMaskedKey(data.masked_key);
            setProvider(data.provider || 'openrouter');
            const display = data.provider === 'gemini' ? 'Gemini' : data.provider === 'nvidia' ? 'NVIDIA' : 'OpenRouter';
            setStatusMessage(`${display} API connected successfully! Hello! Aaj aapko kya karna hai?`);
            setApiKeyStatus(true);
          }
        }
      } catch (err) {
        console.error('Failed to check API key:', err);
      }
    };
    checkKey();
  }, [user?.id, token, setApiKeyStatus]);

  const handleVerify = async () => {
    if (!apiKey.trim() || !user) return;
    setIsVerifying(true);
    setKeyStatus('unset');
    setStatusMessage('');
    try {
      const res = await fetch('http://localhost:8000/settings/api-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ api_key: apiKey, user_id: user.id, provider })
      });
      const data = await res.json();
      if (data.status === 'verified') {
        setKeyStatus('verified');
        const display = provider === 'gemini' ? 'Gemini' : provider === 'nvidia' ? 'NVIDIA' : 'OpenRouter';
        setStatusMessage(`${display} API connected successfully! Hello! Aaj aapko kya karna hai?`);
        setApiKeyStatus(true);
        setShowChangeBox(false);
        setApiKey('');
        try {
          const getRes = await fetch(`http://localhost:8000/settings/api-key/${user.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (getRes.ok) {
            const getData = await getRes.json();
            setMaskedKey(getData.masked_key);
          }
        } catch {}
      } else {
        setKeyStatus('invalid');
        setStatusMessage('Invalid API key. Please check and try again.');
      }
    } catch (err) {
      setKeyStatus('invalid');
      setStatusMessage('Could not connect to backend.');
    } finally {
      setIsVerifying(false);
    }
  };

  const renderStatus = () => {
    if (keyStatus === 'verified') return (
      <div className="flex items-center gap-2 text-green-400 mt-2">
        <CheckCircle size={16} />
        <span>{statusMessage}</span>
      </div>
    );
    if (keyStatus === 'invalid') return (
      <div className="flex items-center gap-2 text-red-400 mt-2">
        <XCircle size={16} />
        <span>{statusMessage}</span>
      </div>
    );
    return null;
  };

  const tabContent = {
    general: (
      <div className="space-y-6">
        <div className="glass-card rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2"><Globe size={20} className="text-[var(--accent)]" /> Preferences</h3>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Language</label>
              <select
                value={language} onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-white/8 text-[var(--text-primary)] outline-none focus:border-[var(--accent)] transition-all"
              >
                <option value="en" className="bg-[var(--bg-secondary)]">English</option>
                <option value="es" className="bg-[var(--bg-secondary)]">Español</option>
                <option value="fr" className="bg-[var(--bg-secondary)]">Français</option>
                <option value="de" className="bg-[var(--bg-secondary)]">Deutsch</option>
                <option value="ja" className="bg-[var(--bg-secondary)]">日本語</option>
              </select>
            </div>
            <Toggle id="startOnBoot" checked={startOnBoot} onChange={setStartOnBoot} label="Start on system boot" description="Automatically launch Sonic when you start your computer" />
            <Toggle id="notifications" checked={notifications} onChange={setNotifications} label="Enable notifications" description="Receive alerts for important updates and events" />
          </div>
        </div>
      </div>
    ),

    'api-keys': (
      <div className="space-y-6">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2 mb-6"><Key size={20} className="text-[var(--accent)]" /> AI API Key</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">Connect an AI provider to enable chat & voice. Your key is stored locally and never shared.</p>

          {keyStatus === 'verified' && maskedKey && !showChangeBox ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-400">API Key Connected</p>
                  <p className="text-xs text-text-secondary-70 mt-1">Provider: <span className="capitalize">{provider === 'gemini' ? 'Gemini' : provider === 'nvidia' ? 'NVIDIA' : 'OpenRouter'}</span> · Key: <span className="font-mono">{maskedKey}</span></p>
                </div>
              </div>
              <motion.button
                onClick={() => { setShowChangeBox(true); setKeyStatus('unset'); }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/8 text-[var(--text-primary)] font-medium hover:bg-white/10 transition-all"
              >
                Change API Key
              </motion.button>
            </div>
          ) : (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Provider</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'openrouter', label: 'OpenRouter', desc: 'Free models · Fast · Recommended' },
                    { id: 'nvidia', label: 'NVIDIA', desc: 'Free credits · NIM models' },
                    { id: 'gemini', label: 'Gemini', desc: 'Google AI Studio key' },
                  ].map((opt) => (
                    <motion.button
                      key={opt.id}
                      onClick={() => setProvider(opt.id)}
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        provider === opt.id
                          ? 'border-[var(--accent)] bg-accent-10'
                          : 'border-white/8 bg-white/3 hover:bg-white/5'
                      }`}
                    >
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{opt.label}</p>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">{opt.desc}</p>
                    </motion.button>
                  ))}
                </div>
              </div>
              <div className="relative mb-4">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    if (keyStatus !== 'unset') setKeyStatus('unset');
                  }}
                  placeholder={provider === 'gemini' ? "Enter your Gemini API key (AIza...)" : provider === 'nvidia' ? "Enter your NVIDIA key (nvapi-...)" : "Enter your OpenRouter API key (sk-or-...)"}
                  className="w-full px-4 py-3 pr-20 rounded-lg bg-[var(--bg-secondary)] border border-white/8 text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent)] transition-all"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <button onClick={() => setShowApiKey(!showApiKey)} className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-all">
                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <motion.button
                  onClick={handleVerify}
                  disabled={!apiKey.trim() || isVerifying}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-[var(--bg-primary)] font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isVerifying ? <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> Verifying...</span> : (showChangeBox ? 'Update Key' : 'Verify & Save')}
                </motion.button>
                {showChangeBox && (
                  <motion.button
                    onClick={() => { setShowChangeBox(false); setApiKey(''); setKeyStatus('verified'); }}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                    className="px-6 py-2.5 rounded-xl bg-white/5 border border-white/8 text-[var(--text-secondary)] font-medium hover:text-[var(--text-primary)] transition-all"
                  >
                    Cancel
                  </motion.button>
                )}
              </div>
              {renderStatus()}
              <div className="p-4 rounded-xl bg-white/3 border border-white/8 mt-4">
                {provider === 'openrouter' ? (
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Get your free OpenRouter API key from{' '}
                    <a href="https://openrouter.ai/settings/keys" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline inline-flex items-center gap-1">
                      <ExternalLink size={12} /> OpenRouter
                    </a>{' '}
                    — free models available like Gemini Flash & DeepSeek.
                  </p>
                ) : provider === 'nvidia' ? (
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Get your free NVIDIA API key from{' '}
                    <a href="https://build.nvidia.com" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline inline-flex items-center gap-1">
                      <ExternalLink size={12} /> NVIDIA Build
                    </a>{' '}
                    — includes free credits for Llama, Nemotron & more.
                  </p>
                ) : (
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Get your free Gemini API key from{' '}
                    <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline inline-flex items-center gap-1">
                      <ExternalLink size={12} /> Google AI Studio
                    </a>
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    ),

    appearance: (
      <div className="space-y-6">
        <div className="glass-card rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2"><Monitor size={20} className="text-[var(--accent)]" /> Theme</h3>
          <div className="flex gap-3">
            {['dark', 'light'].map((t) => (
              <motion.button
                key={t}
                onClick={() => { setTheme(t); if ((t === 'dark') !== isDark) toggleTheme(); }}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className={`flex-1 p-4 rounded-xl border transition-all ${
                  theme === t
                    ? 'border-[var(--accent)] bg-accent-10'
                    : 'border-[var(--glass-border)] bg-white/3'
                }`}
              >
                <div className="flex flex-col items-center gap-2">
                  {t === 'dark' ? <Moon size={24} className="text-[var(--text-primary)]" /> : <Sun size={24} className="text-[var(--text-primary)]" />}
                  <span className="text-sm font-medium text-[var(--text-primary)] capitalize">{t}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-2xl p-6 space-y-6">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] flex items-center gap-2"><Palette size={20} className="text-[var(--accent)]" /> Accent Color</h3>
          <div className="flex gap-4">
            {accentOptions.map((accent) => (
              <motion.button
                key={accent.value}
                onClick={() => setAccentColor(accent.value)}
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                className={`w-12 h-12 rounded-xl relative ${accentColor === accent.value ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-secondary)]' : ''}`}
                style={{ backgroundColor: accent.value, ringColor: accent.color }}
              >
                {accentColor === accent.value && (
                  <Check size={20} className="absolute inset-0 m-auto text-white" />
                )}
              </motion.button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {accentOptions.map((accent) => (
              <motion.button
                key={accent.value}
                onClick={() => setAccentColor(accent.value)}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  accentColor === accent.value
                    ? 'bg-accent-20 text-[var(--accent)] border border-accent-30'
                    : 'bg-white/5 text-[var(--text-secondary)] border border-transparent hover:text-[var(--text-primary)]'
                }`}
              >
                {accent.name}
              </motion.button>
            ))}
          </div>
        </div>
      </div>
    ),

    about: (
      <div className="space-y-6">
        <div className="glass-card rounded-2xl p-8 text-center space-y-6">
          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }} className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center">
            <Settings2 size={36} className="text-[var(--bg-primary)]" />
          </motion.div>
          <div>
            <h2 className="text-2xl font-bold text-gradient">Sonic AI</h2>
            <p className="text-[var(--text-secondary)] mt-1">Version 1.0.0</p>
          </div>
          <div className="max-w-md mx-auto space-y-3 text-left">
            <div className="p-4 rounded-xl bg-white/3 border border-white/8">
              <p className="text-sm text-[var(--text-secondary)]">Developer</p>
              <p className="text-[var(--text-primary)] font-medium">Hashir Attari</p>
            </div>
            <div className="p-4 rounded-xl bg-white/3 border border-white/8">
              <p className="text-sm text-[var(--text-secondary)]">Built With</p>
              <p className="text-[var(--text-primary)] font-medium">Electron · React · Tailwind CSS · Framer Motion</p>
            </div>
            <div className="p-4 rounded-xl bg-white/3 border border-white/8">
              <p className="text-sm text-[var(--text-secondary)]">Description</p>
              <p className="text-[var(--text-primary)] text-sm leading-relaxed">A sophisticated AI desktop assistant inspired by J.A.R.V.I.S., featuring a glassmorphism design, real-time system monitoring, and AI-powered chat capabilities.</p>
            </div>
          </div>
          <motion.a
            href="https://sonic-ai.app"
            target="_blank" rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-[var(--bg-primary)] font-semibold"
          >
            <ExternalLink size={18} /> Visit Website
          </motion.a>
        </div>
      </div>
    ),
  };

  return (
    <div className="h-full flex overflow-hidden">
      <div className="w-56 flex-shrink-0 border-r border-[var(--glass-border)] p-3 space-y-1">
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            whileHover={{ x: 2 }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r gradient-accent-20 text-[var(--accent)] border border-accent-30'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </motion.button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tabContent[activeTab]}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Settings;
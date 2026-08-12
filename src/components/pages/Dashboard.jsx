import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Bot, MessageSquare, Mic, Settings, Cpu, HardDrive, Wifi, Zap, Activity, Clock, Battery, Thermometer } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { api } from '../../api';

const Dashboard = () => {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState('');
  const [stats, setStats] = useState(null);
  const [sonicStatus, setSonicStatus] = useState('idle');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);

    const fetchStats = async () => {
      try {
        const data = await api.system.getStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch system stats:', err);
      }
    };
    fetchStats();
    const statsInterval = setInterval(fetchStats, 5000);

    return () => { clearInterval(interval); clearInterval(statsInterval); };
  }, []);

  const statsCards = stats ? [
    {
      icon: Cpu,
      label: 'CPU Usage',
      value: `${stats.cpu_percent}%`,
      color: 'from-[var(--accent)] to-[var(--accent-secondary)]',
      sub: `${stats.cpu_count} Cores @ ${stats.cpu_freq.toFixed(0)}MHz`,
      percent: stats.cpu_percent,
    },
    {
      icon: HardDrive,
      label: 'Memory',
      value: `${stats.memory_used_gb}/${stats.memory_total_gb} GB`,
      color: 'from-[var(--success)] to-[#00cc6a]',
      sub: `${stats.memory_percent}% used`,
      percent: stats.memory_percent,
    },
    {
      icon: Activity,
      label: 'Disk',
      value: `${stats.disk_used_gb} GB`,
      color: 'from-[var(--warning)] to-[#ff8800]',
      sub: `${stats.disk_percent}% of ${stats.disk_total_gb} GB`,
      percent: stats.disk_percent,
    },
    {
      icon: Wifi,
      label: 'Network',
      value: 'Online',
      color: 'from-[var(--accent-secondary)] to-[var(--accent)]',
      sub: `↓${stats.net_recv_mb} MB ↑${stats.net_sent_mb} MB`,
      percent: null,
    },
  ] : [
    { icon: Cpu, label: 'CPU Usage', value: '...', color: 'from-[var(--accent)] to-[var(--accent-secondary)]', sub: 'Loading...', percent: 0 },
    { icon: HardDrive, label: 'Memory', value: '...', color: 'from-[var(--success)] to-[#00cc6a]', sub: 'Loading...', percent: 0 },
    { icon: Activity, label: 'Disk', value: '...', color: 'from-[var(--warning)] to-[#ff8800]', sub: 'Loading...', percent: 0 },
    { icon: Wifi, label: 'Network', value: '...', color: 'from-[var(--accent-secondary)] to-[var(--accent)]', sub: 'Loading...', percent: null },
  ];

  const quickActions = [
    { icon: MessageSquare, label: 'Start Chat', desc: 'Begin a conversation with SONIC', onClick: () => navigate('/chat'), color: 'gradient-accent-20 border-accent-30' },
    { icon: Mic, label: 'Voice Mode', desc: 'Talk to SONIC hands-free', onClick: () => navigate('/voice'), color: 'gradient-success-20 border-success-30' },
    { icon: Settings, label: 'Settings', desc: 'Configure your assistant', onClick: () => navigate('/settings'), color: 'gradient-warning-20 border-warning-30' },
  ];

  const capabilities = [
    { icon: Cpu, title: 'System Monitor', desc: 'Real-time CPU, RAM, disk & network stats' },
    { icon: Zap, title: 'Full PC Control', desc: 'Open apps, volume, brightness, windows & power' },
    { icon: MessageSquare, title: 'AI Chat', desc: 'OpenRouter · NVIDIA · Gemini providers' },
    { icon: Activity, title: 'Media & Files', desc: 'Play music, screenshots, folders & web search' },
  ];

  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-thin p-6 space-y-8">
      <motion.div initial="initial" animate="animate" variants={{ animate: { transition: { staggerChildren: 0.1 } } }} className="max-w-6xl mx-auto space-y-8">

        <motion.div variants={fadeInUp} className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">
              {greeting}, <span className="text-gradient">{user?.name || 'User'}</span>
            </h1>
            <p className="text-[var(--text-secondary)] flex items-center gap-1 mt-1">
              <Clock size={16} /> {currentTime} · System ready · SONIC AI online
            </p>
          </div>
          {stats?.battery && (
            <div className="glass-card rounded-xl px-4 py-3 flex items-center gap-2">
              <Battery size={20} className={stats.battery.plugged ? 'text-[var(--success)]' : 'text-[var(--warning)]'} />
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">{stats.battery.percent}%</p>
                <p className="text-xs text-text-secondary-60">{stats.battery.plugged ? 'Plugged' : 'On battery'}</p>
              </div>
            </div>
          )}
        </motion.div>

        <motion.div variants={fadeInUp} className="flex justify-center">
          <div className="relative cursor-pointer" onClick={() => navigate('/voice')} title="Click to activate Voice Mode">
            <motion.div
              className="w-44 h-44 rounded-full bg-gradient-to-br gradient-accent-30 flex items-center justify-center"
              animate={{ boxShadow: ['0 0 40px rgba(0,212,255,0.3)', '0 0 80px rgba(0,212,255,0.5)', '0 0 40px rgba(0,212,255,0.3)'] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <motion.div
                className="w-32 h-32 rounded-full bg-gradient-to-br gradient-accent-40 flex items-center justify-center"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <motion.div
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <Bot size={32} className="text-[var(--bg-primary)]" />
                </motion.div>
              </motion.div>
            </motion.div>
            <motion.div
              className="absolute -top-4 -right-4 w-12 h-12 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Zap size={20} className="text-[var(--bg-primary)]" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div variants={fadeInUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={fadeInUp}
              custom={i}
              className="glass-card rounded-2xl p-5 glass-card-hover cursor-default"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-20`}>
                  <stat.icon size={20} className="text-white" />
                </div>
                <motion.div
                  className="w-2 h-2 rounded-full"
                  animate={{ backgroundColor: ['#00ff88', '#00d4ff', '#00ff88'] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </div>
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stat.value}</p>
              <p className="text-sm text-[var(--text-secondary)]">{stat.label}</p>
              <p className="text-xs text-text-secondary-70 mt-1">{stat.sub}</p>
              {stat.percent !== null && (
                <div className="mt-2 h-1 rounded-full bg-white/5 overflow-hidden">
                  <motion.div
                    className={`h-full bg-gradient-to-r ${stat.color}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(stat.percent, 100)}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={fadeInUp}>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickActions.map((action) => (
              <motion.button
                key={action.label}
                onClick={action.onClick}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`glass-card rounded-2xl p-6 bg-gradient-to-br ${action.color} border text-left`}
              >
                <div className="p-3 rounded-xl bg-white/5 w-fit mb-3">
                  <action.icon size={24} className="text-[var(--accent)]" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{action.label}</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{action.desc}</p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div variants={fadeInUp}>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Capabilities</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {capabilities.map((cap, i) => (
              <motion.div
                key={cap.title}
                variants={fadeInUp}
                custom={i}
                className="glass-card rounded-xl p-4 glass-card-hover"
              >
                <div className="p-2 rounded-lg bg-gradient-to-br gradient-accent-20 w-fit mb-3">
                  <cap.icon size={18} className="text-[var(--accent)]" />
                </div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{cap.title}</h3>
                <p className="text-xs text-text-secondary-70 mt-1">{cap.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {stats && (
          <motion.div variants={fadeInUp}>
            <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-4">System Information</h2>
            <div className="glass-card rounded-2xl p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-text-secondary-70">Operating System</p>
                  <p className="text-sm font-medium text-[var(--text-primary)] mt-1">{stats.os}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary-70">Hostname</p>
                  <p className="text-sm font-medium text-[var(--text-primary)] mt-1">{stats.hostname}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary-70">Uptime Since</p>
                  <p className="text-sm font-medium text-[var(--text-primary)] mt-1">{stats.boot_time}</p>
                </div>
                <div>
                  <p className="text-xs text-text-secondary-70">Total Network I/O</p>
                  <p className="text-sm font-medium text-[var(--text-primary)] mt-1">↓{stats.net_recv_mb} MB · ↑{stats.net_sent_mb} MB</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

      </motion.div>
    </div>
  );
};

export default Dashboard;

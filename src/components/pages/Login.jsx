import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, Zap, Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields'); return; }
    setIsLoading(true);
    try {
      await login({ email, password });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-accent-10 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-secondary-10 rounded-full blur-[120px] animate-float" style={{ animationDelay: '-3s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        <div className="glass-card rounded-3xl p-8 space-y-8">
          <div className="flex flex-col items-center gap-4">
            <motion.div
              animate={{ boxShadow: ['0 0 20px rgba(0,212,255,0.3)', '0 0 40px rgba(0,212,255,0.5)', '0 0 20px rgba(0,212,255,0.3)'] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="p-4 rounded-2xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-secondary)] relative"
            >
              <Bot size={36} className="text-[var(--bg-primary)]" />
              <motion.div
                className="absolute inset-0 rounded-2xl border border-white/30"
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] bg-clip-text text-transparent">
                Welcome to Sonic
              </h1>
              <p className="text-[var(--text-secondary)] mt-2">Sign in to your AI assistant</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-white/8 text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-color-accent-10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-3 rounded-lg bg-[var(--bg-secondary)] border border-white/8 text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-color-accent-10 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="w-4 h-4 rounded border-white/20 bg-transparent accent-[var(--accent)]" />
                <span className="text-sm text-[var(--text-secondary)]">Remember me</span>
              </label>
              <button type="button" className="text-sm text-[var(--accent)] hover:underline">Forgot password?</button>
            </div>

            {error && <p className="text-sm text-[var(--danger)] text-center">{error}</p>}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-[var(--bg-primary)] font-semibold shadow-[0_4px_20px_rgba(0,212,255,0.3)] hover:shadow-[0_8px_30px_rgba(0,212,255,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2"><Loader2 size={20} className="animate-spin" /> Signing In...</span>
              ) : (
                <span className="flex items-center justify-center gap-2"><Zap size={20} /> Sign In</span>
              )}
            </button>
          </form>

          <p className="text-center text-[var(--text-secondary)]">
            Don't have an account?{' '}
            <Link to="/signup" className="text-[var(--accent)] hover:underline font-medium">Create Account</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
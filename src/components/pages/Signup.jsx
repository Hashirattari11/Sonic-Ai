import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Bot, User, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const signup = useAuthStore((s) => s.signup);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name || !email || !password || !confirmPassword) { setError('Please fill in all fields'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setIsLoading(true);
    try {
      await signup({ name, email, password });
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
        <div className="absolute top-1/3 right-1/3 w-80 h-80 bg-accent-secondary-10 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-accent-10 rounded-full blur-[100px] animate-float" style={{ animationDelay: '-2s' }} />
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
              animate={{ boxShadow: ['0 0 20px rgba(123,47,247,0.3)', '0 0 40px rgba(123,47,247,0.5)', '0 0 20px rgba(123,47,247,0.3)'] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="p-4 rounded-2xl bg-gradient-to-br from-[var(--accent-secondary)] to-[var(--accent)] relative"
            >
              <User size={36} className="text-white" />
              <motion.div
                className="absolute inset-0 rounded-2xl border border-white/30"
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              />
            </motion.div>
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] bg-clip-text text-transparent">
                Join Sonic
              </h1>
              <p className="text-[var(--text-secondary)] mt-2">Create your account to get started</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-white/8 text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-color-accent-10 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
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
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full pl-10 pr-10 py-3 rounded-lg bg-[var(--bg-secondary)] border border-white/8 text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-color-accent-10 transition-all"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-2">Confirm Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-white/8 text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-color-accent-10 transition-all"
                />
              </div>
            </div>

            {error && (
              <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-[var(--danger)] text-center">
                {error}
              </motion.p>
            )}

            <button
              type="submit" disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-[var(--bg-primary)] font-semibold shadow-[0_4px_20px_rgba(0,212,255,0.3)] hover:shadow-[0_8px_30px_rgba(0,212,255,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2"><Loader2 size={20} className="animate-spin" /> Creating Account...</span>
              ) : (
                <span className="flex items-center justify-center gap-2"><ArrowRight size={20} /> Create Account</span>
              )}
            </button>
          </form>

          <p className="text-center text-[var(--text-secondary)]">
            Already have an account?{' '}
            <Link to="/" className="text-[var(--accent)] hover:underline font-medium">Sign In</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Signup;
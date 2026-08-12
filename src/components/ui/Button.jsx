import React from 'react';
import { motion } from 'framer-motion';

const Button = React.forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  ...props 
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-300 ease-out focus:outline-none focus:ring-2 focus:ring-color-accent-30 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-to-r from-[var(--accent)] to-[var(--accent-secondary)] text-[var(--bg-primary)] shadow-[0_4px_20px_rgba(0,212,255,0.3)] hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(0,212,255,0.5),0_0_60px_rgba(123,47,247,0.3)] active:scale-[0.98]',
    secondary: 'bg-white/5 border border-white/8 text-[var(--text-primary)] hover:bg-accent-10 hover:border-accent-30',
    ghost: 'bg-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5',
    danger: 'bg-gradient-to-r from-[var(--danger)] to-[#ff6b6b] text-white shadow-[0_4px_20px_rgba(255,68,102,0.3)] hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(255,68,102,0.5)] active:scale-[0.98]',
    success: 'bg-gradient-to-r from-[var(--success)] to-[#00cc6a] text-[var(--bg-primary)] shadow-[0_4px_20px_rgba(0,255,136,0.3)] hover:scale-[1.02] hover:shadow-[0_8px_30px_rgba(0,255,136,0.5)] active:scale-[0.98]',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-5 py-2.5 text-base gap-2',
    lg: 'px-7 py-3.5 text-lg gap-2.5',
    xl: 'px-10 py-4 text-xl gap-3',
  };

  return (
    <motion.button
      ref={ref}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      whileHover={!disabled && !loading ? { scale: 1.02 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.98 } : undefined}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <motion.span
          className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      ) : (
        <>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
});

Button.displayName = 'Button';

export default Button;
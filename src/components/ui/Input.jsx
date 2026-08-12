import React, { forwardRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';

const Input = forwardRef(({ 
  label, 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  onBlur,
  onFocus,
  error,
  disabled = false,
  required = false,
  showPasswordToggle = false,
  leftIcon,
  rightIcon,
  className = '',
  id,
  name,
  autoComplete,
  ...props 
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputType = type === 'password' && showPasswordToggle ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <motion.label
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="block text-sm font-medium text-[var(--text-secondary)] mb-2"
        >
          {label} {required && <span className="text-[var(--danger)]">*</span>}
        </motion.label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] pointer-events-none">
            {leftIcon}
          </div>
        )}
        
        <motion.input
          ref={ref}
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={(e) => { setIsFocused(false); onBlur?.(e); }}
          onFocus={(e) => { setIsFocused(true); onFocus?.(e); }}
          disabled={disabled}
          required={required}
          id={id}
          name={name}
          autoComplete={autoComplete}
          className={`
            w-full px-4 py-3 rounded-lg bg-[var(--bg-secondary)] border border-white/8 
            text-[var(--text-primary)] placeholder-[var(--text-secondary)]
            outline-none transition-all duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            ${leftIcon ? 'pl-10' : ''} ${rightIcon || showPasswordToggle ? 'pr-10' : ''}
            ${error ? 'border-danger-50 focus:border-[var(--danger)] focus:ring-color-danger-20' : ''}
            ${isFocused ? 'border-[var(--accent)] ring-2 ring-color-accent-10' : ''}
          `}
          {...props}
        />
        
        {showPasswordToggle && (
          <motion.button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </motion.button>
        )}
        
        {rightIcon && !showPasswordToggle && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]">
            {rightIcon}
          </div>
        )}
        
        {props.loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader2 size={18} className="text-[var(--accent)] animate-spin" />
          </div>
        )}
      </div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 text-sm text-[var(--danger)] flex items-center gap-1"
        >
          <AlertCircle size={14} />
          {error}
        </motion.p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
import React from 'react';
import { motion } from 'framer-motion';

const Toggle = ({ checked, onChange, disabled, label, description, id, className = '' }) => {
  return (
    <label htmlFor={id} className={`flex items-center gap-3 cursor-pointer group ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      <div className="relative">
        <input type="checkbox" id={id} checked={checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} className="sr-only" />
        <motion.div
          animate={{ backgroundColor: checked ? 'rgba(0, 212, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)' }}
          className="w-11 h-6 rounded-full border border-white/10"
          transition={{ duration: 0.2 }}
        >
          <motion.div
            animate={{ x: checked ? 20 : 2 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="w-5 h-5 rounded-full bg-white shadow-md mt-0.5 group-hover:shadow-lg"
          />
        </motion.div>
      </div>
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>}
          {description && <span className="text-xs text-[var(--text-secondary)]">{description}</span>}
        </div>
      )}
    </label>
  );
};

export default Toggle;
import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

const Modal = ({ isOpen, onClose, title, children, size = 'md', className = '' }) => {
  useEffect(() => {
    const handleEscape = (e) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) { document.addEventListener('keydown', handleEscape); document.body.style.overflow = 'hidden'; }
    return () => { document.removeEventListener('keydown', handleEscape); document.body.style.overflow = ''; };
  }, [isOpen, onClose]);

  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl', full: 'max-w-[90vw]' };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`${sizes[size]} w-full glass-card rounded-2xl overflow-hidden ${className}`}
            onClick={(e) => e.stopPropagation()}
          >
            {title && (
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--glass-border)]">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
                <button onClick={onClose} className="p-1 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors">
                  <X size={20} />
                </button>
              </div>
            )}
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Modal;
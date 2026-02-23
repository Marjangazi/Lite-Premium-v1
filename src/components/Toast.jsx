import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, CheckCircle, AlertCircle, X } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const icons = {
    info: <Info className="text-blue-400" />,
    success: <CheckCircle className="text-green-400" />,
    error: <AlertCircle className="text-red-400" />,
  };

  const colors = {
    info: 'border-blue-500/50 bg-blue-500/10',
    success: 'border-green-500/50 bg-green-500/10',
    error: 'border-red-500/50 bg-red-500/10',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, x: '-50%' }}
      animate={{ opacity: 1, y: 0, x: '-50%' }}
      exit={{ opacity: 0, y: 20, x: '-50%' }}
      className={`fixed bottom-24 left-1/2 z-[100] flex items-center gap-3 px-6 py-4 rounded-2xl border backdrop-blur-md shadow-2xl min-w-[300px] ${colors[type]}`}
    >
      {icons[type]}
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
        <X size={16} />
      </button>
    </motion.div>
  );
}

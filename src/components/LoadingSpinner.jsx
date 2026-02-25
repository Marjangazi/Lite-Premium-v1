import React from 'react';
import { motion } from 'framer-motion';

const LoadingSpinner = () => (
  <div className="min-h-screen bg-gray-900 flex items-center justify-center">
    <div className="text-center space-y-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 border-4 border-premium-gold/20 border-t-premium-gold rounded-full mx-auto"
      />
      <p className="text-premium-gold font-black tracking-[0.4em] animate-pulse uppercase text-sm">
        Loading...
      </p>
    </div>
  </div>
);

export default LoadingSpinner;
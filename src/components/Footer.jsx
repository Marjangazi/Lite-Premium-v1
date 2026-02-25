import React from 'react';
import { Shield, Zap } from 'lucide-react';

const Footer = () => (
  <footer className="bg-gray-900 border-t border-gray-800 mt-12">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 text-gray-400">
          <Shield size={16} />
          <span>Secure Business Simulation Platform</span>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <Zap size={16} />
          <span>Powered by Supabase & React</span>
        </div>
        <div className="text-gray-500 text-sm">
          © 2024 ParTimer Official. All rights reserved.
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
import React from 'react';
import { Menu, User, LogOut } from 'lucide-react';

const Navbar = ({ session, onSidebarToggle }) => (
  <nav className="bg-gray-900 border-b border-gray-800 fixed top-0 left-0 right-0 z-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center h-16">
        <div className="flex items-center gap-4">
          <button onClick={onSidebarToggle} className="lg:hidden">
            <Menu size={24} className="text-gray-400 hover:text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">ParTimer Official</h1>
        </div>
        <div className="flex items-center gap-4">
          {session && (
            <>
              <span className="text-gray-400 text-sm">Welcome</span>
              <User size={20} className="text-gray-400" />
              <button className="text-gray-400 hover:text-white">
                <LogOut size={20} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  </nav>
);

export default Navbar;
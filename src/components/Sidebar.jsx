import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Wallet, 
  Users, 
  Globe, 
  Shield, 
  LogOut 
} from 'lucide-react';

const Sidebar = ({ isOpen, onClose, session }) => (
  <div className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-800 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300`}>
    <div className="p-4">
      <h2 className="text-white font-bold text-lg mb-8">Menu</h2>
      <nav className="space-y-2">
        <a href="/dashboard" className="flex items-center gap-3 p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </a>
        <a href="/shop" className="flex items-center gap-3 p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
          <ShoppingBag size={20} />
          <span>Shop</span>
        </a>
        <a href="/deposit" className="flex items-center gap-3 p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
          <Wallet size={20} />
          <span>Deposit</span>
        </a>
        <a href="/withdraw" className="flex items-center gap-3 p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
          <Wallet size={20} />
          <span>Withdraw</span>
        </a>
        {session?.user?.email === 'mdmarzangazi@gmail.com' && (
          <a href="/admin" className="flex items-center gap-3 p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
            <Shield size={20} />
            <span>Admin</span>
          </a>
        )}
        <a href="/community" className="flex items-center gap-3 p-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors">
          <Globe size={20} />
          <span>Community</span>
        </a>
      </nav>
    </div>
  </div>
);

export default Sidebar;
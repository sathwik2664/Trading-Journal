import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, BarChart2,
  TrendingUp, BookMarked, Zap, ChevronLeft,
} from 'lucide-react';
import { useState } from 'react';
import { useAccount } from '../../context/AccountContext';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/notebook', icon: BookOpen, label: 'Notebook' },
  { to: '/trades', icon: TrendingUp, label: 'Trades' },
  { to: '/reports', icon: BarChart2, label: 'Reports' },
  { to: '/playbook', icon: BookMarked, label: 'Playbook' },
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { account } = useAccount();

  return (
    <div
      className={`h-screen bg-[#111111] border-r border-[#1e1e1e] flex flex-col transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-[#1e1e1e]">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img
  src="/logo.png"
  alt="Trade Maniac"
  className="w-8 h-8 rounded-md object-cover"
/>
            <span className="text-white font-bold text-lg tracking-wide">Trade Maniac</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-500 hover:text-white transition-colors ml-auto"
        >
          <ChevronLeft
            size={18}
            className={`transition-transform ${collapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Add Trade Button */}
      <div className="px-3 py-4">
        <NavLink to="/trades">
          <button
            className={`w-full bg-purple-600 hover:bg-purple-700 text-white rounded-lg py-2 text-sm font-medium transition-colors flex items-center gap-2 ${
              collapsed ? 'justify-center px-2' : 'px-4'
            }`}
          >
            <span className="text-lg">+</span>
            {!collapsed && <span>Add Trade</span>}
          </button>
        </NavLink>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30'
                  : 'text-gray-400 hover:text-white hover:bg-[#1e1e1e]'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <Icon size={18} />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Profile — clicks straight to Account Center */}
      <div className="px-3 py-3 border-t border-[#1e1e1e]">
        <button
          onClick={() => navigate('/account')}
          className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-[#1e1e1e] transition-colors group ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ring-2 ring-transparent group-hover:ring-purple-600/40 transition-all"
            style={{ backgroundColor: account.avatarColor }}
          >
            {account.initials}
          </div>
          {!collapsed && (
            <div className="flex-1 text-left min-w-0">
              <p className="text-white text-sm font-medium truncate">{account.name}</p>
              <p className="text-gray-500 text-xs">{account.accountType}</p>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
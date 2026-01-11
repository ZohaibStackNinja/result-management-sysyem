import React from 'react';
import { Link } from 'react-router-dom';

interface SidebarLinkProps {
  to: string;
  icon: React.ComponentType<any>;
  label: string;
  active?: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon: Icon, label, active }) => (
  <Link 
    to={to} 
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
      active 
      ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/10' 
      : 'text-slate-500 hover:bg-white hover:text-primary-600'
    }`}
  >
    <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-primary-600'}`} />
    <span className="font-medium">{label}</span>
  </Link>
);

export default SidebarLink;

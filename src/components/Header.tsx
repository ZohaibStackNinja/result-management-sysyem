import React from 'react';
import { Menu, X, User as UserIcon } from 'lucide-react';

interface HeaderProps {
  user: { name: string; role: string };
  mobileMenuOpen: boolean;
  toggleMenu: () => void;
  title: string;
}

const Header: React.FC<HeaderProps> = ({ user, mobileMenuOpen, toggleMenu, title }) => {
  return (
    <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 md:px-8 print:hidden shadow-xs z-10">
      <button onClick={toggleMenu} className="md:hidden p-2 text-slate-600">
        {mobileMenuOpen ? <X /> : <Menu />}
      </button>
      <h2 className="text-lg font-bold text-primary-600 hidden md:block">{title}</h2>

      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end hidden sm:block">
          <span className="text-sm font-bold text-slate-800">{user.name}</span>
          <span className="text-xs text-slate-500 capitalize">{user.role}</span>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary-50 border-2 border-white shadow-xs flex items-center justify-center text-primary-600 font-bold">
          <UserIcon className="w-5 h-5"/>
        </div>
      </div>
    </header>
  );
};

export default Header;
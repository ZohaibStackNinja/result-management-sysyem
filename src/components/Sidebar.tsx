import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  GraduationCap,
  FileSpreadsheet,
  FileText,
  Settings as SettingsIcon,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import SidebarLink from "./SidebarLink";
import { storageService } from "../../services/storageService";
import { User, Session } from "../../types";

interface SidebarProps {
  user: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ user, onLogout }) => {
  const location = useLocation();
  const [activeSession, setActiveSession] = useState<Session | undefined>(
    undefined
  );

  useEffect(() => {
    setActiveSession(storageService.getActiveSession());
  }, []);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-slate-50 border-r border-slate-200 print:hidden">
      <div className="flex flex-col px-6 h-20 border-b border-slate-100 justify-center bg-white relative overflow-hidden">
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-secondary-500">
            NC
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary-600 tracking-tight leading-none">
              NCSS
            </h1>
            <p className="text-[9px] text-secondary-600 font-bold tracking-widest uppercase">
              Raising Contributors
            </p>
          </div>
        </div>
        {activeSession && (
          <div className="absolute top-2 right-2 text-[9px] font-bold text-white bg-secondary-500 px-1.5 py-0.5 rounded uppercase tracking-wider">
            {activeSession.name}
          </div>
        )}
      </div>

      <nav className="p-4 space-y-2 mt-4">
        <SidebarLink
          to="/"
          icon={LayoutDashboard}
          label="Dashboard"
          active={location.pathname === "/"}
        />
        {user.role === "admin" && (
          <SidebarLink
            to="/students"
            icon={GraduationCap}
            label="Students"
            active={location.pathname === "/students"}
          />
        )}
        <SidebarLink
          to="/marks"
          icon={FileSpreadsheet}
          label="Marks Entry"
          active={location.pathname === "/marks"}
        />
        <SidebarLink
          to="/reports"
          icon={FileText}
          label="Reports"
          active={location.pathname === "/reports"}
        />
        <SidebarLink
          to="/settings"
          icon={SettingsIcon}
          label="Settings"
          active={location.pathname === "/settings"}
        />
      </nav>

      <div className="absolute bottom-0 w-full p-4">
        <div className="bg-primary-50 rounded-xl p-4 border border-primary-100 mb-2">
          <h4 className="font-bold text-primary-900 text-sm">
            Role: {user.role.toUpperCase()}
          </h4>
          <p className="text-xs text-primary-600 mt-1 truncate">
            User: {user.name}
          </p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-gray-500 hover:text-red-600 text-sm px-2 py-2 w-full transition"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

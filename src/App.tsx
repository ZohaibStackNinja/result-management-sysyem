import React, { useState, useEffect } from "react";
import {
  HashRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  Navigate,
} from "react-router-dom";
import {
  LayoutDashboard,
  GraduationCap,
  FileSpreadsheet,
  FileText,
  Menu,
  X,
  Settings as SettingsIcon,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import Dashboard from "./components/Dashboard";
import MarksEntry from "./components/MarksEntry";
import Reports from "./components/Reports";
import StudentManager from "./components/StudentManager";
import Settings from "./components/Settings";
import Login from "./components/Login";
import { storageService } from "../services/storageService";
import { User, Session } from "../types";

const SidebarLink = ({ to, icon: Icon, label, active }: any) => (
  <Link
    to={to}
    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
      active
        ? "bg-primary-600 text-white shadow-lg shadow-primary-900/10"
        : "text-slate-500 hover:bg-white hover:text-primary-600"
    }`}
  >
    <Icon
      className={`w-5 h-5 ${
        active ? "text-white" : "text-slate-400 group-hover:text-primary-600"
      }`}
    />
    <span className="font-medium">{label}</span>
  </Link>
);

const Layout = ({
  children,
  onLogout,
  user,
}: {
  children?: React.ReactNode;
  onLogout: () => void;
  user: User | null;
}) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSession, setActiveSession] = useState<Session | undefined>(
    undefined
  );

  useEffect(() => {
    setActiveSession(storageService.getActiveSession());
  }, []);

  if (!user) return null;

  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden">
      {/* Sidebar - Hidden on Print */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-slate-50 border-r border-slate-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:block ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        } print:hidden`}
      >
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Header - Hidden on Print */}
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 md:px-8 print:hidden shadow-sm z-10">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600"
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>

          <h2 className="text-lg font-bold text-primary-600 hidden md:block">
            {location.pathname === "/"
              ? "Dashboard Overview"
              : location.pathname.substring(1).charAt(0).toUpperCase() +
                location.pathname.substring(1).slice(1)}
          </h2>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end hidden sm:block">
              <span className="text-sm font-bold text-slate-800">
                {user.name}
              </span>
              <span className="text-xs text-slate-500 capitalize">
                {user.role}
              </span>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary-50 border-2 border-white shadow-sm flex items-center justify-center text-primary-600 font-bold">
              <UserIcon className="w-5 h-5" />
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 print:overflow-visible bg-brand-bg">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden print:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

// RBAC Wrapper
const RoleBasedRoute = ({
  user,
  allowedRoles,
  children,
}: {
  user: User | null;
  allowedRoles: string[];
  children?: React.ReactNode;
}) => {
  if (!user) return <Navigate to="/" replace />;
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h2 className="text-2xl font-bold text-gray-400">Access Denied</h2>
        <p className="text-gray-500 mt-2">
          You do not have permission to view this page.
        </p>
        <Link
          to="/"
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded"
        >
          Go Home
        </Link>
      </div>
    );
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Check session
    const user = storageService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    storageService.logout();
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <Layout onLogout={handleLogout} user={currentUser}>
        <Routes>
          {/* Public / Common Routes */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/marks" element={<MarksEntry />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />

          {/* Admin Only Routes */}
          <Route
            path="/students"
            element={
              <RoleBasedRoute user={currentUser} allowedRoles={["admin"]}>
                <StudentManager />
              </RoleBasedRoute>
            }
          />

          <Route
            path="*"
            element={
              <div className="text-center mt-20 text-gray-500">
                Page under construction
              </div>
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;

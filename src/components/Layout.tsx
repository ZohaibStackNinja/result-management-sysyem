import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { User } from "../../types";

interface LayoutProps {
  children?: React.ReactNode;
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen bg-brand-bg overflow-hidden print:overflow-visible print:h-auto print:block">
      <Sidebar user={user} onLogout={onLogout} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative print:overflow-visible print:h-auto print:block">
        <Header
          user={user}
          mobileMenuOpen={mobileMenuOpen}
          toggleMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
          title="Dashboard Overview"
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8 print:p-0 print:overflow-visible print:h-auto bg-brand-bg">
          {children}
        </main>
      </div>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden print:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;

import React, { useState } from "react";
import { LogIn, ShieldCheck, GraduationCap } from "lucide-react";
import { User } from "../../types";
import backendService from "../../services/backendService";

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Use backendService to login
      const response = await backendService.login(email, password);

      if (response?.user) {
        // Token is stored in sessionStorage by backendService
        onLogin(response.user as User);
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (err) {
      setError((err as Error).message || "Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-secondary-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-secondary-700 to-secondary-600 opacity-90"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg border-4 border-primary-500">
              <span className="text-3xl font-bold text-secondary-600">NC</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide uppercase">
              New Covenant
            </h1>
            <h2 className="text-lg font-medium text-primary-300 uppercase tracking-widest">
              School System
            </h2>
            <div className="mt-4 inline-block px-3 py-1 bg-primary-500 text-white text-xs font-bold rounded-full uppercase tracking-wider shadow-xs">
              Raising Contributors
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 shadow-md disabled:opacity-60"
          >
            <LogIn className="w-4 h-4" />
            {loading ? "Signing In..." : "Sign In"}
          </button>

          {/* Demo Accounts */}
          <div className="border-t pt-4 mt-4">
            <h4 className="text-xs font-bold text-gray-400 text-center mb-2">
              DEFAULT ACCOUNTS
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs text-center">
              <div
                className="bg-gray-50 p-2 rounded cursor-pointer hover:bg-gray-100 border border-gray-200 transition"
                onClick={() => {
                  setEmail("admin@school.com");
                  setPassword("admin123");
                }}
              >
                <ShieldCheck className="w-4 h-4 mx-auto mb-1 text-secondary-600" />
                <strong>Admin</strong>
                <br />
                admin@school.com
              </div>

              <div
                className="bg-gray-50 p-2 rounded cursor-pointer hover:bg-gray-100 border border-gray-200 transition"
                onClick={() => {
                  setEmail("teacher1@school.com");
                  setPassword("teacher123");
                }}
              >
                <GraduationCap className="w-4 h-4 mx-auto mb-1 text-primary-600" />
                <strong>Teacher</strong>
                <br />
                teacher1@school.com
              </div>
            </div>
          </div>
        </form>
      </div>

      <div className="mt-8 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} New Covenant School System
      </div>
    </div>
  );
};

export default Login;

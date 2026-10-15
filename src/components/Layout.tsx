import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { BrandLogo } from './icons';
import {
  LogOut,
  User,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  X,
  Sun,
  Moon,
} from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout, isAuthenticated } = useAuth();
  const { toasts, removeToast } = useToast();
  const { isDark, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Top Navbar Header */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200 dark:border-slate-800/80 px-4 sm:px-6 py-3 transition-all shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Brand Logo & Title */}
          <div className="flex items-center space-x-3">
            <BrandLogo size="md" />
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight leading-none bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-600 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                  Gallery Hub
                </h1>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-full font-mono">
                  ENTERPRISE
                </span>
              </div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Remote Device Fleet Manager</span>
            </div>
          </div>

          {/* Right Header Navigation & Actions */}
          <div className="flex items-center space-x-3">
            {/* Dark / Light Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:border-slate-300 dark:hover:border-slate-700 transition-all active:scale-95 shadow-sm"
              title={isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle theme"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400 animate-fade-in" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-600 animate-fade-in" />
              )}
            </button>

            {isAuthenticated && user && (
              <div className="flex items-center space-x-2.5">
                <div className="flex items-center space-x-2.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-inner">
                  <div className="w-6 h-6 rounded-lg bg-indigo-500/15 dark:bg-indigo-500/20 border border-indigo-500/25 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline-block">
                    {user.username}
                  </span>
                </div>

                <button
                  onClick={logout}
                  className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20 active:scale-95"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Screen Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/70 dark:bg-slate-950/80 px-6 py-4 text-xs text-slate-500 dark:text-slate-400 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Gallery Hub &bull; Remote Synchronization Platform</span>
          </div>
          <div className="flex items-center space-x-4 text-[11px] font-mono text-slate-500 dark:text-slate-500">
            <span>WebSocket Live Engine</span>
            <span>&bull;</span>
            <span>Material 3 & Tailwind Architecture</span>
          </div>
        </div>
      </footer>

      {/* Global Accessible Toast Container */}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-md w-full pointer-events-none px-4 sm:px-0"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="alert"
            className={`pointer-events-auto p-4 rounded-2xl glass-modal shadow-2xl border flex items-start space-x-3 animate-slide-in-up transition-all overflow-hidden relative ${
              toast.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200'
                : toast.type === 'error'
                ? 'border-rose-500/30 bg-rose-50 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200'
                : toast.type === 'warning'
                ? 'border-amber-500/30 bg-amber-50 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200'
                : 'border-indigo-500/30 bg-indigo-50 dark:bg-indigo-950/80 text-indigo-900 dark:text-indigo-200'
            }`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />}
              {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
              {toast.type === 'info' && <Info className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold leading-tight uppercase tracking-wider">{toast.title}</h4>
              {toast.message && <p className="text-xs mt-1 text-slate-700 dark:text-slate-300 leading-normal">{toast.message}</p>}
            </div>

            <button
              onClick={() => removeToast(toast.id)}
              className="flex-shrink-0 text-slate-400 hover:text-slate-700 dark:hover:text-slate-100 transition-colors p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Progress line */}
            {toast.durationMs && toast.durationMs > 0 && (
              <div
                className={`absolute bottom-0 left-0 right-0 toast-progress ${
                  toast.type === 'success'
                    ? 'bg-emerald-500/60'
                    : toast.type === 'error'
                    ? 'bg-rose-500/60'
                    : toast.type === 'warning'
                    ? 'bg-amber-500/60'
                    : 'bg-indigo-500/60'
                }`}
                style={{ animationDuration: `${toast.durationMs}ms` }}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

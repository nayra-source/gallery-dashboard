import React, { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { X, Smartphone, Clock, RefreshCw, Copy, Check } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface PairDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDevicePaired?: () => void;
}

export const PairDeviceModal: React.FC<PairDeviceModalProps> = ({ isOpen, onClose, onDevicePaired: _onDevicePaired }) => {
  const { showError, showSuccess } = useToast();
  const modalRef = useFocusTrap(isOpen, onClose);

  const [deviceNameHint, setDeviceNameHint] = useState('');
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateCode = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.generatePairingCode(deviceNameHint.trim() || undefined);
      setCode(res.code);
      setExpiresAt(res.expiresAt);
      showSuccess('Pairing Code Generated', 'Scan QR code or enter code on your Android device.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate code';
      showError('Pairing Failed', msg);
    } finally {
      setIsLoading(false);
    }
  }, [deviceNameHint, showError, showSuccess]);

  useEffect(() => {
    if (isOpen && !code) {
      generateCode();
    }
  }, [isOpen, code, generateCode]);

  useEffect(() => {
    if (!expiresAt) return;

    const targetTime = new Date(expiresAt).getTime();
    const updateTimer = () => {
      const remaining = Math.max(0, targetTime - Date.now());
      setTimeLeftMs(remaining);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const copyCode = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeftMs / 60000);
  const seconds = Math.floor((timeLeftMs % 60000) / 1000);
  const isExpired = timeLeftMs <= 0 && expiresAt !== null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pair New Device"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-lg p-6 sm:p-8 glass-modal rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700/80 animate-scale-in"
      >
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3.5 mb-6">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">Pair New Device</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Scan or enter the numeric code in the Android App</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Device Name Hint (Optional)
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={deviceNameHint}
                onChange={(e) => setDeviceNameHint(e.target.value)}
                placeholder="e.g., Pixel 8 Pro"
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-xl text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
              />
              <button
                type="button"
                onClick={generateCode}
                disabled={isLoading}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-xl transition-all flex items-center space-x-1.5 disabled:opacity-50 active:scale-95 shadow-md shadow-indigo-600/20"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                <span>New</span>
              </button>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <span className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-500 dark:text-slate-400 animate-pulse">Generating pairing code...</p>
            </div>
          ) : isExpired ? (
            <div className="py-8 text-center bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl space-y-3">
              <p className="text-sm font-semibold text-rose-600 dark:text-rose-400">Pairing Code Expired</p>
              <button
                onClick={generateCode}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition-colors active:scale-95"
              >
                Generate New Code
              </button>
            </div>
          ) : code ? (
            <div className="flex flex-col items-center text-center space-y-5 animate-fade-in">
              <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-200">
                <QRCodeSVG value={JSON.stringify({ code })} size={180} level="H" />
              </div>

              <div className="w-full">
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
                  6-Digit Pairing Code
                </div>
                <div className="flex items-center justify-center space-x-3">
                  <span className="font-mono text-3xl font-extrabold tracking-widest text-indigo-600 dark:text-indigo-400 bg-slate-100 dark:bg-slate-900/90 px-6 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 shadow-inner">
                    {code}
                  </span>
                  <button
                    onClick={copyCode}
                    className="p-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors active:scale-95 shadow-sm"
                    title="Copy Code"
                    aria-label="Copy Code"
                  >
                    {copied ? <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3.5 py-1.5 rounded-full">
                <Clock className="w-4 h-4" />
                <span>
                  Code expires in {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-300 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors active:scale-98"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

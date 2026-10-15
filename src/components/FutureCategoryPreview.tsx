import React from 'react';
import { DataCategoryDef, DeviceSummary } from '../types';
import { CategoryIcon } from './icons';
import { Lock, Sparkles, Clock } from 'lucide-react';

interface FutureCategoryPreviewProps {
  category: DataCategoryDef;
  device: DeviceSummary;
}

const FUTURE_DETAILS: Record<string, { title: string; features: string[] }> = {
  screen: {
    title: 'Screen Stream & Capture',
    features: [
      'Real-time display mirroring over WebSocket stream',
      'On-demand HD screenshot capture',
      'Remote touch & input event logging',
    ],
  },
  notifications: {
    title: 'Device Notification Center',
    features: [
      'Live notification stream from all installed apps',
      'Filtered notification category alerts',
      'Historical notification log search',
    ],
  },
  audio: {
    title: 'Audio Streaming & Recording',
    features: [
      'Remote microphone audio clip streaming',
      'System sound and call audio logger',
      'Noise reduction and high-fidelity encoding',
    ],
  },
  filesystem: {
    title: 'File System Explorer',
    features: [
      'Complete directory tree browsing',
      'Remote file upload, download, and permission inspection',
      'App sandbox and external storage access',
    ],
  },
};

export const FutureCategoryPreview: React.FC<FutureCategoryPreviewProps> = ({ category, device }) => {
  const details = FUTURE_DETAILS[category.id] || {
    title: category.name,
    features: [
      'Real-time remote data retrieval',
      'WebSocket stream integration',
      'Secure device access',
    ],
  };

  return (
    <div className="glass-panel p-8 sm:p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-6 animate-fade-in max-w-2xl mx-auto my-8 shadow-sm">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 shadow-inner">
        <CategoryIcon id={category.id} active={true} className="w-8 h-8" />
      </div>

      <div className="space-y-2">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 rounded-full text-xs font-semibold">
          <Lock className="w-3.5 h-3.5" />
          <span>Upcoming Data Source</span>
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{details.title}</h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">{category.description}</p>
      </div>

      <div className="bg-slate-50 dark:bg-slate-900/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-left space-y-3">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>Planned Capabilities</span>
        </h4>
        <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
          {details.features.map((feat, idx) => (
            <li key={idx} className="flex items-center space-x-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400 flex-shrink-0" />
              <span>{feat}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-center space-x-2 text-[11px] text-slate-500 font-mono">
        <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
        <span>
          Device {device.name || device.id} is ready for this category in future dashboard releases.
        </span>
      </div>
    </div>
  );
};

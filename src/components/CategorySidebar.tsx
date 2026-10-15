import React from 'react';
import { DataCategoryId, DataCategoryDef } from '../types';
import { Database } from 'lucide-react';
import { CategoryIcon } from './icons';

interface CategorySidebarProps {
  categories: DataCategoryDef[];
  activeCategoryId: DataCategoryId;
  onSelectCategory: (id: DataCategoryId) => void;
  mediaCounts: {
    all: number;
    photos: number;
    videos: number;
  };
  isLoading: boolean;
}

export const renderCategoryIcon = (id: DataCategoryId, active: boolean) => {
  return <CategoryIcon id={id} active={active} className="w-4 h-4" />;
};

export const CategorySidebar: React.FC<CategorySidebarProps> = ({
  categories,
  activeCategoryId,
  onSelectCategory,
  mediaCounts,
  isLoading,
}) => {
  return (
    <div className="w-full lg:w-72 flex-shrink-0 space-y-4">
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 shadow-sm">
        <div className="flex items-center justify-between px-2 pt-1 pb-2 border-b border-slate-200 dark:border-slate-800/80">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              Data Categories
            </h3>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">{categories.length} Total</span>
        </div>

        {/* Media Categories Group */}
        <div className="space-y-1">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider">
            Media Content
          </div>

          {categories.filter((c) => c.group === 'media').map((cat) => {
            const isActive = activeCategoryId === cat.id;
            let countBadge: number | null = null;
            if (cat.id === 'all-media') countBadge = mediaCounts.all;
            if (cat.id === 'photos') countBadge = mediaCounts.photos;
            if (cat.id === 'videos') countBadge = mediaCounts.videos;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between group active:scale-98 ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-600/20 text-indigo-700 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-500/30 shadow-sm'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div
                    className={`p-1.5 rounded-lg border ${
                      isActive
                        ? 'bg-indigo-100 dark:bg-indigo-500/20 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-300'
                        : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                    }`}
                  >
                    {renderCategoryIcon(cat.id, isActive)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{cat.name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-500 truncate">{cat.description}</div>
                  </div>
                </div>

                {countBadge !== null && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full font-mono ml-1 flex-shrink-0 ${
                      isActive
                        ? 'bg-indigo-100 dark:bg-indigo-500/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-400/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isLoading ? '...' : countBadge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* System Data Group (Future Categories) */}
        <div className="space-y-1 pt-2 border-t border-slate-200 dark:border-slate-800/80">
          <div className="px-2 py-1 text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>System Data</span>
            <span className="text-[9px] text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-500/20 font-semibold">
              Upcoming
            </span>
          </div>

          {categories.filter((c) => c.group === 'system').map((cat) => {
            const isActive = activeCategoryId === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between group active:scale-98 ${
                  isActive
                    ? 'bg-slate-100 dark:bg-slate-800/90 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 shadow-sm'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div
                    className={`p-1.5 rounded-lg border ${
                      isActive
                        ? 'bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200'
                        : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700/60 text-slate-500 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-400'
                    }`}
                  >
                    {renderCategoryIcon(cat.id, isActive)}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold truncate">{cat.name}</div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-500 truncate">{cat.description}</div>
                  </div>
                </div>

                <span className="px-1.5 py-0.5 text-[9px] font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-500 border border-slate-200 dark:border-slate-700/80 flex-shrink-0 ml-1">
                  Soon
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

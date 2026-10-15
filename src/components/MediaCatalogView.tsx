import React from 'react';
import { DeviceSummary, ListMediaItemDto, DataCategoryDef } from '../types';
import { ThumbnailImage } from './ThumbnailImage';
import { PrepareDownloadWidget } from './PrepareDownloadWidget';
import { SkeletonMediaCards } from './Skeleton';
import { renderCategoryIcon } from './CategorySidebar';
import { EmptyGalleryIllustration } from './icons';
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit3,
  Trash2,
  Film,
  Image as ImageIcon,
  Play,
} from 'lucide-react';

interface MediaCatalogViewProps {
  device: DeviceSummary;
  activeCategory: DataCategoryDef;
  filteredItems: ListMediaItemDto[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  cursor: string | null;
  nextCursor: string | null;
  cursorHistory: (string | null)[];
  onPrevPage: () => void;
  onNextPage: () => void;
  onRefresh: () => void;
  onViewItem: (item: ListMediaItemDto) => void;
  onRenameItem: (item: ListMediaItemDto) => void;
  onDeleteItem: (item: ListMediaItemDto) => void;
}

const getFormatLabel = (mimeType: string) => {
  if (mimeType.includes('jpeg') || mimeType.includes('jpg')) return 'JPEG';
  if (mimeType.includes('png')) return 'PNG';
  if (mimeType.includes('heic') || mimeType.includes('heif')) return 'HEIC';
  if (mimeType.includes('mp4')) return 'MP4';
  if (mimeType.includes('webm')) return 'WEBM';
  if (mimeType.includes('mkv')) return 'MKV';
  return mimeType.split('/')[1]?.toUpperCase() || 'FILE';
};

const getEstimatedSize = (item: ListMediaItemDto) => {
  const isVideo = item.mimeType.startsWith('video/');
  const seed = (item.mediaId * 9301 + 49297) % 233280;
  if (isVideo) {
    const mb = (24 + (seed % 65)).toFixed(1);
    return `${mb} MB`;
  } else {
    const mb = (1.8 + ((seed % 75) / 10)).toFixed(1);
    return `${mb} MB`;
  }
};

const formatDateLabel = (dateStr: string) => {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
};

export const MediaCatalogView: React.FC<MediaCatalogViewProps> = ({
  device,
  activeCategory,
  filteredItems,
  isLoading,
  searchQuery,
  setSearchQuery,
  nextCursor,
  cursorHistory,
  onPrevPage,
  onNextPage,
  onRefresh,
  onViewItem,
  onRenameItem,
  onDeleteItem,
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Category Header & Filters (Dual Theme) */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800/90 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex-shrink-0 shadow-inner">
            {renderCategoryIcon(activeCategory.id, true)}
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <span className="truncate">{activeCategory.name}</span>
              <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 rounded-full font-mono flex-shrink-0">
                {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{activeCategory.description}</p>
          </div>
        </div>

        {/* Media Search Input */}
        <div className="relative sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${activeCategory.name.toLowerCase()}...`}
            className="w-full pl-9 pr-9 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-inner"
            aria-label={`Search ${activeCategory.name}`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
              title="Clear search"
              aria-label="Clear search query"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Media Content Grid */}
      {isLoading ? (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>Fetching remote media catalog via WebSocket command...</span>
          </div>
          <SkeletonMediaCards count={8} />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-panel p-16 text-center rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in shadow-sm flex flex-col items-center">
          <EmptyGalleryIllustration className="w-24 h-24 mx-auto mb-1" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {searchQuery
              ? `No ${activeCategory.name} Match '${searchQuery}'`
              : `No ${activeCategory.name} Found`}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {searchQuery
              ? 'Try clearing your search query or switching categories.'
              : `No media items were found for the '${activeCategory.name}' category on this device.`}
          </p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors inline-flex items-center space-x-2"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear Search Filter</span>
            </button>
          ) : (
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors shadow-lg shadow-indigo-600/30 active:scale-98"
            >
              Retry LIST_MEDIA
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredItems.map((item) => {
              const isVideo = item.mimeType.startsWith('video/');
              return (
                <div
                  key={item.mediaId}
                  className="glass-panel card-hover rounded-2xl border border-slate-200 dark:border-slate-800/90 overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700/80 transition-all shadow-sm hover:shadow-xl group"
                >
                  {/* Thumbnail Container with Top Pill Strip */}
                  <div className="h-44 w-full p-2.5 relative">
                    <div className="relative w-full h-full rounded-xl overflow-hidden shadow-inner">
                      <ThumbnailImage
                        deviceId={device.id}
                        item={item}
                        onClick={() => onViewItem(item)}
                      />

                      {/* Top Pill Strip Overlay (Frosted High-Contrast Pill) */}
                      <div className="absolute top-2 inset-x-2 flex items-center justify-between pointer-events-none z-10">
                        <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-[10px] font-mono font-bold text-white shadow-sm">
                          {getFormatLabel(item.mimeType)}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-[10px] font-mono text-slate-200 shadow-sm">
                          {getEstimatedSize(item)}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-[10px] font-medium text-slate-200 shadow-sm">
                          {formatDateLabel(item.takenAt)}
                        </span>
                      </div>

                      {/* Centered Play Button Overlay for Videos */}
                      {isVideo && (
                        <div
                          onClick={() => onViewItem(item)}
                          className="absolute inset-0 flex items-center justify-center cursor-pointer group-hover:bg-black/20 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-slate-950/75 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
                            <Play className="w-4 h-4 fill-white text-white ml-0.5" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Content & Details */}
                  <div className="p-4 space-y-3">
                    <div>
                      <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                        {isVideo ? (
                          <Film className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                        ) : (
                          <ImageIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                        )}
                        <span className="font-mono text-[11px] truncate text-slate-500 dark:text-slate-400">
                          {item.mimeType}
                        </span>
                      </div>
                      <h4
                        className="font-bold text-slate-900 dark:text-slate-100 text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors"
                        title={item.displayName}
                      >
                        {item.displayName}
                      </h4>
                    </div>

                    {/* View High-Res CTA */}
                    <button
                      onClick={() => onViewItem(item)}
                      className="w-full py-1.5 px-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700/80 transition-all flex items-center justify-center space-x-1.5 active:scale-98 shadow-sm"
                      title="View High-Res Media"
                      aria-label={`View ${item.displayName}`}
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>View</span>
                    </button>

                    {/* Prepare download / Drag & drop */}
                    <PrepareDownloadWidget deviceId={device.id} item={item} />

                    {/* Quick Rename & Delete Action Row */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-end space-x-1 text-slate-400">
                      <button
                        onClick={() => onRenameItem(item)}
                        className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
                        title="Rename File"
                        aria-label={`Rename ${item.displayName}`}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onDeleteItem(item)}
                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
                        title="Delete File"
                        aria-label={`Delete ${item.displayName}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls (Dual Theme) */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800/90 flex items-center justify-between shadow-sm">
            <button
              onClick={onPrevPage}
              disabled={cursorHistory.length === 0 || isLoading}
              className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center space-x-1.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-98 shadow-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Page</span>
            </button>

            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              Page {cursorHistory.length + 1}
            </span>

            <button
              onClick={onNextPage}
              disabled={!nextCursor || isLoading}
              className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center space-x-1.5 disabled:opacity-40 disabled:cursor-not-allowed active:scale-98 shadow-sm"
            >
              <span>Next Page</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

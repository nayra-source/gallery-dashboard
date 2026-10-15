import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DeviceSummary } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { PairDeviceModal } from './PairDeviceModal';
import { ConfirmModal } from './ConfirmModal';
import { SkeletonDeviceCards } from './Skeleton';
import {
  Plus,
  RefreshCw,
  ShieldAlert,
  Clock,
  Wifi,
  WifiOff,
  Search,
  Copy,
  Check,
  Trash2,
  Database,
  X,
  LayoutGrid,
  List,
} from 'lucide-react';
import {
  FleetMetricIcon,
  LivePulseMetricIcon,
  QueueMetricIcon,
  SyncEngineMetricIcon,
  HardwareDeviceIcon,
  EmptyFleetIllustration,
} from './icons';

interface DeviceListScreenProps {
  onSelectDevice: (device: DeviceSummary) => void;
}

type FilterTab = 'all' | 'online' | 'offline';
type ViewMode = 'grid' | 'table';

export const DeviceListScreen: React.FC<DeviceListScreenProps> = ({ onSelectDevice }) => {
  const { showError, showSuccess, showWarning } = useToast();

  const [devices, setDevices] = useState<DeviceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);

  // Search, Filter & View state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Revoke modal state
  const [revokeTarget, setRevokeTarget] = useState<DeviceSummary | null>(null);
  const [isRevoking, setIsRevoking] = useState(false);

  // Bulk revoke offline modal state
  const [isBulkRevokeOpen, setIsBulkRevokeOpen] = useState(false);
  const [isBulkRevoking, setIsBulkRevoking] = useState(false);

  const fetchDevices = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const list = await api.getDevices();
      setDevices(list);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load devices';
      showError('Device Error', msg);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(() => fetchDevices(false), 8000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  const handleRevokeConfirm = async () => {
    if (!revokeTarget) return;
    setIsRevoking(true);
    try {
      await api.revokeDevice(revokeTarget.id);
      showSuccess('Device Revoked', `Revoked access for ${revokeTarget.name || revokeTarget.id}`);
      setRevokeTarget(null);
      fetchDevices(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to revoke device';
      showError('Revoke Failed', msg);
    } finally {
      setIsRevoking(false);
    }
  };

  const handleBulkRevokeConfirm = async () => {
    const offlineDevices = devices.filter((d) => !d.isOnline);
    if (offlineDevices.length === 0) return;

    setIsBulkRevoking(true);
    try {
      await Promise.all(offlineDevices.map((d) => api.revokeDevice(d.id)));
      showSuccess('Revoked Inactive Devices', `Revoked access for ${offlineDevices.length} offline device(s).`);
      setIsBulkRevokeOpen(false);
      fetchDevices(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to revoke devices';
      showError('Bulk Revoke Failed', msg);
    } finally {
      setIsBulkRevoking(false);
    }
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSelectDevice = (device: DeviceSummary) => {
    if (!device.isOnline) {
      showWarning(
        'Device Offline',
        `${device.name || 'Device'} is currently offline. Commands will queue until connected.`
      );
    }
    onSelectDevice(device);
  };

  // Filter & Search Logic
  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        (device.name && device.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        device.id.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === 'online') return device.isOnline;
      if (activeTab === 'offline') return !device.isOnline;
      return true;
    });
  }, [devices, searchQuery, activeTab]);

  const onlineCount = useMemo(() => devices.filter((d) => d.isOnline).length, [devices]);
  const offlineCount = useMemo(() => devices.filter((d) => !d.isOnline).length, [devices]);
  const healthPercent = devices.length > 0 ? Math.round((onlineCount / devices.length) * 100) : 100;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Executive Metric Cards Strip (Dual Theme) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Fleet */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 shadow-inner flex items-center justify-center">
            <FleetMetricIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Total Fleet</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-extrabold text-slate-900 dark:text-slate-100">{devices.length}</span>
              <span className="text-[10px] text-slate-500 font-mono">phones</span>
            </div>
          </div>
        </div>

        {/* Metric 2: Live Online */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shadow-inner flex items-center justify-center">
            <LivePulseMetricIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Live Online</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{onlineCount}</span>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-1.5 py-0.2 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                {healthPercent}%
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3: Offline Queue */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 shadow-inner flex items-center justify-center">
            <QueueMetricIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Offline / Queued</span>
            <div className="flex items-baseline space-x-2">
              <span className="text-xl font-extrabold text-slate-900 dark:text-slate-200">{offlineCount}</span>
              <span className="text-[10px] text-slate-500 font-mono">queued</span>
            </div>
          </div>
        </div>

        {/* Metric 4: Sync Engine Status */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800/80 shadow-sm flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 shadow-inner flex items-center justify-center">
            <SyncEngineMetricIcon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Sync Engine</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-200">WebSocket v2</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Banner Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800/90 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Paired Fleet
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-full font-mono">
              {filteredDevices.length} Connected
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Inspect real-time Android device status, dispatch client commands, and browse remote photos and videos.
          </p>
        </div>

        {/* Header Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {offlineCount > 0 && (
            <button
              onClick={() => setIsBulkRevokeOpen(true)}
              className="px-3.5 py-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 active:scale-95"
              title="Clean up test/offline device records"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clean Inactive ({offlineCount})</span>
            </button>
          )}

          <button
            onClick={() => fetchDevices(true)}
            disabled={isRefreshing}
            className="p-2.5 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors active:scale-95 shadow-sm"
            title="Refresh Device List"
            aria-label="Refresh Device List"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={() => setIsPairModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center space-x-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Pair Device</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs, Search Bar, and View Mode Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center p-1 bg-slate-200/60 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl max-w-xs shadow-inner">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All ({devices.length})
          </button>
          <button
            onClick={() => setActiveTab('online')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'online'
                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Online ({onlineCount})
          </button>
          <button
            onClick={() => setActiveTab('offline')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'offline'
                ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Offline ({offlineCount})
          </button>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search Input with Clear Button */}
          <div className="relative flex-1 sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search phone name or ID..."
              className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Switcher (Grid vs Table) */}
          <div className="flex items-center p-1 bg-slate-200/60 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="Grid View"
              aria-label="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
              title="Table View"
              aria-label="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Device Cards Grid with Skeleton Loading */}
      {isLoading ? (
        <SkeletonDeviceCards count={6} />
      ) : filteredDevices.length === 0 ? (
        <div className="glass-panel p-16 text-center rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-fade-in flex flex-col items-center">
          <EmptyFleetIllustration className="w-20 h-20 mx-auto mb-1" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Matching Devices Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {searchQuery
              ? `No devices match '${searchQuery}'. Try clearing your search.`
              : 'Click "Pair Device" to connect your first Android phone.'}
          </p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors"
            >
              Clear Search
            </button>
          ) : (
            <button
              onClick={() => setIsPairModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Pair Device Now</span>
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDevices.map((device) => (
            <div
              key={device.id}
              className={`glass-panel p-5 rounded-2xl border card-hover flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-xl ${
                device.isOnline
                  ? 'border-emerald-500/40 dark:border-emerald-500/30 hover:border-emerald-500/60'
                  : 'border-slate-200 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="space-y-4">
                {/* Header Row: Phone Icon + Name/ID + Status Badge */}
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div
                      className={`p-2.5 rounded-2xl border flex-shrink-0 flex items-center justify-center ${
                        device.isOnline
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 shadow-inner'
                          : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <HardwareDeviceIcon isOnline={device.isOnline} className="w-6 h-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm leading-snug truncate" title={device.name || 'Unnamed Phone'}>
                        {device.name || 'Unnamed Phone'}
                      </h3>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[130px]" title={device.id}>
                          {device.id}
                        </span>
                        <button
                          onClick={(e) => handleCopyId(device.id, e)}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors flex-shrink-0 p-0.5"
                          title="Copy Full ID"
                          aria-label="Copy Full ID"
                        >
                          {copiedId === device.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border flex-shrink-0 ${
                      device.isOnline
                        ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {device.isOnline ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse-glow" />
                        <Wifi className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>Online</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-500" />
                        <WifiOff className="w-3 h-3 text-slate-500" />
                        <span>Offline</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Status info */}
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-500">Connection:</span>
                    <span className={`font-semibold ${device.isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'}`}>
                      {device.isOnline ? 'WebSocket Live' : 'Offline (Queued)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-1 text-slate-500 dark:text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>Last Ping:</span>
                    </div>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex items-center space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800/80">
                <button
                  onClick={() => handleSelectDevice(device)}
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5 active:scale-98"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Browse Data</span>
                </button>

                <button
                  onClick={() => setRevokeTarget(device)}
                  className="py-2 px-3 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 rounded-xl text-xs font-semibold transition-colors flex items-center space-x-1 active:scale-95"
                  title="Revoke Device Access"
                  aria-label="Revoke Device Access"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Revoke</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View (Dual Theme) */
        <div className="glass-panel rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-100/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3.5">Device Name</th>
                <th className="px-5 py-3.5">Device ID</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Last Seen</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
              {filteredDevices.map((device) => (
                <tr key={device.id} className="hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2.5">
                    <HardwareDeviceIcon isOnline={device.isOnline} className="w-5 h-5 flex-shrink-0" />
                    <span>{device.name || 'Unnamed Phone'}</span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-500 dark:text-slate-400">{device.id}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        device.isOnline
                          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${device.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      <span>{device.isOnline ? 'Online' : 'Offline'}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                    {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : 'Never'}
                  </td>
                  <td className="px-5 py-3.5 text-right space-x-2">
                    <button
                      onClick={() => handleSelectDevice(device)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-semibold text-xs transition-colors"
                    >
                      Browse
                    </button>
                    <button
                      onClick={() => setRevokeTarget(device)}
                      className="px-2.5 py-1.5 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-lg text-xs font-semibold transition-colors border border-rose-200 dark:border-transparent"
                    >
                      Revoke
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <PairDeviceModal
        isOpen={isPairModalOpen}
        onClose={() => setIsPairModalOpen(false)}
        onDevicePaired={() => fetchDevices(false)}
      />

      <ConfirmModal
        isOpen={!!revokeTarget}
        title="Revoke Device Access"
        message={`Are you sure you want to revoke '${revokeTarget?.name || 'this device'}'? The device will be disconnected immediately and its JWT invalidated.`}
        confirmLabel="Revoke Access"
        isDanger={true}
        isLoading={isRevoking}
        onConfirm={handleRevokeConfirm}
        onClose={() => setRevokeTarget(null)}
      />

      <ConfirmModal
        isOpen={isBulkRevokeOpen}
        title="Clean Inactive Test Devices"
        message={`Are you sure you want to revoke all ${offlineCount} offline test devices? This will clean up inactive test device records.`}
        confirmLabel="Revoke Inactive Devices"
        isDanger={true}
        isLoading={isBulkRevoking}
        onConfirm={handleBulkRevokeConfirm}
        onClose={() => setIsBulkRevokeOpen(false)}
      />
    </div>
  );
};

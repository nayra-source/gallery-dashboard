import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DeviceSummary } from '../types';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { PairDeviceModal } from './PairDeviceModal';
import { ConfirmModal } from './ConfirmModal';
import {
  Smartphone,
  Plus,
  RefreshCw,
  FileImage,
  ShieldAlert,
  Clock,
  Wifi,
  WifiOff,
  Search,
  Copy,
  Check,
  Trash2,
  Filter,
  Database
} from 'lucide-react';

interface DeviceListScreenProps {
  onSelectDevice: (device: DeviceSummary) => void;
}

type FilterTab = 'all' | 'online' | 'offline';

export const DeviceListScreen: React.FC<DeviceListScreenProps> = ({ onSelectDevice }) => {
  const { showError, showSuccess, showWarning } = useToast();

  const [devices, setDevices] = useState<DeviceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
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
      showSuccess('Revoked Inactive Devices', `Revoked access for ${offlineDevices.length} offline test device(s).`);
      setIsBulkRevokeOpen(false);
      fetchDevices(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to revoke test devices';
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

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">Paired Devices</h1>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full">
                {devices.length} Total
              </span>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                {onlineCount} Online
              </span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage paired Android phones, monitor real-time WebSocket connection status, and inspect device data categories.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {offlineCount > 0 && (
            <button
              onClick={() => setIsBulkRevokeOpen(true)}
              className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5"
              title="Clean up test/offline device records"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clean Inactive ({offlineCount})</span>
            </button>
          )}

          <button
            onClick={() => fetchDevices(true)}
            disabled={isRefreshing}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
            title="Refresh Device List"
            aria-label="Refresh Device List"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          <button
            onClick={() => setIsPairModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Pair New Device</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Filter Tabs */}
        <div className="flex items-center p-1 bg-slate-900/80 border border-slate-800 rounded-xl max-w-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'all'
                ? 'bg-slate-800 text-slate-100 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({devices.length})
          </button>
          <button
            onClick={() => setActiveTab('online')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'online'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Online ({onlineCount})
          </button>
          <button
            onClick={() => setActiveTab('offline')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all ${
              activeTab === 'offline'
                ? 'bg-slate-800 text-slate-300 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Offline ({offlineCount})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative flex-1 sm:max-w-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search device name or ID..."
            className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Device Cards Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <span className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400">Fetching connected devices...</p>
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800 space-y-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 mb-1">
            <Smartphone className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-200">No Matching Devices Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery
              ? `No devices match '${searchQuery}'. Try clearing your search.`
              : 'Click "Pair New Device" to connect your first Android phone.'}
          </p>
          {searchQuery ? (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors"
            >
              Clear Search
            </button>
          ) : (
            <button
              onClick={() => setIsPairModalOpen(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all inline-flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Pair Device Now</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDevices.map((device) => (
            <div
              key={device.id}
              className={`glass-panel p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                device.isOnline
                  ? 'border-emerald-500/40 shadow-lg shadow-emerald-950/20 hover:border-emerald-500/60'
                  : 'border-slate-800/90 hover:border-slate-700'
              }`}
            >
              <div className="space-y-4">
                {/* Header Row: Phone Icon + Name/ID + Status Badge strictly contained */}
                <div className="flex items-start justify-between gap-3 min-w-0">
                  <div className="flex items-center space-x-3 min-w-0 flex-1">
                    <div
                      className={`p-2.5 rounded-xl border flex-shrink-0 ${
                        device.isOnline
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      <Smartphone className="w-5 h-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-slate-100 text-sm leading-snug truncate" title={device.name || 'Unnamed Phone'}>
                        {device.name || 'Unnamed Phone'}
                      </h3>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="text-[11px] text-slate-500 font-mono truncate max-w-[120px]" title={device.id}>
                          {device.id}
                        </span>
                        <button
                          onClick={(e) => handleCopyId(device.id, e)}
                          className="text-slate-500 hover:text-slate-300 transition-colors flex-shrink-0"
                          title="Copy Full ID"
                          aria-label="Copy Full ID"
                        >
                          {copiedId === device.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge - Strictly inside card container */}
                  <div
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border flex-shrink-0 ${
                      device.isOnline
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800/80 text-slate-400 border-slate-700'
                    }`}
                  >
                    {device.isOnline ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
                        <Wifi className="w-3 h-3 text-emerald-400" />
                        <span>Online</span>
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-slate-500" />
                        <WifiOff className="w-3 h-3 text-slate-500" />
                        <span>Offline</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Status info */}
                <div className="pt-3 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Connection:</span>
                    <span className={`font-medium ${device.isOnline ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {device.isOnline ? 'WebSocket Live' : 'Offline (Commands Queue)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-1 text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>Last Seen:</span>
                    </div>
                    <span className="font-mono text-slate-300">
                      {device.lastSeenAt ? new Date(device.lastSeenAt).toLocaleString() : 'Never'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 flex items-center space-x-2 pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => handleSelectDevice(device)}
                  className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-1.5"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>View Data</span>
                </button>

                <button
                  onClick={() => setRevokeTarget(device)}
                  className="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-medium transition-colors flex items-center space-x-1"
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

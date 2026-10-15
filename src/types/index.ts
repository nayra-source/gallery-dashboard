export interface AdminUser {
  token: string;
  username: string;
}

export interface DeviceSummary {
  id: string;
  name: string | null;
  isOnline: boolean;
  lastSeenAt: string | null;
  hasMediaPermission?: boolean;
  permissionState?: 'granted' | 'partially_granted' | 'denied' | 'permanently_denied';
}

export interface GeneratePairingCodeResponse {
  code: string;
  expiresAt: string;
}

export interface SendCommandResponse {
  commandId: string;
  delivered: boolean;
}

export interface CommandStatusResponse {
  commandId: string;
  type: string;
  status: 'pending' | 'sent' | 'acked' | 'failed';
  result: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface ListMediaItemDto {
  mediaId: number;
  displayName: string;
  mimeType: string;
  takenAt: string;
}

export interface ListMediaResultDto {
  items: ListMediaItemDto[];
  nextCursor: string | null;
}

export interface DeleteMediaResultDto {
  status: string;
  trashed?: number[];
  failed?: number[];
  requestedIds: number[];
}

export interface RenameMediaResultDto {
  status: string;
  success?: boolean;
  mediaId: number;
  newName: string;
}

export interface PrepareDownloadResponse {
  transferId: string;
  status: string;
}

export interface TransferStatusResponse {
  status: 'requested' | 'uploading' | 'ready' | 'expired' | 'failed';
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  durationMs?: number;
}

export type DataCategoryId = 'all-media' | 'photos' | 'videos' | 'screen' | 'notifications' | 'audio' | 'filesystem';

export type MainDataCategoryGroup = 'media' | 'system';

export interface DataCategoryDef {
  id: DataCategoryId;
  name: string;
  group: MainDataCategoryGroup;
  description: string;
  isAvailable: boolean;
  subCategory?: 'all' | 'photos' | 'videos';
}


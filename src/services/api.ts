import {
  DeviceSummary,
  GeneratePairingCodeResponse,
  SendCommandResponse,
  CommandStatusResponse,
  PrepareDownloadResponse,
  TransferStatusResponse,
} from '../types';

let authTokenGetter: (() => string | null) | null = null;
let authErrorCallback: (() => void) | null = null;

const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const setAuthTokenGetter = (getter: () => string | null) => {
  authTokenGetter = getter;
};

export const setAuthErrorCallback = (callback: () => void) => {
  authErrorCallback = callback;
};

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const token = authTokenGetter ? authTokenGetter() : null;
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  const response = await fetch(fullUrl, { ...options, headers });

  if (response.status === 401 && authErrorCallback) {
    authErrorCallback();
  }

  return response;
}

async function handleJsonResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP error ${response.status} ${response.statusText}`;
    try {
      const errorJson = await response.json();
      if (errorJson.message) errorMessage = errorJson.message;
      else if (errorJson.code) errorMessage = errorJson.code;
      else if (errorJson.error) errorMessage = errorJson.error;
    } catch {
      // Failed to parse JSON error
    }
    throw new Error(errorMessage);
  }
  return response.json();
}

export const api = {
  // Auth
  async login(username: string, password: string): Promise<{ token: string; username: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    return handleJsonResponse(res);
  },

  // Devices
  async getDevices(): Promise<DeviceSummary[]> {
    const res = await fetchWithAuth('/api/devices');
    return handleJsonResponse(res);
  },

  async revokeDevice(deviceId: string): Promise<{ status: string }> {
    const res = await fetchWithAuth(`/api/devices/${deviceId}/revoke`, {
      method: 'POST',
    });
    return handleJsonResponse(res);
  },

  // Pairing
  async generatePairingCode(deviceNameHint?: string): Promise<GeneratePairingCodeResponse> {
    const res = await fetchWithAuth('/api/pairing/generate', {
      method: 'POST',
      body: JSON.stringify({ deviceNameHint }),
    });
    return handleJsonResponse(res);
  },

  // Commands
  async sendCommand(deviceId: string, type: string, payload?: Record<string, unknown> | string): Promise<SendCommandResponse> {
    const stringPayload = typeof payload === 'object' ? JSON.stringify(payload) : payload;
    const res = await fetchWithAuth(`/api/devices/${deviceId}/commands`, {
      method: 'POST',
      body: JSON.stringify({ type, payload: stringPayload }),
    });
    return handleJsonResponse(res);
  },

  async getCommandStatus(deviceId: string, cmdId: string): Promise<CommandStatusResponse> {
    const res = await fetchWithAuth(`/api/devices/${deviceId}/commands/${cmdId}`);
    return handleJsonResponse(res);
  },

  // Poll command until acked, failed, or timed out
  async executeCommandAndPoll<T>(
    deviceId: string,
    type: string,
    payload?: Record<string, unknown> | string,
    timeoutMs = 15000,
    intervalMs = 800
  ): Promise<T> {
    const sendRes = await this.sendCommand(deviceId, type, payload);
    if (!sendRes.commandId) {
      throw new Error('Failed to dispatch command to device.');
    }

    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
      try {
        const statusRes = await this.getCommandStatus(deviceId, sendRes.commandId);
        if (statusRes.status === 'acked') {
          if (!statusRes.result) {
            return {} as T;
          }
          try {
            return JSON.parse(statusRes.result) as T;
          } catch {
            return statusRes.result as unknown as T;
          }
        }
        if (statusRes.status === 'failed') {
          throw new Error(statusRes.result || 'Command failed on device.');
        }
      } catch (err: unknown) {
        // If status endpoint returns 404 (or before backend was updated), fail gracefully or rethrow
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('404')) {
          throw new Error('Device command polling not supported on this server version.');
        }
        throw err;
      }
    }

    throw new Error('Command timed out waiting for device response.');
  },

  // Transfers
  async prepareTransfer(deviceId: string, mediaId: number): Promise<PrepareDownloadResponse> {
    const res = await fetchWithAuth('/api/transfers/prepare', {
      method: 'POST',
      body: JSON.stringify({ deviceId, mediaId }),
    });
    return handleJsonResponse(res);
  },

  async getTransferStatus(transferId: string): Promise<TransferStatusResponse> {
    const res = await fetchWithAuth(`/api/transfers/${transferId}/status`);
    return handleJsonResponse(res);
  },

  getDownloadUrl(transferId: string): string {
    return `/api/transfers/${transferId}/download`;
  },

  async fetchDownloadBlob(transferId: string): Promise<Blob> {
    const res = await fetchWithAuth(this.getDownloadUrl(transferId));
    if (!res.ok) {
      throw new Error(`Failed to download transfer file (${res.status})`);
    }
    return res.blob();
  },

  async deleteTransfer(transferId: string): Promise<void> {
    const res = await fetchWithAuth(`/api/transfers/${transferId}`, {
      method: 'DELETE',
    });
    if (!res.ok && res.status !== 404) {
      // Ignore 404 or log warning
    }
  },
};

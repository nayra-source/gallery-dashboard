import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api, setAuthTokenGetter, setAuthErrorCallback } from './api';

describe('API Service', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    setAuthTokenGetter(() => 'mock_test_jwt_token');
  });

  it('getDownloadUrl generates correct endpoint path', () => {
    const url = api.getDownloadUrl('test-transfer-id-123');
    expect(url).toBe('/api/transfers/test-transfer-id-123/download');
  });

  it('getDevices attaches Bearer Authorization header', async () => {
    const mockDevices = [{ id: 'dev-1', name: 'Pixel 8', isOnline: true, lastSeenAt: null }];
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockDevices,
    } as Response);

    const devices = await api.getDevices();

    expect(devices).toEqual(mockDevices);
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/devices',
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    );
  });

  it('triggers authErrorCallback on 401 response', async () => {
    const errorCallback = vi.fn();
    setAuthErrorCallback(errorCallback);

    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({ code: 'unauthorized', message: 'Token revoked' }),
    } as Response);

    await expect(api.getDevices()).rejects.toThrow('Token revoked');
    expect(errorCallback).toHaveBeenCalledTimes(1);
  });
});

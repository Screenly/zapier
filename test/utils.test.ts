import nock from 'nock';
import utils from '../src/utils.js';
import { describe, beforeEach, it, vi, expect } from 'vitest';

const TEST_API_KEY = 'test-api-key';

describe('Utils', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  describe('getLabel', () => {
    it('successfully fetches a label', async () => {
      const z = {
        request: vi.fn().mockResolvedValue({
          status: 200,
          data: [{ id: 'label-123', name: 'test-label' }],
        }),
        authData: { api_key: TEST_API_KEY },
      };
      const bundle = { authData: { api_key: TEST_API_KEY } };

      const label = await utils.getLabel(z, bundle, { name: 'test-label' });
      expect(label.id).toBe('label-123');
      expect(label.name).toBe('test-label');
    });

    it('throws error when no labels found', async () => {
      const z = {
        request: vi.fn().mockResolvedValue({
          status: 200,
          data: [],
        }),
        authData: { api_key: TEST_API_KEY },
      };
      const bundle = { authData: { api_key: TEST_API_KEY } };

      await expect(
        utils.getLabel(z, bundle, { name: 'test-label' })
      ).rejects.toThrow('No labels returned from the Screenly API');
    });
  });

  describe('getPlaylistsByLabel', () => {
    it('successfully fetches playlists by label', async () => {
      const z = {
        request: vi.fn().mockResolvedValue({
          status: 200,
          data: [{ playlist_id: 'playlist-1' }, { playlist_id: 'playlist-2' }],
        }),
        authData: { api_key: TEST_API_KEY },
      };
      const bundle = { authData: { api_key: TEST_API_KEY } };

      const playlists = await utils.getPlaylistsByLabel(z, bundle, {
        labelId: 'label-123',
      });
      expect(playlists).toHaveLength(2);
      expect(playlists[0].playlist_id).toBe('playlist-1');
    });

    it('handles error response', async () => {
      const z = {
        request: vi.fn().mockResolvedValue({
          status: 404,
          data: { error: 'Not found' },
        }),
        authData: { api_key: TEST_API_KEY },
      };
      const bundle = { authData: { api_key: TEST_API_KEY } };

      await expect(
        utils.getPlaylistsByLabel(z, bundle, { labelId: 'label-123' })
      ).rejects.toThrow('Failed to fetch playlist to labels');
    });
  });

  describe('deletePlaylist', () => {
    it('successfully deletes a playlist', async () => {
      const z = {
        request: vi.fn().mockResolvedValue({
          status: 200,
          data: {},
        }),
        authData: { api_key: TEST_API_KEY },
      };
      const bundle = { authData: { api_key: TEST_API_KEY } };

      const result = await utils.deletePlaylist(z, bundle, {
        playlistId: 'playlist-123',
      });
      expect(result).toBe(true);
    });

    it('handles failed deletion', async () => {
      const z = {
        request: vi.fn().mockResolvedValue({
          status: 404,
          data: { error: 'Not found' },
        }),
        authData: { api_key: TEST_API_KEY },
      };
      const bundle = { authData: { api_key: TEST_API_KEY } };

      const result = await utils.deletePlaylist(z, bundle, {
        playlistId: 'playlist-123',
      });
      expect(result).toBe(false);
    });
  });

  describe('createPlaylist', () => {
    it('successfully creates a playlist', async () => {
      const z = {
        request: vi.fn().mockResolvedValue({
          status: 201,
          data: [
            {
              id: 'playlist-123',
              title: 'Test Playlist',
              predicate: 'TRUE',
            },
          ],
        }),
        authData: { api_key: TEST_API_KEY },
      };
      const bundle = { authData: { api_key: TEST_API_KEY } };

      const playlist = await utils.createPlaylist(z, bundle, {
        title: 'Test Playlist',
        predicate: 'TRUE',
      });
      expect(playlist.id).toBe('playlist-123');
      expect(playlist.title).toBe('Test Playlist');
    });

    it('throws error when no playlist returned', async () => {
      const z = {
        request: vi.fn().mockResolvedValue({
          status: 201,
          data: [],
        }),
        authData: { api_key: TEST_API_KEY },
      };
      const bundle = { authData: { api_key: TEST_API_KEY } };

      await expect(
        utils.createPlaylist(z, bundle, {
          title: 'Test Playlist',
          predicate: 'TRUE',
        })
      ).rejects.toThrow('No playlists returned from the Screenly API');
    });
  });

  describe('waitForAssetReady', () => {
    it('waits for asset to be ready', async () => {
      const z = {
        request: vi
          .fn()
          .mockResolvedValueOnce({
            status: 200,
            data: [{ status: '' }],
          })
          .mockResolvedValueOnce({
            status: 200,
            data: [{ status: 'finished' }],
          }),
        console: { log: vi.fn() },
      };

      const status = await utils.waitForAssetReady(
        z,
        'asset-123',
        TEST_API_KEY
      );
      expect(status).toBe('finished');
      expect(z.console.log).toHaveBeenCalledWith(
        'Asset asset-123 status: finished'
      );
    });
  });

  describe('createAsset', () => {
    it('throws error when no assets returned', async () => {
      const z = {
        request: vi.fn().mockResolvedValue({
          status: 201,
          data: [],
        }),
        authData: { api_key: TEST_API_KEY },
      };
      const bundle = { authData: { api_key: TEST_API_KEY } };

      await expect(
        utils.createAsset(z, bundle, {
          title: 'Test Asset',
          sourceUrl: 'https://example.com/asset.jpg',
        })
      ).rejects.toThrow('No assets returned from the Screenly API');
    });
  });

  describe('createPlaylistItem', () => {
    it('omits duration from the payload when it is not set', async () => {
      const z = {
        request: vi.fn().mockResolvedValue({
          status: 201,
          data: [{ id: 'item-123' }],
        }),
        authData: { api_key: TEST_API_KEY },
      };
      const bundle = { authData: { api_key: TEST_API_KEY } };

      const item = await utils.createPlaylistItem(z, bundle, {
        assetId: 'asset-123',
        playlistId: 'playlist-123',
        duration: 0,
      });

      expect(item.id).toBe('item-123');
      expect(z.request.mock.calls[0][0].body).toEqual({
        asset_id: 'asset-123',
        playlist_id: 'playlist-123',
      });
    });

    it('throws error when no playlist items returned', async () => {
      const z = {
        request: vi.fn().mockResolvedValue({
          status: 201,
          data: [],
        }),
        authData: { api_key: TEST_API_KEY },
      };
      const bundle = { authData: { api_key: TEST_API_KEY } };

      await expect(
        utils.createPlaylistItem(z, bundle, {
          assetId: 'asset-123',
          playlistId: 'playlist-123',
          duration: 10,
        })
      ).rejects.toThrow('No playlist items returned from the Screenly API');
    });
  });

  describe('assignPlaylistToScreen', () => {
    it('treats a 409 as an already-assigned no-op', async () => {
      const z = {
        request: vi.fn().mockResolvedValue({ status: 409, data: {} }),
        console: { log: vi.fn() },
        authData: { api_key: TEST_API_KEY },
      };
      const bundle = { authData: { api_key: TEST_API_KEY } };

      const result = await utils.assignPlaylistToScreen(z, bundle, {
        screenId: 'screen-123',
        playlistId: 'playlist-123',
      });

      expect(result.message).toBe('Successfully assigned playlist to screen');
      expect(z.console.log).toHaveBeenCalledWith(
        'Playlist already assigned to screen'
      );
    });

    it('throws on a non-409 error response', async () => {
      const z = {
        request: vi.fn().mockResolvedValue({ status: 500, data: {} }),
        console: { log: vi.fn() },
        authData: { api_key: TEST_API_KEY },
      };
      const bundle = { authData: { api_key: TEST_API_KEY } };

      await expect(
        utils.assignPlaylistToScreen(z, bundle, {
          screenId: 'screen-123',
          playlistId: 'playlist-123',
        })
      ).rejects.toThrow('Failed to assign playlist to screen');
    });
  });

  describe('deleteAsset', () => {
    it('reports failure when the API does not return 200', async () => {
      const z = {
        request: vi.fn().mockResolvedValue({ status: 404, data: {} }),
        authData: { api_key: TEST_API_KEY },
      };
      const bundle = { authData: { api_key: TEST_API_KEY } };

      await expect(
        utils.deleteAsset(z, bundle, { assetId: 'asset-123' })
      ).resolves.toBe(false);
    });
  });
});

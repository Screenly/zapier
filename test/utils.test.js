const zapier = require('zapier-platform-core');
const nock = require('nock');
const utils = require('../utils');
const { READY_STATES } = require('../constants');

const TEST_API_KEY = 'test-api-key';

describe('Utils', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  describe('getLabel', () => {
    it('successfully fetches a label', async () => {
      const z = {
        request: jest.fn().mockResolvedValue({
          status: 200,
          json: [{ id: 'label-123', name: 'test-label' }]
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
        request: jest.fn().mockResolvedValue({
          status: 200,
          json: []
        }),
        authData: { api_key: TEST_API_KEY },
      };
      const bundle = { authData: { api_key: TEST_API_KEY } };

      await expect(utils.getLabel(z, bundle, { name: 'test-label' }))
        .rejects.toThrow('No labels returned from the Screenly API');
    });
  });

  describe('getPlaylistsByLabel', () => {
    it('successfully fetches playlists by label', async () => {
      const z = {
        request: jest.fn().mockResolvedValue({
          status: 200,
          json: [
            { playlist_id: 'playlist-1' },
            { playlist_id: 'playlist-2' },
          ]
        }),
        authData: { api_key: TEST_API_KEY },
      };
      const bundle = { authData: { api_key: TEST_API_KEY } };

      const playlists = await utils.getPlaylistsByLabel(z, bundle, { labelId: 'label-123' });
      expect(playlists).toHaveLength(2);
      expect(playlists[0].playlist_id).toBe('playlist-1');
    });

    it('handles error response', async () => {
      const z = {
        request: jest.fn().mockResolvedValue({
          status: 404,
          json: { error: 'Not found' }
        }),
        authData: { api_key: TEST_API_KEY },
      };
      const bundle = { authData: { api_key: TEST_API_KEY } };

      await expect(utils.getPlaylistsByLabel(z, bundle, { labelId: 'label-123' }))
        .rejects.toThrow('Failed to fetch playlist to labels');
    });
  });

  describe('deletePlaylist', () => {
    it('successfully deletes a playlist', async () => {
      const z = {
        request: jest.fn().mockResolvedValue({
          status: 200,
          json: {}
        }),
        authData: { api_key: TEST_API_KEY },
      };
      const bundle = { authData: { api_key: TEST_API_KEY } };

      const result = await utils.deletePlaylist(z, bundle, { playlistId: 'playlist-123' });
      expect(result).toBe(true);
    });

    it('handles failed deletion', async () => {
      const z = {
        request: jest.fn().mockResolvedValue({
          status: 404,
          json: { error: 'Not found' }
        }),
        authData: { api_key: TEST_API_KEY },
      };
      const bundle = { authData: { api_key: TEST_API_KEY } };

      const result = await utils.deletePlaylist(z, bundle, { playlistId: 'playlist-123' });
      expect(result).toBe(false);
    });
  });

  describe('createPlaylist', () => {
    it('successfully creates a playlist', async () => {
      const z = {
        request: jest.fn().mockResolvedValue({
          status: 201,
          json: [{
            id: 'playlist-123',
            title: 'Test Playlist',
            predicate: 'TRUE',
          }]
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
        request: jest.fn().mockResolvedValue({
          status: 201,
          json: []
        }),
        authData: { api_key: TEST_API_KEY },
      };
      const bundle = { authData: { api_key: TEST_API_KEY } };

      await expect(utils.createPlaylist(z, bundle, {
        title: 'Test Playlist',
        predicate: 'TRUE',
      })).rejects.toThrow('No playlists returned from the Screenly API');
    });
  });

  describe('waitForAssetReady', () => {
    it('waits for asset to be ready', async () => {
      const z = {
        request: jest.fn()
          .mockResolvedValueOnce({
            status: 200,
            json: [{ status: '' }]
          })
          .mockResolvedValueOnce({
            status: 200,
            json: [{ status: 'finished' }]
          }),
        console: { log: jest.fn() },
      };

      const status = await utils.waitForAssetReady(z, 'asset-123', TEST_API_KEY);
      expect(status).toBe('finished');
      expect(z.console.log).toHaveBeenCalledWith('Asset asset-123 status: finished');
    });
  });
});

import zapier from 'zapier-platform-core';
import App from '../src/index.js';
import nock from 'nock';
import { describe, beforeEach, test, expect } from 'vitest';

const TEST_API_KEY = 'valid-api-key';
const appTester = zapier.createAppTester(App);

interface CleanupResponse {
  playlists_removed: number;
  assets_removed: number;
  message: string;
}

describe('Cleanup', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  test('successfully cleans up Zapier content', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY,
      },
      inputData: {
        confirm: true,
      },
    };

    // Mock labels list with Zapier label
    nock('https://api.screenlyapp.com')
      .get('/api/v4/labels/?name=eq.created_by_zapier')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, [
        {
          id: 'label-123',
          name: 'created_by_zapier',
        },
      ]);

    // Mock playlist to label mappings
    nock('https://api.screenlyapp.com')
      .get('/api/v4/labels/playlists?label_id=eq.label-123')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, [
        { playlist_id: 'playlist-1', label_id: 'label-123' },
        { playlist_id: 'playlist-2', label_id: 'label-123' },
      ]);

    // Mock playlist deletions
    nock('https://api.screenlyapp.com')
      .delete('/api/v4/playlists/?id=eq.playlist-1')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200);

    nock('https://api.screenlyapp.com')
      .delete('/api/v4/playlists/?id=eq.playlist-2')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200);

    // Mock assets created by Zapier
    nock('https://api.screenlyapp.com')
      .get(
        '/api/v4/assets/?metadata->tags=cs.["created_by_zapier"]&or=(status.eq.downloading,status.eq.processing,status.eq.finished)'
      )
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, [{ id: 'asset-1' }, { id: 'asset-2' }]);

    // Mock asset deletions
    nock('https://api.screenlyapp.com')
      .delete('/api/v4/assets/?id=eq.asset-1')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200);

    nock('https://api.screenlyapp.com')
      .delete('/api/v4/assets/?id=eq.asset-2')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200);

    const response = (await appTester(
      App.creates.cleanup_zapier_content.operation.perform,
      bundle
    )) as CleanupResponse;

    expect(response.playlists_removed).toBe(2);
    expect(response.assets_removed).toBe(2);
    expect(response.message).toBe(
      'Successfully removed 2 playlists and 2 assets'
    );
  });

  test('requires confirmation', async () => {
    const bundle = {
      authData: { api_key: TEST_API_KEY },
      inputData: {
        confirm: false,
      },
    };

    await expect(
      appTester(App.creates.cleanup_zapier_content.operation.perform, bundle)
    ).rejects.toThrow('Please confirm the cleanup operation');
  });

  test('handles empty lists', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY,
      },
      inputData: {
        confirm: true,
      },
    };

    // Mock empty labels list
    nock('https://api.screenlyapp.com')
      .get('/api/v4/labels/?name=eq.created_by_zapier')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, []);

    await expect(
      appTester(App.creates.cleanup_zapier_content.operation.perform, bundle)
    ).rejects.toThrow('No labels returned from the Screenly API');
  });
});

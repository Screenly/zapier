const zapier = require('zapier-platform-core');
const App = require('../index');
const utils = require('../utils');
const nock = require('nock');

const TEST_API_KEY = 'valid-api-key';

// Create a new version of the app for testing
const appTester = zapier.createAppTester(App);

// Mock the environment variables
process.env.BASE_URL = 'https://api.screenlyapp.com';
zapier.tools.env.inject();

describe('Authentication', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  test('succeeds with valid API key', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY,
      },
    };

    nock('https://api.screenlyapp.com')
      .get('/api/v4/assets/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, []);

    const response = await appTester(App.authentication.test, bundle);
    expect(Array.isArray(response)).toBe(true);
  });

  test('fails with invalid API key', async () => {
    const bundle = {
      authData: {
        api_key: 'invalid-api-key',
      },
    };

    nock('https://api.screenlyapp.com')
      .get('/api/v4/assets/')
      .matchHeader('Authorization', 'Token invalid-api-key')
      .reply(401, { detail: 'Invalid token' });

    await expect(appTester(App.authentication.test, bundle)).rejects.toThrow();
  });
});

describe('Upload Asset', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  test('successfully uploads an asset', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY,
      },
      inputData: {
        file: 'https://example.com/image.jpg',
        title: 'Test Image',
      },
    };

    // Mock the file download
    nock('https://example.com').get('/image.jpg').reply(200, 'fake-file-content');

    // Mock the asset upload
    nock('https://api.screenlyapp.com')
      .post('/api/v4/assets/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(201, [
        {
          id: 'asset-123',
          title: 'Test Image',
          duration: null,
        }
      ]);

    const response = await appTester(App.creates.upload_asset.operation.perform, bundle);
    expect(response.id).toBe('asset-123');
    expect(response.title).toBe('Test Image');
    expect(response.duration).toBe(null);
  });

  test('handles upload failure', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY,
      },
      inputData: {
        file: 'https://example.com/image.jpg',
        title: 'Test Image',
        duration: 10,
      },
    };

    nock('https://example.com').get('/image.jpg').reply(404);

    await expect(appTester(App.creates.upload_asset.operation.perform, bundle)).rejects.toThrow();
  });
});

describe('Schedule Playlist Item', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  test('successfully adds asset to playlist without conditions', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY,
      },
      inputData: {
        playlist_id: 'playlist-123',
        asset_id: 'asset-123',
        duration: 15,
      },
    };

    // Mock the asset status check
    nock('https://api.screenlyapp.com')
      .get('/api/v4/assets?id=eq.asset-123')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, [{
        id: 'asset-123',
        status: 'finished'
      }]);

    // Mock the playlist item creation
    nock('https://api.screenlyapp.com')
      .post('/api/v4/playlist-items/', {
        asset_id: 'asset-123',
        playlist_id: 'playlist-123',
        duration: 15
      })
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(201, [{
        id: 'item-123',
        playlist_id: 'playlist-123',
        asset_id: 'asset-123'
      }]);

    const response = await appTester(App.creates.schedule_playlist_item.operation.perform, bundle);
    expect(response.id).toBe('item-123');
  });

  test('successfully adds asset with scheduling', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY,
      },
      inputData: {
        playlist_id: 'playlist-123',
        asset_id: 'asset-123',
        duration: 20,
      },
    };

    // Mock the asset status check
    nock('https://api.screenlyapp.com')
      .get('/api/v4/assets?id=eq.asset-123')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, [{
        id: 'asset-123',
        status: 'finished'
      }]);

    // Mock the playlist item creation
    nock('https://api.screenlyapp.com')
      .post('/api/v4/playlist-items/', {
        asset_id: 'asset-123',
        playlist_id: 'playlist-123',
        duration: 20
      })
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(201, [{
        id: 'item-123',
        playlist_id: 'playlist-123',
        asset_id: 'asset-123'
      }]);

    const response = await appTester(App.creates.schedule_playlist_item.operation.perform, bundle);
    expect(response.id).toBe('item-123');
  });

  test('handles duration update failure', async () => {
    const bundle = {
      authData: { api_key: TEST_API_KEY },
      inputData: {
        asset_id: 'asset-123',
        playlist_id: 'playlist-123',
        duration: -1,
      },
    };

    nock('https://api.screenlyapp.com')
      .patch('/api/v4/assets/asset-123/', {
        duration: -1,
      })
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(400, { detail: 'Invalid duration' });

    await expect(
      appTester(App.creates.schedule_playlist_item.operation.perform, bundle)
    ).rejects.toThrow();
  });

  test('handles playlist addition failure', async () => {
    const bundle = {
      authData: { api_key: TEST_API_KEY },
      inputData: {
        asset_id: 'asset-123',
        playlist_id: 'playlist-123',
      },
    };

    nock('https://api.screenlyapp.com')
      .post('/api/v4/playlist-items/', {
        asset: 'asset-123',
        playlist: 'playlist-123',
      })
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(404, { detail: 'Playlist not found' });

    await expect(
      appTester(App.creates.schedule_playlist_item.operation.perform, bundle)
    ).rejects.toThrow();
  });
});

describe('Helper Functions', () => {
  test('makeRequest handles error response', async () => {
    const z = {
      request: jest.fn().mockResolvedValue({
        status: 404,
        json: { error: 'Not found' },
      }),
      authData: {
        api_key: TEST_API_KEY,
      },
    };

    await expect(utils.makeRequest(z, 'https://api.screenlyapp.com/api/v4/test/')).rejects.toThrow(
      'Screenly API Error'
    );
  });

  test('handleError returns json on success', async () => {
    const response = {
      status: 200,
      json: { data: 'test' },
    };

    const result = utils.handleError(response, 'Error message');
    expect(result).toEqual({ data: 'test' });
  });

  test('makeRequest includes custom headers', async () => {
    const z = {
      request: jest.fn().mockResolvedValue({
        status: 200,
        json: { data: 'test' },
      }),
      authData: {
        api_key: TEST_API_KEY,
      },
    };

    await utils.makeRequest(z, 'https://api.screenlyapp.com/api/v4/test/', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    expect(z.request).toHaveBeenCalledWith({
      url: 'https://api.screenlyapp.com/api/v4/test/',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Token ${TEST_API_KEY}`,
      },
    });
  });
});

describe('Dynamic Dropdowns', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  test('fetches playlists for dropdown', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY,
      },
    };

    nock('https://api.screenlyapp.com')
      .get('/api/v4/playlists/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, [
        { id: 'playlist-1', name: 'Playlist 1' },
        { id: 'playlist-2', name: 'Playlist 2' },
      ]);

    const response = await appTester(App.triggers.get_playlists.operation.perform, bundle);
    expect(response).toHaveLength(2);
    expect(response[0].id).toBe('playlist-1');
    expect(response[1].name).toBe('Playlist 2');
  });

  test('fetches assets for dropdown', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY,
      },
    };

    nock('https://api.screenlyapp.com')
      .get('/api/v4/assets/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, [
        { id: 'asset-1', title: 'Asset 1' },
        { id: 'asset-2', title: 'Asset 2' },
      ]);

    const response = await appTester(App.triggers.get_assets.operation.perform, bundle);
    expect(response).toHaveLength(2);
    expect(response[0].id).toBe('asset-1');
    expect(response[1].title).toBe('Asset 2');
  });

  test('fetches screens for dropdown', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY,
      },
    };

    nock('https://api.screenlyapp.com')
      .get('/api/v4/screens/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, [
        { id: 'screen-1', name: 'Screen 1' },
        { id: 'screen-2', name: 'Screen 2' },
      ]);

    const response = await appTester(App.triggers.get_screens.operation.perform, bundle);
    expect(response).toHaveLength(2);
    expect(response[0].id).toBe('screen-1');
    expect(response[1].name).toBe('Screen 2');
  });
});

describe('Complete Workflow', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  test('successfully sets up complete workflow with existing playlist', async () => {
    const bundle = {
      authData: { api_key: TEST_API_KEY },
      inputData: {
        file: 'https://example.com/test.jpg',
        title: 'Test Asset',
        playlist_id: 'playlist-123',
        screen_id: 'screen-123',
      },
    };

    nock('https://example.com').get('/test.jpg').reply(200, Buffer.from('fake-image-data'));

    nock('https://api.screenlyapp.com').post('/api/v4/assets/').reply(201, {
      id: 'asset-123',
      title: 'Test Asset',
    });

    nock('https://api.screenlyapp.com')
      .post('/api/v4/playlist-items/', {
        asset: 'asset-123',
        playlist: 'playlist-123',
      })
      .reply(201, {
        id: 'item-123',
      });

    nock('https://api.screenlyapp.com')
      .patch('/api/v4/screens/screen-123/', {
        playlist: 'playlist-123',
      })
      .reply(200, {
        id: 'screen-123',
        playlist: 'playlist-123',
      });

    const response = await appTester(App.creates.complete_workflow.operation.perform, bundle);
    expect(response.asset.id).toBe('asset-123');
    expect(response.playlist_id).toBe('playlist-123');
    expect(response.screen_id).toBe('screen-123');
  });

  test('successfully creates new playlist during workflow', async () => {
    const bundle = {
      authData: { api_key: TEST_API_KEY },
      inputData: {
        file: 'https://example.com/test.jpg',
        title: 'Test Asset',
        new_playlist_name: 'New Playlist',
        screen_id: 'screen-123',
      },
    };

    nock('https://example.com').get('/test.jpg').reply(200, Buffer.from('fake-image-data'));

    nock('https://api.screenlyapp.com').post('/api/v4/assets/').reply(201, {
      id: 'asset-123',
      title: 'Test Asset',
    });

    nock('https://api.screenlyapp.com')
      .post('/api/v4/playlists/', {
        name: 'New Playlist',
        tags: ['created_by_zapier'],
      })
      .reply(201, {
        id: 'playlist-123',
        name: 'New Playlist',
        tags: ['created_by_zapier'],
      });

    nock('https://api.screenlyapp.com')
      .post('/api/v4/playlist-items/', {
        asset: 'asset-123',
        playlist: 'playlist-123',
      })
      .reply(201, {
        id: 'item-123',
      });

    nock('https://api.screenlyapp.com')
      .patch('/api/v4/screens/screen-123/', {
        playlist: 'playlist-123',
      })
      .reply(200, {
        id: 'screen-123',
        playlist: 'playlist-123',
      });

    const response = await appTester(App.creates.complete_workflow.operation.perform, bundle);
    expect(response.asset.id).toBe('asset-123');
    expect(response.playlist_id).toBe('playlist-123');
    expect(response.screen_id).toBe('screen-123');
  });

  test('handles missing playlist information', async () => {
    const bundle = {
      authData: { api_key: TEST_API_KEY },
      inputData: {
        file: 'https://example.com/test.jpg',
        title: 'Test Asset',
        screen_id: 'screen-123',
      },
    };

    await expect(
      appTester(App.creates.complete_workflow.operation.perform, bundle)
    ).rejects.toThrow('Either select an existing playlist or provide a name for a new one');
  });
});

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

    // Mock assets list with some Zapier-created assets
    nock('https://api.screenlyapp.com')
      .get('/api/v4/assets/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, [
        { id: 'asset-1', title: 'Asset 1', tags: ['created_by_zapier'] },
        { id: 'asset-2', title: 'Asset 2', tags: [] },
        { id: 'asset-3', title: 'Asset 3', tags: ['created_by_zapier'] },
      ]);

    // Mock playlists list with some Zapier-created playlists
    nock('https://api.screenlyapp.com')
      .get('/api/v4/playlists/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, [
        { id: 'playlist-1', name: 'Playlist 1', tags: ['created_by_zapier'] },
        { id: 'playlist-2', name: 'Playlist 2', tags: [] },
      ]);

    // Mock playlist deletions
    nock('https://api.screenlyapp.com')
      .delete('/api/v4/playlists/playlist-1/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(204);

    // Mock asset deletions
    nock('https://api.screenlyapp.com')
      .delete('/api/v4/assets/asset-1/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(204);

    nock('https://api.screenlyapp.com')
      .delete('/api/v4/assets/asset-3/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(204);

    const response = await appTester(App.creates.cleanup_zapier_content.operation.perform, bundle);
    expect(response.playlists_removed).toBe(1);
    expect(response.assets_removed).toBe(2);
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

    // Mock empty assets list
    nock('https://api.screenlyapp.com')
      .get('/api/v4/assets/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, []);

    // Mock empty playlists list
    nock('https://api.screenlyapp.com')
      .get('/api/v4/playlists/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, []);

    const response = await appTester(App.creates.cleanup_zapier_content.operation.perform, bundle);
    expect(response.playlists_removed).toBe(0);
    expect(response.assets_removed).toBe(0);
  });
});

const zapier = require('zapier-platform-core');
const App = require('../index');
const nock = require('nock');

const TEST_API_KEY = 'valid-api-key';
const appTester = zapier.createAppTester(App);

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

    nock('https://api.screenlyapp.com')
      .get('/api/v4/assets?id=eq.asset-123')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, [
        {
          id: 'asset-123',
          status: 'finished',
        },
      ]);

    nock('https://api.screenlyapp.com')
      .post('/api/v4/playlist-items/', {
        asset_id: 'asset-123',
        playlist_id: 'playlist-123',
        duration: 15,
      })
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(201, [
        {
          id: 'item-123',
          playlist_id: 'playlist-123',
          asset_id: 'asset-123',
        },
      ]);

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

    nock('https://api.screenlyapp.com')
      .get('/api/v4/assets?id=eq.asset-123')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, [
        {
          id: 'asset-123',
          status: 'finished',
        },
      ]);

    nock('https://api.screenlyapp.com')
      .post('/api/v4/playlist-items/', {
        asset_id: 'asset-123',
        playlist_id: 'playlist-123',
        duration: 20,
      })
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(201, [
        {
          id: 'item-123',
          playlist_id: 'playlist-123',
          asset_id: 'asset-123',
        },
      ]);

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

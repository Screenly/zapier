const zapier = require('zapier-platform-core');
const App = require('../index');
const nock = require('nock');

const TEST_API_KEY = 'valid-api-key';
const appTester = zapier.createAppTester(App);

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
        duration: 15,
      },
    };

    nock('https://example.com')
      .get('/test.jpg')
      .reply(200, Buffer.from('fake-image-data'));

    nock('https://api.screenlyapp.com')
      .post('/api/v4/assets/', {
        title: 'Test Asset',
        source_url: 'https://example.com/test.jpg',
        disable_verification: false
      })
      .reply(201, [{
        id: 'asset-123',
        title: 'Test Asset',
      }]);

    nock('https://api.screenlyapp.com')
      .get('/api/v4/assets?id=eq.asset-123')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, [{
        id: 'asset-123',
        status: 'finished',
      }]);

    nock('https://api.screenlyapp.com')
      .post('/api/v4/playlist-items/', {
        asset_id: 'asset-123',
        playlist_id: 'playlist-123',
        duration: 15,
      })
      .reply(201, {
        id: 'item-123',
      });

    nock('https://api.screenlyapp.com')
      .post('/api/v4/labels/playlists', {
        playlist_id: 'playlist-123',
        label_id: 'screen-123'
      })
      .reply(409); // Simulate already assigned

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
        duration: 15,
      },
    };

    nock('https://example.com')
      .get('/test.jpg')
      .reply(200, Buffer.from('fake-image-data'));

    nock('https://api.screenlyapp.com')
      .post('/api/v4/assets/')
      .reply(201, [{
        id: 'asset-123',
        title: 'Test Asset',
      }]);

    nock('https://api.screenlyapp.com')
      .post('/api/v4/playlists', {
        title: 'New Playlist',
        predicate: new RegExp('TRUE AND \\(\\$DATE >= \\d+\\)')
      })
      .reply(201, [{
        id: 'playlist-123',
        name: 'New Playlist',
      }]);

    nock('https://api.screenlyapp.com')
      .get('/api/v4/labels?name=eq.created_by_zapier')
      .reply(200, []);

    nock('https://api.screenlyapp.com')
      .post('/api/v4/labels/', {
        name: 'created_by_zapier'
      })
      .reply(201, {
        id: 'label-123'
      });

    nock('https://api.screenlyapp.com')
      .post('/api/v4/labels/playlists', {
        playlist_id: 'playlist-123',
        label_id: 'label-123'
      })
      .reply(201);

    nock('https://api.screenlyapp.com')
      .get('/api/v4/assets?id=eq.asset-123')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, [{
        id: 'asset-123',
        status: 'finished',
      }]);

    nock('https://api.screenlyapp.com')
      .post('/api/v4/playlist-items/', {
        asset_id: 'asset-123',
        playlist_id: 'playlist-123',
        duration: 15,
      })
      .reply(201, {
        id: 'item-123',
      });

    nock('https://api.screenlyapp.com')
      .post('/api/v4/labels/playlists', {
        playlist_id: 'playlist-123',
        label_id: 'screen-123'
      })
      .reply(201);

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
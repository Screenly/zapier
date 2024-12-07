const zapier = require('zapier-platform-core');
const App = require('../index');
const nock = require('nock');

// Create a new version of the app for testing
const appTester = zapier.createAppTester(App);

// Mock the environment variables
process.env.BASE_URL = 'https://api.screenlyapp.com';

// This is an example test key
const TEST_API_KEY = 'valid-api-key';

// Required to get tests to pass
zapier.tools.env.inject();

describe('Authentication', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  test('succeeds with valid API key', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY
      }
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
        api_key: 'invalid-api-key'
      }
    };

    nock('https://api.screenlyapp.com')
      .get('/api/v4/assets/')
      .matchHeader('Authorization', 'Token invalid-api-key')
      .reply(401, { detail: 'Invalid token' });

    await expect(appTester(App.authentication.test, bundle))
      .rejects.toThrow();
  });
});

describe('Upload Asset', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  test('successfully uploads an asset', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY
      },
      inputData: {
        file: 'https://example.com/image.jpg',
        title: 'Test Image',
        duration: 10
      }
    };

    // Mock the file download
    nock('https://example.com')
      .get('/image.jpg')
      .reply(200, 'fake-file-content');

    // Mock the asset upload
    nock('https://api.screenlyapp.com')
      .post('/api/v4/assets/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(201, {
        id: 'asset-123',
        title: 'Test Image',
        duration: 10
      });

    const response = await appTester(App.creates.upload_asset.operation.perform, bundle);
    expect(response.id).toBe('asset-123');
    expect(response.title).toBe('Test Image');
    expect(response.duration).toBe(10);
  });

  test('handles upload failure', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY
      },
      inputData: {
        file: 'https://example.com/image.jpg',
        title: 'Test Image',
        duration: 10
      }
    };

    nock('https://example.com')
      .get('/image.jpg')
      .reply(404);

    await expect(appTester(App.creates.upload_asset.operation.perform, bundle))
      .rejects.toThrow();
  });
});

describe('Schedule Playlist Item', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  test('successfully adds asset to playlist without conditions', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY
      },
      inputData: {
        playlist_id: 'playlist-123',
        asset_id: 'asset-123',
        duration: 15
      }
    };

    // Mock the asset duration update
    nock('https://api.screenlyapp.com')
      .patch('/api/v4/assets/asset-123/', {
        duration: 15
      })
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, {
        id: 'asset-123',
        duration: 15
      });

    // Mock the playlist item creation
    nock('https://api.screenlyapp.com')
      .post('/api/v4/playlist-items/', {
        asset: 'asset-123',
        playlist: 'playlist-123'
      })
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(201, {
        id: 'item-123',
        playlist: 'playlist-123',
        asset: 'asset-123'
      });

    const response = await appTester(App.creates.schedule_playlist_item.operation.perform, bundle);
    expect(response.id).toBe('item-123');
    expect(response.playlist).toBe('playlist-123');
    expect(response.asset).toBe('asset-123');
  });

  test('successfully adds asset with scheduling', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY
      },
      inputData: {
        playlist_id: 'playlist-123',
        asset_id: 'asset-123',
        duration: 20,
        start_date: '2023-12-01T00:00:00Z',
        end_date: '2023-12-31T23:59:59Z'
      }
    };

    // Mock the asset duration update
    nock('https://api.screenlyapp.com')
      .patch('/api/v4/assets/asset-123/', {
        duration: 20
      })
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, {
        id: 'asset-123',
        duration: 20
      });

    // Mock the playlist item creation
    nock('https://api.screenlyapp.com')
      .post('/api/v4/playlist-items/', {
        asset: 'asset-123',
        playlist: 'playlist-123',
        conditions: {
          start_date: '2023-12-01T00:00:00Z',
          end_date: '2023-12-31T23:59:59Z'
        }
      })
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(201, {
        id: 'item-123',
        playlist: 'playlist-123',
        asset: 'asset-123',
        conditions: {
          start_date: '2023-12-01T00:00:00Z',
          end_date: '2023-12-31T23:59:59Z'
        }
      });

    const response = await appTester(App.creates.schedule_playlist_item.operation.perform, bundle);
    expect(response.id).toBe('item-123');
    expect(response.conditions.start_date).toBe('2023-12-01T00:00:00Z');
    expect(response.conditions.end_date).toBe('2023-12-31T23:59:59Z');
  });

  test('handles duration update failure', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY
      },
      inputData: {
        playlist_id: 'playlist-123',
        asset_id: 'asset-123',
        duration: 30
      }
    };

    nock('https://api.screenlyapp.com')
      .patch('/api/v4/assets/asset-123/', {
        duration: 30
      })
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(400, { detail: 'Invalid duration' });

    await expect(appTester(App.creates.schedule_playlist_item.operation.perform, bundle))
      .rejects.toThrow('Failed to update asset duration: {"detail":"Invalid duration"}');
  });

  test('handles playlist addition failure', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY
      },
      inputData: {
        playlist_id: 'playlist-123',
        asset_id: 'asset-123'
      }
    };

    nock('https://api.screenlyapp.com')
      .post('/api/v4/playlist-items/', {
        asset: 'asset-123',
        playlist: 'playlist-123'
      })
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(404, { detail: 'Playlist not found' });

    await expect(appTester(App.creates.schedule_playlist_item.operation.perform, bundle))
      .rejects.toThrow('Failed to add asset to playlist: {"detail":"Playlist not found"}');
  });
});

describe('Dynamic Dropdowns', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  test('fetches playlists for dropdown', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY
      }
    };

    nock('https://api.screenlyapp.com')
      .get('/api/v4/playlists/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, [
        { id: 'playlist-1', name: 'Playlist 1' },
        { id: 'playlist-2', name: 'Playlist 2' }
      ]);

    const response = await appTester(App.triggers.get_playlists.operation.perform, bundle);
    expect(response).toHaveLength(2);
    expect(response[0].id).toBe('playlist-1');
    expect(response[1].name).toBe('Playlist 2');
  });

  test('fetches assets for dropdown', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY
      }
    };

    nock('https://api.screenlyapp.com')
      .get('/api/v4/assets/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, [
        { id: 'asset-1', title: 'Asset 1' },
        { id: 'asset-2', title: 'Asset 2' }
      ]);

    const response = await appTester(App.triggers.get_assets.operation.perform, bundle);
    expect(response).toHaveLength(2);
    expect(response[0].id).toBe('asset-1');
    expect(response[1].title).toBe('Asset 2');
  });
});

describe('Screen Assignment', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  test('successfully assigns screen to playlist', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY
      },
      inputData: {
        screen_id: 'screen-123',
        playlist_id: 'playlist-123'
      }
    };

    nock('https://api.screenlyapp.com')
      .patch('/api/v4/screens/screen-123/', {
        playlist: 'playlist-123'
      })
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, {
        id: 'screen-123',
        name: 'Test Screen',
        playlist: 'playlist-123',
        last_ping: '2023-12-07T08:00:00Z',
        status: 'online'
      });

    const response = await appTester(App.creates.assign_screen_to_playlist.operation.perform, bundle);
    expect(response.id).toBe('screen-123');
    expect(response.playlist).toBe('playlist-123');
    expect(response.status).toBe('online');
  });

  test('handles screen assignment failure', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY
      },
      inputData: {
        screen_id: 'screen-123',
        playlist_id: 'playlist-123'
      }
    };

    nock('https://api.screenlyapp.com')
      .patch('/api/v4/screens/screen-123/', {
        playlist: 'playlist-123'
      })
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(404, { detail: 'Screen not found' });

    await expect(appTester(App.creates.assign_screen_to_playlist.operation.perform, bundle))
      .rejects.toThrow('Failed to assign screen to playlist: {"detail":"Screen not found"}');
  });

  test('handles invalid playlist assignment', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY
      },
      inputData: {
        screen_id: 'screen-123',
        playlist_id: 'invalid-playlist'
      }
    };

    nock('https://api.screenlyapp.com')
      .patch('/api/v4/screens/screen-123/', {
        playlist: 'invalid-playlist'
      })
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(400, { detail: 'Invalid playlist ID' });

    await expect(appTester(App.creates.assign_screen_to_playlist.operation.perform, bundle))
      .rejects.toThrow('Failed to assign screen to playlist: {"detail":"Invalid playlist ID"}');
  });
});

describe('Get Screens', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  test('successfully fetches screens list', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY
      }
    };

    nock('https://api.screenlyapp.com')
      .get('/api/v4/screens/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, [
        {
          id: 'screen-1',
          name: 'Screen 1',
          status: 'online',
          playlist: 'playlist-1'
        },
        {
          id: 'screen-2',
          name: 'Screen 2',
          status: 'offline',
          playlist: null
        }
      ]);

    const response = await appTester(App.triggers.get_screens.operation.perform, bundle);
    expect(response).toHaveLength(2);
    expect(response[0].id).toBe('screen-1');
    expect(response[0].status).toBe('online');
    expect(response[1].name).toBe('Screen 2');
    expect(response[1].status).toBe('offline');
  });

  test('handles empty screens list', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY
      }
    };

    nock('https://api.screenlyapp.com')
      .get('/api/v4/screens/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, []);

    const response = await appTester(App.triggers.get_screens.operation.perform, bundle);
    expect(response).toHaveLength(0);
  });

  test('handles screens fetch failure', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY
      }
    };

    nock('https://api.screenlyapp.com')
      .get('/api/v4/screens/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(500, { detail: 'Internal server error' });

    await expect(appTester(App.triggers.get_screens.operation.perform, bundle))
      .rejects.toThrow('Failed to fetch screens: {"detail":"Internal server error"}');
  });
});

describe('Complete Workflow', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  test('successfully sets up complete workflow with existing playlist', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY
      },
      inputData: {
        file: 'https://example.com/image.jpg',
        title: 'Test Image',
        duration: 15,
        playlist_id: 'playlist-123',
        screen_id: 'screen-123',
        start_date: '2023-12-01T00:00:00Z',
        end_date: '2023-12-31T23:59:59Z'
      }
    };

    // Mock file download
    nock('https://example.com')
      .get('/image.jpg')
      .reply(200, 'fake-file-content');

    // Mock asset upload
    nock('https://api.screenlyapp.com')
      .post('/api/v4/assets/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(201, {
        id: 'asset-123',
        title: 'Test Image',
        duration: 15
      });

    // Mock playlist item creation
    nock('https://api.screenlyapp.com')
      .post('/api/v4/playlist-items/', {
        asset: 'asset-123',
        playlist: 'playlist-123',
        conditions: {
          start_date: '2023-12-01T00:00:00Z',
          end_date: '2023-12-31T23:59:59Z'
        }
      })
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(201, {
        id: 'item-123',
        playlist: 'playlist-123',
        asset: 'asset-123'
      });

    // Mock screen update
    nock('https://api.screenlyapp.com')
      .patch('/api/v4/screens/screen-123/', {
        playlist: 'playlist-123'
      })
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, {
        id: 'screen-123',
        name: 'Test Screen',
        playlist: 'playlist-123'
      });

    const response = await appTester(App.creates.complete_workflow.operation.perform, bundle);
    expect(response.asset.id).toBe('asset-123');
    expect(response.playlist_id).toBe('playlist-123');
    expect(response.screen.id).toBe('screen-123');
    expect(response.message).toBe('Successfully set up digital signage workflow');
  });

  test('successfully creates new playlist during workflow', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY
      },
      inputData: {
        file: 'https://example.com/image.jpg',
        title: 'Test Image',
        duration: 15,
        new_playlist_name: 'New Test Playlist',
        screen_id: 'screen-123'
      }
    };

    // Mock file download
    nock('https://example.com')
      .get('/image.jpg')
      .reply(200, 'fake-file-content');

    // Mock asset upload with tags
    nock('https://api.screenlyapp.com')
      .post('/api/v4/assets/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(201, {
        id: 'asset-123',
        title: 'Test Image',
        duration: 15,
        tags: ['created_by_zapier']
      });

    // Mock playlist creation with tags
    nock('https://api.screenlyapp.com')
      .post('/api/v4/playlists/', {
        name: 'New Test Playlist',
        tags: ['created_by_zapier']
      })
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(201, {
        id: 'playlist-123',
        name: 'New Test Playlist',
        tags: ['created_by_zapier']
      });

    // Mock playlist item creation
    nock('https://api.screenlyapp.com')
      .post('/api/v4/playlist-items/', {
        asset: 'asset-123',
        playlist: 'playlist-123'
      })
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(201, {
        id: 'item-123',
        playlist: 'playlist-123',
        asset: 'asset-123'
      });

    // Mock screen update
    nock('https://api.screenlyapp.com')
      .patch('/api/v4/screens/screen-123/', {
        playlist: 'playlist-123'
      })
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, {
        id: 'screen-123',
        name: 'Test Screen',
        playlist: 'playlist-123'
      });

    const response = await appTester(App.creates.complete_workflow.operation.perform, bundle);
    expect(response.asset.id).toBe('asset-123');
    expect(response.playlist_id).toBe('playlist-123');
    expect(response.screen.id).toBe('screen-123');
  });

  test('handles missing playlist information', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY
      },
      inputData: {
        file: 'https://example.com/image.jpg',
        title: 'Test Image',
        duration: 15,
        screen_id: 'screen-123'
      }
    };

    // Mock file download
    nock('https://example.com')
      .get('/image.jpg')
      .reply(200, 'fake-file-content');

    // Mock asset upload
    nock('https://api.screenlyapp.com')
      .post('/api/v4/assets/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(201, {
        id: 'asset-123',
        title: 'Test Image',
        duration: 15
      });

    await expect(appTester(App.creates.complete_workflow.operation.perform, bundle))
      .rejects.toThrow('Either select an existing playlist or provide a name for a new one');
  }, 2000);

  test('handles asset upload failure', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY
      },
      inputData: {
        file: 'https://example.com/image.jpg',
        title: 'Test Image',
        duration: 15,
        playlist_id: 'playlist-123',
        screen_id: 'screen-123'
      }
    };

    // Mock file download
    nock('https://example.com')
      .get('/image.jpg')
      .reply(200, 'fake-file-content');

    // Mock failed asset upload
    nock('https://api.screenlyapp.com')
      .post('/api/v4/assets/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(400, { detail: 'Invalid file format' });

    await expect(appTester(App.creates.complete_workflow.operation.perform, bundle))
      .rejects.toThrow('Failed to upload asset: {"detail":"Invalid file format"}');
  });

  test('handles playlist creation failure', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY
      },
      inputData: {
        file: 'https://example.com/image.jpg',
        title: 'Test Image',
        duration: 15,
        new_playlist_name: 'New Test Playlist',
        screen_id: 'screen-123'
      }
    };

    // Mock file download
    nock('https://example.com')
      .get('/image.jpg')
      .reply(200, 'fake-file-content');

    // Mock asset upload
    nock('https://api.screenlyapp.com')
      .post('/api/v4/assets/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(201, {
        id: 'asset-123',
        title: 'Test Image',
        duration: 15
      });

    // Mock playlist creation failure
    nock('https://api.screenlyapp.com')
      .post('/api/v4/playlists/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(400, { detail: 'Invalid playlist name' });

    await expect(appTester(App.creates.complete_workflow.operation.perform, bundle))
      .rejects.toThrow('Failed to create playlist: {"detail":"Invalid playlist name"}');
  });

  test('handles screen update failure', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY
      },
      inputData: {
        file: 'https://example.com/image.jpg',
        title: 'Test Image',
        duration: 15,
        playlist_id: 'playlist-123',
        screen_id: 'screen-123'
      }
    };

    // Mock file download
    nock('https://example.com')
      .get('/image.jpg')
      .reply(200, 'fake-file-content');

    // Mock asset upload
    nock('https://api.screenlyapp.com')
      .post('/api/v4/assets/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(201, {
        id: 'asset-123',
        title: 'Test Image',
        duration: 15
      });

    // Mock playlist item creation
    nock('https://api.screenlyapp.com')
      .post('/api/v4/playlist-items/', {
        asset: 'asset-123',
        playlist: 'playlist-123'
      })
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(201, {
        id: 'item-123',
        playlist: 'playlist-123',
        asset: 'asset-123'
      });

    // Mock screen update failure
    nock('https://api.screenlyapp.com')
      .patch('/api/v4/screens/screen-123/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(404, { detail: 'Screen not found' });

    await expect(appTester(App.creates.complete_workflow.operation.perform, bundle))
      .rejects.toThrow('Failed to assign playlist to screen: {"detail":"Screen not found"}');
  });

  test('handles file download failure', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY
      },
      inputData: {
        file: 'https://example.com/nonexistent.jpg',
        title: 'Test Image',
        playlist_id: 'playlist-123',
        screen_id: 'screen-123'
      }
    };

    // Mock file download failure
    nock('https://example.com')
      .get('/nonexistent.jpg')
      .reply(404);

    await expect(appTester(App.creates.complete_workflow.operation.perform, bundle))
      .rejects.toThrow('Failed to fetch file: 404');
  });
});

describe('Cleanup', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  test('successfully cleans up Zapier content', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY
      },
      inputData: {
        confirm: true
      }
    };

    // Mock assets list with some Zapier-created assets
    nock('https://api.screenlyapp.com')
      .get('/api/v4/assets/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, [
        { id: 'asset-1', title: 'Asset 1', tags: ['created_by_zapier'] },
        { id: 'asset-2', title: 'Asset 2', tags: [] },
        { id: 'asset-3', title: 'Asset 3', tags: ['created_by_zapier'] }
      ]);

    // Mock playlists list with some Zapier-created playlists
    nock('https://api.screenlyapp.com')
      .get('/api/v4/playlists/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(200, [
        { id: 'playlist-1', name: 'Playlist 1', tags: ['created_by_zapier'] },
        { id: 'playlist-2', name: 'Playlist 2', tags: [] }
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
      authData: {
        api_key: TEST_API_KEY
      },
      inputData: {
        confirm: false
      }
    };

    await expect(appTester(App.creates.cleanup_zapier_content.operation.perform, bundle))
      .rejects.toThrow('Please confirm the cleanup operation');
  });

  test('handles empty lists', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY
      },
      inputData: {
        confirm: true
      }
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

  test('handles API errors', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY
      },
      inputData: {
        confirm: true
      }
    };

    // Mock failed assets fetch
    nock('https://api.screenlyapp.com')
      .get('/api/v4/assets/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(500, { detail: 'Internal server error' });

    await expect(appTester(App.creates.cleanup_zapier_content.operation.perform, bundle))
      .rejects.toThrow('Failed to fetch assets');
  });
});
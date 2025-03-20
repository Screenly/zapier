import zapier from 'zapier-platform-core';
import App from '../src/index.js';
import nock from 'nock';
import { describe, beforeEach, test, expect } from 'vitest';

const TEST_API_KEY = 'valid-api-key';
const appTester = zapier.createAppTester(App);

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

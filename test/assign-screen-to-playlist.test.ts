import zapier from 'zapier-platform-core';
import App from '../src/index.js';
import nock from 'nock';
import { describe, beforeEach, test, expect } from 'vitest';

const TEST_API_KEY = 'valid-api-key';
const appTester = zapier.createAppTester(App);

interface AssignmentResponse {
  screen_id: string;
  playlist_id: string;
  message: string;
}

describe('Assign Screen to Playlist', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  test('successfully assigns a playlist to a screen', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY,
      },
      inputData: {
        screen_id: 'screen-123',
        playlist_id: 'playlist-123',
      },
    };

    nock('https://api.screenlyapp.com')
      .post('/api/v4/labels/playlists', {
        playlist_id: 'playlist-123',
        label_id: 'screen-123',
      })
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(201, [{ playlist_id: 'playlist-123', label_id: 'screen-123' }]);

    const response = (await appTester(
      App.creates.assign_screen_to_playlist.operation.perform,
      bundle
    )) as AssignmentResponse;

    expect(response.screen_id).toBe('screen-123');
    expect(response.playlist_id).toBe('playlist-123');
    expect(response.message).toBe('Successfully assigned playlist to screen');
  });

  test('succeeds when the playlist is already assigned', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY,
      },
      inputData: {
        screen_id: 'screen-123',
        playlist_id: 'playlist-123',
      },
    };

    nock('https://api.screenlyapp.com')
      .post('/api/v4/labels/playlists')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(409, { detail: 'Already assigned' });

    const response = (await appTester(
      App.creates.assign_screen_to_playlist.operation.perform,
      bundle
    )) as AssignmentResponse;

    expect(response.message).toBe('Successfully assigned playlist to screen');
  });

  test('handles assignment failure', async () => {
    const bundle = {
      authData: {
        api_key: TEST_API_KEY,
      },
      inputData: {
        screen_id: 'screen-123',
        playlist_id: 'playlist-123',
      },
    };

    nock('https://api.screenlyapp.com')
      .post('/api/v4/labels/playlists')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(404, { detail: 'Screen not found' });

    await expect(
      appTester(App.creates.assign_screen_to_playlist.operation.perform, bundle)
    ).rejects.toThrow('Failed to assign playlist to screen');
  });
});

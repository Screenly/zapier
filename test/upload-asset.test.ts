import zapier from 'zapier-platform-core';
import App from '../src/index.js';
import nock from 'nock';
import { describe, beforeEach, test, expect } from 'vitest';

const TEST_API_KEY = 'valid-api-key';
const appTester = zapier.createAppTester(App);

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

    nock('https://example.com')
      .get('/image.jpg')
      .reply(200, 'fake-file-content');

    nock('https://api.screenlyapp.com')
      .post('/api/v4/assets/')
      .matchHeader('Authorization', `Token ${TEST_API_KEY}`)
      .reply(201, [
        {
          id: 'asset-123',
          title: 'Test Image',
          duration: null,
        },
      ]);

    const response = await appTester(
      App.creates.upload_asset.operation.perform,
      bundle
    );
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

    await expect(
      appTester(App.creates.upload_asset.operation.perform, bundle)
    ).rejects.toThrow();
  });
});

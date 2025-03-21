import zapier from 'zapier-platform-core';
import App from '../src/index.js';
import nock from 'nock';
import { describe, beforeEach, expect, test } from 'vitest';

const TEST_API_KEY = 'valid-api-key';
const appTester = zapier.createAppTester(App);

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

    const response = await appTester(App.authentication.test as any, bundle);
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

    await expect(appTester(App.authentication.test as any, bundle)).rejects.toThrow();
  });
});

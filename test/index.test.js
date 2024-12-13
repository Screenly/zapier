const nock = require('nock');
const { authentication, fileUtils } = require('../index');
const utils = require('../utils');

// Mock API key for testing
const TEST_API_KEY = 'test-key-123';
const TEST_GOOGLE_TOKEN = 'google-token-123';
const TEST_BOX_TOKEN = 'box-token-123';
const TEST_DROPBOX_TOKEN = 'dropbox-token-123';

// Debug logging
const debugLog = (...args) => console.log('[TEST]', ...args);

describe('Screenly Integration Tests', () => {
  beforeAll(() => {
    // Enable nock debug logging
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });

  afterAll(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  beforeEach(() => {
    nock.cleanAll();
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    test('successfully authenticates with valid API key', async () => {
      const z = {
        request: jest.fn().mockResolvedValue({
          status: 200,
          json: { assets: [] },
          headers: new Map([['content-type', 'application/json']])
        }),
        console: { log: debugLog }
      };

      const bundle = {
        authData: { api_key: TEST_API_KEY }
      };

      nock('https://api.screenlyapp.com')
        .get('/api/v4/assets/')
        .query({ limit: 1 })
        .reply(200, { assets: [] });

      const result = await authentication.test(z, bundle);
      expect(result).toBeDefined();
      expect(result.assets).toEqual([]);
    });

    test('handles authentication failure', async () => {
      const z = {
        request: jest.fn().mockImplementation(() => {
          const error = new Error('Authentication failed: Invalid API key');
          error.status = 401;
          error.json = { error: 'Invalid API key' };
          throw error;
        }),
        console: { log: debugLog }
      };

      const bundle = {
        authData: { api_key: 'invalid-key' }
      };

      nock('https://api.screenlyapp.com')
        .get('/api/v4/assets/')
        .query({ limit: 1 })
        .reply(401, { error: 'Invalid API key' });

      await expect(authentication.test(z, bundle))
        .rejects
        .toThrow('Authentication failed: Invalid API key');
    });

    test('handles network errors during authentication', async () => {
      const z = {
        request: jest.fn().mockRejectedValue({
          code: 'ECONNREFUSED',
          message: 'Connection refused'
        }),
        console: { log: debugLog }
      };

      const bundle = {
        authData: { api_key: TEST_API_KEY }
      };

      nock('https://api.screenlyapp.com')
        .get('/api/v4/assets/')
        .replyWithError({ code: 'ECONNREFUSED' });

      await expect(authentication.test(z, bundle))
        .rejects
        .toThrow('Network error: Unable to connect to the server');
    });
  });

  describe('File Handling', () => {
    test('validates Google Drive file URL and gets download URL', async () => {
      const z = {
        request: jest.fn().mockResolvedValue({
          status: 200,
          json: {
            name: 'test.jpg',
            mimeType: 'image/jpeg',
            webContentLink: 'https://drive.google.com/uc?id=123abc'
          },
          headers: new Map([['content-type', 'application/json']])
        }),
        console: { log: debugLog }
      };

      const bundle = {
        inputData: {
          file: 'https://drive.google.com/file/d/123abc/view'
        },
        authData: {
          api_key: TEST_API_KEY,
          google_access_token: TEST_GOOGLE_TOKEN
        }
      };

      nock('https://www.googleapis.com')
        .get('/drive/v3/files/123abc')
        .query({ fields: 'name,mimeType,webContentLink' })
        .reply(200, {
          name: 'test.jpg',
          mimeType: 'image/jpeg',
          webContentLink: 'https://drive.google.com/uc?id=123abc'
        });

      const result = await fileUtils.getDownloadUrl(z, bundle);
      expect(result.type).toBe('image/jpeg');
      expect(result.url).toBeDefined();
    });

    test('validates Box file URL and gets download URL', async () => {
      const z = {
        request: jest.fn().mockImplementation(async (options) => {
          if (options.url.includes('/content')) {
            return {
              status: 302,
              headers: new Map([['location', 'https://dl.box.com/123456.pdf']])
            };
          }
          return {
            status: 200,
            json: {
              name: 'test.pdf',
              type: 'application/pdf'
            },
            headers: new Map([['content-type', 'application/json']])
          };
        }),
        console: { log: debugLog }
      };

      const bundle = {
        inputData: {
          file: 'https://app.box.com/s/123456'
        },
        authData: {
          api_key: TEST_API_KEY,
          box_access_token: TEST_BOX_TOKEN
        }
      };

      nock('https://api.box.com')
        .get('/2.0/files/123456')
        .reply(200, {
          name: 'test.pdf',
          type: 'application/pdf'
        });

      nock('https://api.box.com')
        .get('/2.0/files/123456/content')
        .reply(302, '', {
          location: 'https://dl.box.com/123456.pdf'
        });

      const result = await fileUtils.getDownloadUrl(z, bundle);
      expect(result.type).toBe('application/pdf');
      expect(result.url).toBeDefined();
    });

    test('validates Dropbox file URL and gets download URL', async () => {
      const z = {
        request: jest.fn().mockImplementation(async (options) => {
          if (options.url.includes('get_shared_link_file')) {
            return {
              status: 200,
              headers: new Map([['location', 'https://dl.dropboxusercontent.com/abc123/file.mp4']])
            };
          }
          return {
            status: 200,
            json: {
              name: 'test.mp4',
              link_metadata: {
                mime_type: 'video/mp4'
              }
            },
            headers: new Map([['content-type', 'application/json']])
          };
        }),
        console: { log: debugLog }
      };

      const bundle = {
        inputData: {
          file: 'https://www.dropbox.com/s/abc123/file.mp4'
        },
        authData: {
          api_key: TEST_API_KEY,
          dropbox_access_token: TEST_DROPBOX_TOKEN
        }
      };

      nock('https://api.dropboxapi.com')
        .post('/2/sharing/get_shared_link_metadata')
        .reply(200, {
          name: 'test.mp4',
          link_metadata: {
            mime_type: 'video/mp4'
          }
        });

      nock('https://api.dropboxapi.com')
        .post('/2/sharing/get_shared_link_file')
        .reply(200, '', {
          location: 'https://dl.dropboxusercontent.com/abc123/file.mp4'
        });

      const result = await fileUtils.getDownloadUrl(z, bundle);
      expect(result.type).toBe('video/mp4');
      expect(result.url).toBeDefined();
    });

    test('rejects unsupported file types', async () => {
      const z = {
        request: jest.fn().mockResolvedValue({
          status: 200,
          json: {
            name: 'test.doc',
            mimeType: 'application/msword',
            webContentLink: 'https://drive.google.com/uc?id=123abc'
          },
          headers: new Map([['content-type', 'application/json']])
        }),
        console: { log: debugLog }
      };

      const bundle = {
        inputData: {
          file: 'https://drive.google.com/file/d/123abc/view'
        },
        authData: {
          api_key: TEST_API_KEY,
          google_access_token: TEST_GOOGLE_TOKEN
        }
      };

      nock('https://www.googleapis.com')
        .get('/drive/v3/files/123abc')
        .query({ fields: 'name,mimeType,webContentLink' })
        .reply(200, {
          name: 'test.doc',
          mimeType: 'application/msword',
          webContentLink: 'https://drive.google.com/uc?id=123abc'
        });

      await expect(fileUtils.getDownloadUrl(z, bundle))
        .rejects
        .toThrow('Invalid file type: application/msword');
    });

    test('handles missing access tokens', async () => {
      const testCases = [
        {
          file: 'https://drive.google.com/file/d/123abc/view',
          error: 'Google Drive access token is required for Google Drive files'
        },
        {
          file: 'https://app.box.com/s/123456',
          error: 'Box access token is required for Box files'
        },
        {
          file: 'https://www.dropbox.com/s/abc123/file.mp4',
          error: 'Dropbox access token is required for Dropbox files'
        }
      ];

      for (const testCase of testCases) {
        const bundle = {
          inputData: { file: testCase.file },
          authData: { api_key: TEST_API_KEY }
        };

        const z = { console: { log: debugLog } };

        await expect(fileUtils.getDownloadUrl(z, bundle))
          .rejects
          .toThrow(testCase.error);
      }
    });

    test('handles invalid file URLs', async () => {
      const testCases = [
        {
          file: 'https://drive.google.com/invalid',
          error: 'Invalid Google Drive URL format'
        },
        {
          file: 'https://app.box.com/invalid',
          error: 'Invalid Box URL format'
        },
        {
          file: 'https://www.dropbox.com/invalid',
          error: 'Invalid Dropbox URL format'
        }
      ];

      for (const testCase of testCases) {
        const bundle = {
          inputData: { file: testCase.file },
          authData: {
            api_key: TEST_API_KEY,
            google_access_token: TEST_GOOGLE_TOKEN,
            box_access_token: TEST_BOX_TOKEN,
            dropbox_access_token: TEST_DROPBOX_TOKEN
          }
        };

        const z = { console: { log: debugLog } };

        await expect(fileUtils.getDownloadUrl(z, bundle))
          .rejects
          .toThrow(testCase.error);
      }
    });

    test('handles direct URLs', async () => {
      const bundle = {
        inputData: {
          file: 'https://example.com/image.jpg'
        },
        authData: { api_key: TEST_API_KEY }
      };

      const z = { console: { log: debugLog } };

      const result = await fileUtils.getDownloadUrl(z, bundle);
      expect(result.type).toBe('application/octet-stream');
      expect(result.url).toBe('https://example.com/image.jpg');
    });
  });

  describe('Error Handling', () => {
    test('handles rate limiting with retry', async () => {
      const z = {
        request: jest.fn()
          .mockRejectedValueOnce({
            status: 429,
            json: { error: 'Rate limit exceeded' },
            headers: new Map([['retry-after', '1']])
          })
          .mockResolvedValueOnce({
            status: 200,
            json: { assets: [] },
            headers: new Map([['content-type', 'application/json']])
          }),
        console: { log: debugLog }
      };

      nock('https://api.screenlyapp.com')
        .get('/api/v4/assets/')
        .reply(429, { error: 'Rate limit exceeded' }, { 'retry-after': '1' })
        .get('/api/v4/assets/')
        .reply(200, { assets: [] });

      const response = await utils.makeRequest(z, 'https://api.screenlyapp.com/api/v4/assets/');
      expect(response.status).toBe(200);
      expect(response.json.assets).toEqual([]);
    });

    test('handles network errors with retry', async () => {
      const z = {
        request: jest.fn()
          .mockRejectedValueOnce({
            code: 'ECONNREFUSED',
            message: 'Connection refused'
          })
          .mockResolvedValueOnce({
            status: 200,
            json: { assets: [] },
            headers: new Map([['content-type', 'application/json']])
          }),
        console: { log: debugLog }
      };

      nock('https://api.screenlyapp.com')
        .get('/api/v4/assets/')
        .replyWithError({ code: 'ECONNREFUSED' })
        .get('/api/v4/assets/')
        .reply(200, { assets: [] });

      const response = await utils.makeRequest(z, 'https://api.screenlyapp.com/api/v4/assets/');
      expect(response.status).toBe(200);
      expect(response.json.assets).toEqual([]);
    });

    test('handles maximum retries exceeded', async () => {
      const z = {
        request: jest.fn().mockRejectedValue({
          code: 'ECONNREFUSED',
          message: 'Connection refused'
        }),
        console: { log: debugLog }
      };

      nock('https://api.screenlyapp.com')
        .get('/api/v4/assets/')
        .replyWithError({ code: 'ECONNREFUSED' })
        .persist();

      await expect(utils.makeRequest(z, 'https://api.screenlyapp.com/api/v4/assets/'))
        .rejects
        .toThrow('Network error: Unable to connect to the server');
    });

    test('handles various HTTP errors', async () => {
      const testCases = [
        {
          status: 400,
          error: { error: 'Bad request' },
          expected: 'Bad request: Bad request'
        },
        {
          status: 401,
          error: { error: 'Unauthorized' },
          expected: 'Authentication failed: Unauthorized'
        },
        {
          status: 403,
          error: { error: 'Forbidden' },
          expected: 'Permission denied: Forbidden'
        },
        {
          status: 404,
          error: { error: 'Not found' },
          expected: 'Resource not found: Not found'
        },
        {
          status: 500,
          error: { error: 'Server error' },
          expected: 'Server error: Server error'
        }
      ];

      for (const testCase of testCases) {
        const z = {
          request: jest.fn().mockRejectedValue({
            status: testCase.status,
            json: testCase.error
          }),
          console: { log: debugLog }
        };

        nock('https://api.screenlyapp.com')
          .get('/api/v4/assets/')
          .reply(testCase.status, testCase.error);

        await expect(utils.makeRequest(z, 'https://api.screenlyapp.com/api/v4/assets/'))
          .rejects
          .toThrow(testCase.expected);
      }
    });

    test('handles empty responses', async () => {
      const z = {
        request: jest.fn().mockResolvedValue(null),
        console: { log: debugLog }
      };

      nock('https://api.screenlyapp.com')
        .get('/api/v4/assets/')
        .reply(200);

      await expect(utils.makeRequest(z, 'https://api.screenlyapp.com/api/v4/assets/'))
        .rejects
        .toThrow('Empty response received');
    });

    test('handles missing response properties', async () => {
      const z = {
        request: jest.fn().mockResolvedValue({
          status: 200
        }),
        console: { log: debugLog }
      };

      nock('https://api.screenlyapp.com')
        .get('/api/v4/assets/')
        .reply(200);

      await expect(utils.makeRequest(z, 'https://api.screenlyapp.com/api/v4/assets/'))
        .rejects
        .toThrow('Empty response received');
    });
  });
});

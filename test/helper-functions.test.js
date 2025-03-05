const utils = require('../utils');

const TEST_API_KEY = 'valid-api-key';

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

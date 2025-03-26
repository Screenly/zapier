import utils from '../src/utils.js';
import { describe, test, expect } from 'vitest';

describe('Helper Functions', () => {
  test('handleError returns json on success', async () => {
    const response = {
      status: 200,
      data: { data: 'test' },
    };

    const result = utils.handleError(response, 'Error message');
    expect(result).toEqual({ data: 'test' });
  });
});

// Utility functions for Screenly Zapier integration

const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // Base delay of 1 second
const ALLOWED_MIME_TYPES = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  videos: ['video/mp4', 'video/webm', 'video/ogg'],
  documents: ['application/pdf']
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const validateFileType = (mimeType) => {
  if (!mimeType) {
    throw new Error('Missing file type');
  }

  const allAllowedTypes = [
    ...ALLOWED_MIME_TYPES.images,
    ...ALLOWED_MIME_TYPES.videos,
    ...ALLOWED_MIME_TYPES.documents
  ];

  if (!allAllowedTypes.includes(mimeType)) {
    throw new Error(`Invalid file type: ${mimeType}. Allowed types: ${allAllowedTypes.join(', ')}`);
  }
};

const validateDateRange = (startDate, endDate) => {
  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start >= end) {
      throw new Error('End date must be after start date');
    }
  }
};

const validateDuration = (duration) => {
  const durationNum = parseInt(duration, 10);
  if (isNaN(durationNum) || durationNum <= 0) {
    throw new Error('Duration must be a positive number');
  }
  return durationNum;
};

const calculateRetryDelay = (attempt, retryAfter = null) => {
  if (retryAfter) {
    return parseInt(retryAfter, 10) * 1000;
  }
  return Math.min(RETRY_DELAY_BASE * Math.pow(2, attempt - 1), 10000);
};

const handleError = (error, operation = 'perform operation') => {
  if (!error.status && !error.json) {
    if (error.name === 'TimeoutError' || error.code === 'ECONNREFUSED') {
      throw new Error('Network error: Unable to connect to the server');
    }
    throw error;
  }

  const errorMessage = error.json?.error || error.json?.detail || error.message || 'Unknown error';
  const statusCode = error.status || 500;

  switch (statusCode) {
    case 400:
      throw new Error(`Bad request: ${errorMessage}`);
    case 401:
      throw new Error(`Authentication failed: ${errorMessage}`);
    case 403:
      throw new Error(`Permission denied: ${errorMessage}`);
    case 404:
      throw new Error(`Resource not found: ${errorMessage}`);
    case 413:
      throw new Error(`File too large: ${errorMessage}`);
    case 415:
      throw new Error(`Unsupported media type: ${errorMessage}`);
    case 429:
      throw new Error(`Rate limit exceeded: ${errorMessage}`);
    case 500:
      throw new Error(`Server error: ${errorMessage}`);
    case 502:
      throw new Error(`Bad gateway: ${errorMessage}`);
    case 503:
      throw new Error(`Service unavailable: ${errorMessage}`);
    case 504:
      throw new Error(`Gateway timeout: ${errorMessage}`);
    default:
      throw new Error(`Failed to ${operation}: ${errorMessage} (HTTP ${statusCode})`);
  }
};

const makeRequest = async (z, url, options = {}) => {
  let lastError = null;
  const maxRetries = options.maxRetries || MAX_RETRIES;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      z.console.log(`[Attempt ${attempt}/${maxRetries}] Making request to ${url}`);
      z.console.log('Request options:', JSON.stringify(options, null, 2));

      const response = await z.request({
        url,
        method: options.method || 'GET',
        headers: options.headers,
        params: options.params,
        body: options.body,
        timeout: options.timeout || 30000,
        followRedirect: options.followRedirect
      });

      if (!response) {
        throw new Error('Empty response received');
      }

      z.console.log('Response status:', response.status);
      z.console.log('Response headers:', response.headers);

      // Only log response body for non-binary responses
      const contentType = response.headers?.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        z.console.log('Response body:', response.json);
      }

      if (response.status === 429) {
        const retryAfter = response.headers?.get('retry-after');
        const delay = calculateRetryDelay(attempt, retryAfter);
        z.console.log(`Rate limited. Waiting ${delay}ms before retry`);

        if (attempt < maxRetries) {
          await sleep(delay);
          continue;
        }
      }

      // Validate response properties
      if (!response.headers || !response.status) {
        throw new Error('Empty response received');
      }

      if (response.status >= 400) {
        const error = new Error();
        error.status = response.status;
        error.json = response.json;
        throw error;
      }

      return response;
    } catch (error) {
      z.console.log('Request error:', error.message);
      z.console.log('Error details:', error);

      // Special handling for cloud storage services
      if (url.includes('api.box.com')) {
        handleBoxError(error);
      } else if (url.includes('www.googleapis.com')) {
        handleGoogleError(error);
      } else if (url.includes('api.dropboxapi.com')) {
        handleDropboxError(error);
      }

      if (error.name === 'TimeoutError' || error.code === 'ECONNREFUSED') {
        lastError = new Error('Network error: Unable to connect to the server');
        if (attempt < maxRetries) {
          const delay = calculateRetryDelay(attempt);
          z.console.log(`Network error. Waiting ${delay}ms before retry`);
          await sleep(delay);
          continue;
        }
      }

      if (error.status >= 400) {
        handleError(error);
      }

      if (attempt === maxRetries) {
        throw lastError || error;
      }

      lastError = error;
      const delay = calculateRetryDelay(attempt);
      await sleep(delay);
    }
  }

  throw lastError;
};

const handleGoogleError = (error) => {
  if (!error.status && !error.json) {
    if (error.name === 'TimeoutError' || error.code === 'ECONNREFUSED') {
      throw new Error('Network error: Unable to connect to Google Drive');
    }
    throw error;
  }

  const errorMessage = error.json?.error?.message || error.message || 'Unknown error';
  switch (error.status) {
    case 400:
      throw new Error(`Invalid request to Google Drive: ${errorMessage}`);
    case 401:
      throw new Error('Invalid Google Drive access token');
    case 403:
      throw new Error('Permission denied: Unable to access the Google Drive file');
    case 404:
      throw new Error('File not found in Google Drive');
    case 429:
      throw new Error('Google Drive rate limit exceeded');
    case 500:
      throw new Error(`Google Drive server error: ${errorMessage}`);
    default:
      throw new Error(`Google Drive error: ${errorMessage}`);
  }
};

const handleBoxError = (error) => {
  if (!error.status && !error.json) {
    if (error.name === 'TimeoutError' || error.code === 'ECONNREFUSED') {
      throw new Error('Network error: Unable to connect to Box');
    }
    throw error;
  }

  const errorMessage = error.json?.message || error.json?.error || 'Unknown error';
  switch (error.status) {
    case 400:
      throw new Error(`Invalid request to Box: ${errorMessage}`);
    case 401:
      throw new Error('Invalid Box access token');
    case 403:
      throw new Error('Permission denied: Unable to access the Box file');
    case 404:
      throw new Error('File not found in Box');
    case 429:
      throw new Error('Box rate limit exceeded');
    case 500:
      throw new Error(`Box server error: ${errorMessage}`);
    default:
      throw new Error(`Box error: ${errorMessage}`);
  }
};

const handleDropboxError = (error) => {
  if (!error.status && !error.json) {
    if (error.name === 'TimeoutError' || error.code === 'ECONNREFUSED') {
      throw new Error('Network error: Unable to connect to Dropbox');
    }
    throw error;
  }

  const errorMessage = error.json?.error_summary || error.message || 'Unknown error';
  switch (error.status) {
    case 400:
      throw new Error(`Invalid request to Dropbox: ${errorMessage}`);
    case 401:
      throw new Error('Invalid Dropbox access token');
    case 403:
      throw new Error('Permission denied: Unable to access the Dropbox file');
    case 404:
      throw new Error('File not found in Dropbox');
    case 429:
      throw new Error('Dropbox rate limit exceeded');
    case 500:
      throw new Error(`Dropbox server error: ${errorMessage}`);
    default:
      throw new Error(`Dropbox error: ${errorMessage}`);
  }
};

const validateAssetInput = (inputData) => {
  // Validate duration
  validateDuration(inputData.duration);

  // Validate dates if provided
  validateDateRange(inputData.start_date, inputData.end_date);

  // Validate title
  if (!inputData.title || !inputData.title.trim()) {
    throw new Error('Title is required');
  }

  // Validate file URL
  if (!inputData.file || !inputData.file.trim()) {
    throw new Error('File URL is required');
  }

  try {
    new URL(inputData.file);
  } catch (error) {
    throw new Error('Invalid file URL format');
  }
};

module.exports = {
  makeRequest,
  validateFileType,
  validateDateRange,
  validateDuration,
  validateAssetInput,
  handleError,
  handleGoogleError,
  handleBoxError,
  handleDropboxError,
  ALLOWED_MIME_TYPES
};

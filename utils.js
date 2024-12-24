// Utility functions for Screenly Zapier integration

const handleError = (response, customMessage) => {
  if (response.status >= 400) {
    throw new Error(customMessage);
  }

  if (response.json.length === 0) {
    throw new Error('No data returned from the Screenly API');
  }

  return response.json[0];
};

const makeRequest = async (z, url, options = {}) => {
  const response = await z.request({
    url,
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Token ${z.authData.api_key}`,
    },
  });

  return handleError(response, 'Screenly API Error');
};

module.exports = {
  handleError,
  makeRequest,
};

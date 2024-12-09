// Utility functions for Screenly Zapier integration

const handleError = (response, customMessage) => {
  if (response.status >= 400) {
    throw new Error(customMessage);
  }
  return response.json;
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

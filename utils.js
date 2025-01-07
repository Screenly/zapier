// Utility functions for Screenly Zapier integration

const { READY_STATES } = require('./constants');

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

const waitForAssetReady = async (z, assetId, authToken) => {
  let assetStatus;
  do {
    const statusResponse = await z.request({
      url: `https://api.screenlyapp.com/api/v4/assets?id=eq.${assetId}`,
      headers: {
        Authorization: `Token ${authToken}`,
      },
    });

    const assets = handleError(statusResponse, 'Failed to check asset status');
    assetStatus = assets[0].status;

    // Log status for debugging
    z.console.log(`Asset ${assetId} status: ${assetStatus}`);

  } while (!READY_STATES.includes(assetStatus));

  return assetStatus;
};

module.exports = {
  handleError,
  makeRequest,
  waitForAssetReady,
};

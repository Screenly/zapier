const uploadAsset = require('./actions/uploadAsset');
const schedulePlaylistItem = require('./actions/schedulePlaylistItem');
const assignScreenToPlaylist = require('./actions/assignScreenToPlaylist');
const completeWorkflow = require('./actions/completeWorkflow');
const cleanupZapierContent = require('./actions/cleanupZapierContent');
const { getScreens, getPlaylists, getAssets } = require('./triggers/index');

// Authentication setup
const authentication = {
  type: 'custom',
  test: {
    headers: {
      Authorization: 'Token {{bundle.authData.api_key}}',
    },
    url: 'https://api.screenlyapp.com/api/v4/assets/',
    method: 'GET',
  },
  fields: [
    {
      key: 'api_key',
      type: 'string',
      required: true,
      label: 'API Key',
      helpText: 'Your Screenly API key from https://app.screenlyapp.com/settings/api-keys',
    },
  ],
  connectionLabel: '{{bundle.authData.api_key}}',
};

// Export the app definition
module.exports = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  authentication,

  triggers: {
    [getScreens.key]: getScreens,
    [getPlaylists.key]: getPlaylists,
    [getAssets.key]: getAssets,
  },

  creates: {
    [uploadAsset.key]: uploadAsset,
    [schedulePlaylistItem.key]: schedulePlaylistItem,
    [assignScreenToPlaylist.key]: assignScreenToPlaylist,
    [completeWorkflow.key]: completeWorkflow,
    [cleanupZapierContent.key]: cleanupZapierContent,
  },

  searches: {},

  resources: {},
};

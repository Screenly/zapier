const uploadAsset = require('./actions/upload-asset');
const schedulePlaylistItem = require('./actions/schedule-playlist-item');
const assignScreenToPlaylist = require('./actions/assign-screen-to-playlist');
const completeWorkflow = require('./actions/complete-workflow');
const cleanupZapierContent = require('./actions/cleanup-zapier-content');

const { getScreens } = require('./triggers/get-screens');
const { getPlaylists } = require('./triggers/get-playlists');
const { getAssets } = require('./triggers/get-assets');

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
      helpText:
        'See [this page](https://support.screenly.io/hc/en-us/articles/35897560148371-How-to-Generate-a-Screenly-API-Token) for a guide on how to generate an API key for your Screenly account.',
    },
  ],
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

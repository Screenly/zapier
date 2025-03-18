import uploadAsset from './actions/upload-asset.js';
import schedulePlaylistItem from './actions/schedule-playlist-item.js';
import assignScreenToPlaylist from './actions/assign-screen-to-playlist.js';
import completeWorkflow from './actions/complete-workflow.js';
import cleanupZapierContent from './actions/cleanup-zapier-content.js';
import { getScreens } from './triggers/get-screens.js';
import { getPlaylists } from './triggers/get-playlists.js';
import { getAssets } from './triggers/get-assets.js';
import zappierCore from 'zapier-platform-core';

import pkg from '../package.json';

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
export default {
  version: pkg.version,
  platformVersion: zappierCore.version,

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

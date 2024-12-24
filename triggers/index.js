const utils = require('../utils');

const getScreens = {
  key: 'get_screens',
  noun: 'Screen',
  display: {
    label: 'Get Screens',
    description: 'Triggers when listing available Screenly screens.',
  },
  operation: {
    perform: async (z, bundle) => {
      const response = await z.request({
        url: 'https://api.screenlyapp.com/api/v4/screens/',
        headers: {
          Authorization: `Token ${bundle.authData.api_key}`,
        },
      });

      return utils.handleError(response, 'Failed to fetch screens');
    },
    sample: {
      id: 1,
      name: 'Sample Screen',
      description: 'A sample screen',
      playlist: 1,
    },
  },
};

const getPlaylists = {
  key: 'get_playlists',
  noun: 'Playlist',
  display: {
    label: 'Get Playlists',
    description: 'Triggers when listing available Screenly playlists.',
  },
  operation: {
    perform: async (z, bundle) => {
      const response = await z.request({
        url: 'https://api.screenlyapp.com/api/v4/playlists/',
        headers: {
          Authorization: `Token ${bundle.authData.api_key}`,
        },
      });

      return utils.handleError(response, 'Failed to fetch playlists');
    },
    sample: {
      id: 1,
      name: 'Sample Playlist',
      description: 'A sample playlist',
      items_count: 5,
    },
  },
};

const getAssets = {
  key: 'get_assets',
  noun: 'Asset',
  display: {
    label: 'Get Assets',
    description: 'Triggers when listing available Screenly assets.',
  },
  operation: {
    perform: async (z, bundle) => {
      const response = await z.request({
        url: 'https://api.screenlyapp.com/api/v4/assets/',
        headers: {
          Authorization: `Token ${bundle.authData.api_key}`,
        },
      });

      return utils.handleError(response, 'Failed to fetch assets');
    },
    sample: {
      id: 1,
      title: 'Sample Asset',
      type: 'image',
      duration: 10,
      url: 'https://example.com/sample.jpg',
    },
  },
};

module.exports = {
  getScreens,
  getPlaylists,
  getAssets,
};
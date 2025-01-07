const utils = require('../utils');
const { ZAPIER_TAG } = require('../constants');

const cleanupZapierContent = {
  key: 'cleanup_zapier_content',
  noun: 'Cleanup',
  display: {
    label: 'Cleanup Zapier Content',
    description: 'Remove all content created by Zapier',
  },
  operation: {
    inputFields: [
      {
        key: 'confirm',
        label: 'Confirm Cleanup',
        type: 'boolean',
        required: true,
        helpText: 'Are you sure you want to remove all content created by Zapier?',
      },
    ],
    perform: async (z, bundle) => {
      if (!bundle.inputData.confirm) {
        throw new Error('Please confirm the cleanup operation');
      }

      const assetsResponse = await z.request({
        url: 'https://api.screenlyapp.com/api/v4/assets/',
        method: 'GET',
        headers: {
          Authorization: `Token ${bundle.authData.api_key}`,
        },
      });

      const assets = utils
        .handleError(assetsResponse, 'Failed to fetch assets')
        .filter((asset) => asset.tags.includes(ZAPIER_TAG));

      const playlistsResponse = await z.request({
        url: 'https://api.screenlyapp.com/api/v4/playlists/',
        method: 'GET',
        headers: {
          Authorization: `Token ${bundle.authData.api_key}`,
        },
      });

      const playlists = utils
        .handleError(playlistsResponse, 'Failed to fetch playlists')
        .filter((playlist) => playlist.tags && playlist.tags.includes(ZAPIER_TAG));

      for (const asset of assets) {
        await z.request({
          url: `https://api.screenlyapp.com/api/v4/assets/${asset.id}/`,
          method: 'DELETE',
          headers: {
            Authorization: `Token ${bundle.authData.api_key}`,
          },
        });
      }

      for (const playlist of playlists) {
        await z.request({
          url: `https://api.screenlyapp.com/api/v4/playlists/${playlist.id}/`,
          method: 'DELETE',
          headers: {
            Authorization: `Token ${bundle.authData.api_key}`,
          },
        });
      }

      return {
        playlists_removed: playlists.length,
        assets_removed: assets.length,
      };
    },
    sample: {
      assets_removed: 1,
      playlists_removed: 1,
      message: 'Successfully cleaned up Zapier content',
    },
  },
};

module.exports = cleanupZapierContent;
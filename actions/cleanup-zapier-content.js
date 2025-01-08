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

      const queryParams = {
        'name': `eq.${ZAPIER_TAG}`,
      };
      const queryString = Object.keys(queryParams)
        .map(key => `${key}=${queryParams[key]}`)
        .join('&');
      const labelResponse = await z.request({
        url: `https://api.screenlyapp.com/api/v4/labels/?${queryString}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${bundle.authData.api_key}`,
          'Prefer': 'return=representation',
        },
      });

      const labels = utils.handleError(labelResponse, 'Failed to fetch labels');
      if (labels.length === 0) {
        throw new Error('No labels returned from the Screenly API');
      }
      const label = labels[0];

      const playlistToLabelResponse = await z.request({
        url: `https://api.screenlyapp.com/api/v4/labels/playlists?label_id=eq.${label.id}`,
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${bundle.authData.api_key}`,
          'Prefer': 'return=representation',
        },
      });

      const playlistToLabelMappings = utils.handleError(playlistToLabelResponse, 'Failed to fetch playlist to labels');

      const playListIds = playlistToLabelMappings
        .map(mapping => mapping.playlist_id);

      let successfulDeletions = 0;

      for (const playlistId of playListIds) {
        const response = await z.request({
          url: `https://api.screenlyapp.com/api/v4/playlists/?id=eq.${playlistId}/`,
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${bundle.authData.api_key}`,
            'Prefer': 'return=representation',
          },
          skipThrowForStatus: true,
        });

        if (response.status === 200) {
          successfulDeletions++;
        }
      }

      return {
        playlists_removed: successfulDeletions,
        message: `Successfully removed ${successfulDeletions} playlists`,
      };
    },
    sample: {
      playlists_removed: 1,
      message: 'Successfully removed 1 playlist',
    },
  },
};

module.exports = cleanupZapierContent;
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

      // Get the Zapier tag label
      const label = await utils.getLabel(z, bundle, { name: ZAPIER_TAG });

      // Get all playlists associated with the Zapier tag
      const playlistToLabelMappings = await utils.getPlaylistsByLabel(z, bundle, {
        labelId: label.id,
      });

      const playListIds = playlistToLabelMappings.map((mapping) => mapping.playlist_id);
      let successfulDeletions = 0;

      // Delete each playlist
      for (const playlistId of playListIds) {
        const success = await utils.deletePlaylist(z, bundle, { playlistId });
        if (success) {
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

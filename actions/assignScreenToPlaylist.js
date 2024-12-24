const utils = require('../utils');

const assignScreenToPlaylist = {
  key: 'assign_screen_to_playlist',
  noun: 'Screen Assignment',
  display: {
    label: 'Assign Screen to Playlist',
    description: 'Assign a screen to play a specific playlist',
  },
  operation: {
    inputFields: [
      {
        key: 'screen_id',
        label: 'Screen',
        type: 'string',
        required: true,
        dynamic: 'get_screens.id.name',
        helpText: 'Select the screen to assign',
      },
      {
        key: 'playlist_id',
        label: 'Playlist',
        type: 'string',
        required: true,
        dynamic: 'get_playlists.id.name',
        helpText: 'Select the playlist to assign to the screen',
      },
    ],
    perform: async (z, bundle) => {
      const response = await z.request({
        url: `https://api.screenlyapp.com/api/v4/screens/${bundle.inputData.screen_id}/`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${bundle.authData.api_key}`,
        },
        body: {
          playlist: bundle.inputData.playlist_id,
        },
      });

      return utils.handleError(response, 'Failed to assign screen to playlist');
    },
    sample: {
      id: 1,
      name: 'Sample Screen',
      playlist: 1,
    },
  },
};

module.exports = assignScreenToPlaylist;
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
      let screenId = bundle.inputData.screen_id;
      let playlistId = bundle.inputData.playlist_id;

      let labelToPlaylistResponse = await z.request({
        url: `https://api.screenlyapp.com/api/v4/labels/playlists`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${bundle.authData.api_key}`,
          'Prefer': 'return=representation',
        },
        body: {
          playlist_id: playlistId,
          label_id: screenId,
        },
        skipThrowForStatus: true,
      });

      if (labelToPlaylistResponse.status === 409) {
        z.console.log('Playlist already assigned to screen');
      } else {
        utils.handleError(labelToPlaylistResponse, 'Failed to assign playlist to screen');
      }

      return {
        screen_id: screenId,
        playlist_id: playlistId,
      };
    },
    sample: {
      screen_id: 1,
      playlist_id: 1,
      message: 'Successfully assigned playlist to screen',
    },
  },
};

module.exports = assignScreenToPlaylist;
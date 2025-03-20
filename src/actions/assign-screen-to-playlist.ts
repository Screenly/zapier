import utils from '../utils.js';

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
    perform: async (z: any, bundle: any) => {
      return await utils.assignPlaylistToScreen(z, bundle, {
        screenId: bundle.inputData.screen_id,
        playlistId: bundle.inputData.playlist_id,
      });
    },
    sample: {
      screen_id: 1,
      playlist_id: 1,
      message: 'Successfully assigned playlist to screen',
    },
  },
};

export default assignScreenToPlaylist;

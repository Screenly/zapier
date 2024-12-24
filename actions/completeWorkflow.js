const FormData = require('form-data');
const utils = require('../utils');
const { ZAPIER_TAG } = require('../constants');

const completeWorkflow = {
  key: 'complete_workflow',
  noun: 'Workflow',
  display: {
    label: 'Complete Workflow',
    description: 'Upload asset, create/select playlist, and assign to screen',
  },
  operation: {
    inputFields: [
      {
        key: 'file',
        label: 'File URL',
        type: 'string',
        required: true,
        helpText: 'The URL of the file to upload',
      },
      {
        key: 'title',
        label: 'Asset Title',
        type: 'string',
        required: true,
        helpText: 'Title of the asset',
      },
      {
        key: 'duration',
        label: 'Duration (seconds)',
        type: 'integer',
        required: false,
        default: '10',
        helpText: 'How long should the asset be shown (in seconds)',
      },
      {
        key: 'playlist_id',
        label: 'Existing Playlist',
        type: 'string',
        required: false,
        dynamic: 'get_playlists.id.name',
        helpText: 'Select an existing playlist or create a new one',
      },
      {
        key: 'new_playlist_name',
        label: 'New Playlist Name',
        type: 'string',
        required: false,
        helpText: 'Name for the new playlist (if not using existing)',
      },
      {
        key: 'screen_id',
        label: 'Screen',
        type: 'string',
        required: true,
        dynamic: 'get_screens.id.name',
        helpText: 'Select the screen to assign',
      },
    ],
    perform: async (z, bundle) => {
      if (!bundle.inputData.playlist_id && !bundle.inputData.new_playlist_name) {
        throw new Error('Either select an existing playlist or provide a name for a new one');
      }

      const formData = new FormData();
      formData.append('title', bundle.inputData.title);
      formData.append('duration', bundle.inputData.duration || 10);
      formData.append('tags', ZAPIER_TAG);

      const fileResponse = await z.request({
        url: bundle.inputData.file,
        raw: true,
      });
      if (fileResponse.status >= 400) {
        throw new Error(`Failed to fetch file: ${fileResponse.status}`);
      }

      formData.append('file', fileResponse.body, 'asset');

      const assetResponse = await z.request({
        url: 'https://api.screenlyapp.com/api/v4/assets/',
        method: 'POST',
        headers: {
          Authorization: `Token ${bundle.authData.api_key}`,
        },
        body: formData,
      });

      const asset = utils.handleError(assetResponse, 'Failed to upload asset');

      let playlistId = bundle.inputData.playlist_id;

      if (!playlistId) {
        const playlistResponse = await z.request({
          url: 'https://api.screenlyapp.com/api/v4/playlists/',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${bundle.authData.api_key}`,
          },
          body: {
            name: bundle.inputData.new_playlist_name,
            tags: [ZAPIER_TAG],
          },
        });

        const playlist = utils.handleError(playlistResponse, 'Failed to create playlist');
        playlistId = playlist.id;
      }

      const playlistItemResponse = await z.request({
        url: 'https://api.screenlyapp.com/api/v4/playlist-items/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${bundle.authData.api_key}`,
        },
        body: {
          asset: asset.id,
          playlist: playlistId,
        },
      });

      utils.handleError(playlistItemResponse, 'Failed to add asset to playlist');

      const screenResponse = await z.request({
        url: `https://api.screenlyapp.com/api/v4/screens/${bundle.inputData.screen_id}/`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${bundle.authData.api_key}`,
        },
        body: {
          playlist: playlistId,
        },
      });

      utils.handleError(screenResponse, 'Failed to assign playlist to screen');

      return {
        asset: asset,
        playlist_id: playlistId,
        screen_id: bundle.inputData.screen_id,
      };
    },
    sample: {
      asset_id: 1,
      playlist_id: 1,
      screen_id: 1,
      message: 'Successfully set up complete workflow',
    },
  },
};

module.exports = completeWorkflow;
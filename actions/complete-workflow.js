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

      const assetResponse = await z.request({
        url: 'https://api.screenlyapp.com/api/v4/assets/',
        method: 'POST',
        headers: {
          'Authorization': `Token ${bundle.authData.api_key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: {
          title: bundle.inputData.title,
          source_url: bundle.inputData.file,
          disable_verification: false
        },
      });

      const assets = utils.handleError(assetResponse, 'Failed to upload asset');
      const asset = assets[0];

      if (assets.length === 0) {
        throw new Error('No assets returned from the Screenly API');
      }

      let playlistId = bundle.inputData.playlist_id;

      if (!playlistId) {
        const playlistResponse = await z.request({
          url: 'https://api.screenlyapp.com/api/v4/playlists',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${bundle.authData.api_key}`,
            'Prefer': 'return=representation',
          },
          body: {
            title: bundle.inputData.new_playlist_name,
            // Set predicate to something like: "TRUE AND ($DATE >= 1731628800000)", but make
            // it dynamic based on the current date
            predicate: `TRUE AND ($DATE >= ${new Date().getTime()})`,
          },
        });

        const playlists = utils.handleError(playlistResponse, 'Failed to create playlist');

        if (playlists.length === 0) {
          throw new Error('No playlists returned from the Screenly API');
        }

        playlistId = playlists[0].id;

        const labelQueryResponse = await z.request({
          url: `https://api.screenlyapp.com/api/v4/labels?name=eq.${ZAPIER_TAG}`,
          headers: {
            'Authorization': `Token ${bundle.authData.api_key}`,
            'Prefer': 'return=representation',
          },
        });

        let labelId;
        const existingLabels = labelQueryResponse.json;

        if (existingLabels.length > 0) {
          labelId = existingLabels[0].id;
        } else {
          const labelResponse = await z.request({
            url: 'https://api.screenlyapp.com/api/v4/labels/',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Token ${bundle.authData.api_key}`,
              'Prefer': 'return=representation',
            },
            body: {
              name: ZAPIER_TAG,
            },
          });
          labelId = utils.handleError(labelResponse, 'Failed to create label').id;
        }

        await z.request({
          url: `https://api.screenlyapp.com/api/v4/labels/playlists`,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${bundle.authData.api_key}`,
            'Prefer': 'return=representation',
          },
          body: {
            playlist_id: playlistId,
            label_id: labelId,
          },
        });
      }

      // Check asset status until ready
      await utils.waitForAssetReady(z, asset.id, bundle.authData.api_key);

      const playlistItemResponse = await z.request({
        url: 'https://api.screenlyapp.com/api/v4/playlist-items/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${bundle.authData.api_key}`,
          'Prefer': 'return=representation',
        },
        body: {
          asset_id: asset.id,
          playlist_id: playlistId,
          duration: bundle.inputData.duration || 10,
        },
      });

      utils.handleError(playlistItemResponse, 'Failed to add asset to playlist');

      const labelToPlaylistResponse = await z.request({
        url: `https://api.screenlyapp.com/api/v4/labels/playlists`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${bundle.authData.api_key}`,
          'Prefer': 'return=representation',
        },
        body: {
          playlist_id: playlistId,
          label_id: bundle.inputData.screen_id,
        },
        skipThrowForStatus: true,
      });

      if (labelToPlaylistResponse.status === 409) {
        z.console.log('Playlist already assigned to screen');
      } else {
        utils.handleError(labelToPlaylistResponse, 'Failed to assign playlist to screen');
      }

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
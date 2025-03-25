import { ZObject, Bundle } from 'zapier-platform-core';
import utils from '../utils.js';
import { ZAPIER_TAG } from '../constants.js';

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
    perform: async (z: ZObject, bundle: Bundle): Promise<object> => {
      if (!bundle.authData.api_key) {
        throw new Error('API key is required');
      }

      if (!bundle.inputData.playlist_id && !bundle.inputData.new_playlist_name) {
        throw new Error('Either select an existing playlist or provide a name for a new one');
      }

      // Upload asset
      const asset = await utils.createAsset(z, bundle, {
        title: bundle.inputData.title,
        sourceUrl: bundle.inputData.file,
      });

      let playlistId = bundle.inputData.playlist_id;

      // Create new playlist if needed
      if (!playlistId) {
        const playlist = await utils.createPlaylist(z, bundle, {
          title: bundle.inputData.new_playlist_name,
          predicate: `TRUE AND ($DATE >= ${new Date().getTime()})`,
        });
        playlistId = playlist.id;

        // Handle Zapier tag label
        const labelQueryResponse = await z.request({
          url: `https://api.screenlyapp.com/api/v4/labels?name=eq.${ZAPIER_TAG}`,
          headers: {
            Authorization: `Token ${bundle.authData.api_key}`,
            Prefer: 'return=representation',
          },
        });

        let labelId: string;
        const existingLabels = labelQueryResponse.json;

        if (existingLabels.length > 0) {
          labelId = existingLabels[0].id;
        } else {
          const labelResponse = await z.request({
            url: 'https://api.screenlyapp.com/api/v4/labels/',
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Token ${bundle.authData.api_key}`,
              Prefer: 'return=representation',
            },
            body: {
              name: ZAPIER_TAG,
            },
          });
          labelId = utils.handleError(labelResponse, 'Failed to create label').id;
        }

        // Tag the new playlist
        await utils.assignPlaylistToScreen(z, bundle, {
          playlistId,
          screenId: labelId,
        });
      }

      // Wait for asset to be ready
      await utils.waitForAssetReady(z, asset.id, bundle.authData.api_key);

      // Add asset to playlist
      await utils.createPlaylistItem(z, bundle, {
        assetId: asset.id,
        playlistId: playlistId,
        duration: bundle.inputData.duration || 10,
      });

      // Assign playlist to screen
      await utils.assignPlaylistToScreen(z, bundle, {
        playlistId,
        screenId: bundle.inputData.screen_id,
      });

      return {
        asset,
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

export default completeWorkflow;

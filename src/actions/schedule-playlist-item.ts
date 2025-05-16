import { ZObject, Bundle } from 'zapier-platform-core';
import utils from '../utils.js';

const schedulePlaylistItem = {
  key: 'schedule_playlist_item',
  noun: 'Playlist Item',
  display: {
    label: 'Add Asset to Playlist',
    description: 'Add an asset to a playlist with scheduling',
  },
  operation: {
    inputFields: [
      {
        key: 'playlist_id',
        label: 'Playlist',
        type: 'string',
        required: true,
        dynamic: 'get_playlists.id.name',
        helpText: 'Select the playlist',
      },
      {
        key: 'is_new_asset',
        label: 'Create a new asset?',
        type: 'boolean',
        required: true,
        helpText: 'Create a new asset?',
      },
      {
        key: 'asset_id',
        label: 'Asset',
        type: 'string',
        required: false,
        dynamic: 'get_assets.id.title',
        helpText: 'Select the asset to schedule',
      },
      {
        key: 'file',
        label: 'File URL',
        type: 'string',
        required: true,
        helpText: 'The URL of the file to upload',
      },
      {
        key: 'title',
        label: 'Title of the asset',
      },
      {
        key: 'duration',
        label: 'Duration (seconds)',
        type: 'integer',
        required: false,
        default: '10',
        helpText: 'How long should this asset be shown (in seconds)',
      },
    ],
    perform: async (z: ZObject, bundle: Bundle): Promise<object> => {
      if (!bundle.authData.api_key) {
        throw new Error('API key is required');
      }

      await utils.waitForAssetReady(
        z,
        bundle.inputData.asset_id,
        bundle.authData.api_key
      );

      let assetId = null;
      const isNewAsset = bundle.inputData.is_new_asset;

      if (isNewAsset) {
        const asset = await utils.createAsset(z, bundle, {
          title: bundle.inputData.title,
          sourceUrl: bundle.inputData.file,
        });
        assetId = asset.id;
      } else {
        assetId = bundle.inputData.asset_id;
      }

      return await utils.createPlaylistItem(z, bundle, {
        assetId: assetId,
        playlistId: bundle.inputData.playlist_id,
        duration: bundle.inputData.duration,
      });
    },
    sample: {
      id: 1,
      asset: 1,
      playlist: 1,
      conditions: {
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T23:59:59Z',
      },
    },
  },
};

export default schedulePlaylistItem;

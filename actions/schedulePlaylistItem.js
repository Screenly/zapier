const utils = require('../utils');

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
        key: 'asset_id',
        label: 'Asset',
        type: 'string',
        required: true,
        dynamic: 'get_assets.id.title',
        helpText: 'Select the asset to schedule',
      },
      {
        key: 'duration',
        label: 'Duration (seconds)',
        type: 'integer',
        required: false,
        default: '10',
        helpText: 'How long should this asset be shown (in seconds)',
      },
      {
        key: 'start_date',
        label: 'Start Date',
        type: 'datetime',
        required: false,
        helpText: 'When should this item start being available for playback (optional)',
      },
      {
        key: 'end_date',
        label: 'End Date',
        type: 'datetime',
        required: false,
        helpText: 'When should this item stop being available (optional)',
      },
    ],
    perform: async (z, bundle) => {
      if (bundle.inputData.duration) {
        const assetResponse = await z.request({
          url: `https://api.screenlyapp.com/api/v4/assets/${bundle.inputData.asset_id}/`,
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${bundle.authData.api_key}`,
          },
          body: {
            duration: parseInt(bundle.inputData.duration, 10),
          },
        });

        if (assetResponse.status >= 400) {
          throw new Error(`Failed to update asset duration: ${assetResponse.content}`);
        }
      }

      const conditions = {};
      if (bundle.inputData.start_date) {
        conditions.start_date = bundle.inputData.start_date;
      }
      if (bundle.inputData.end_date) {
        conditions.end_date = bundle.inputData.end_date;
      }

      const payload = {
        asset: bundle.inputData.asset_id,
        playlist: bundle.inputData.playlist_id,
      };

      if (Object.keys(conditions).length > 0) {
        payload.conditions = conditions;
      }

      const response = await z.request({
        url: 'https://api.screenlyapp.com/api/v4/playlist-items/',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${bundle.authData.api_key}`,
        },
        body: payload,
      });

      return utils.handleError(response, 'Failed to add asset to playlist');
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

module.exports = schedulePlaylistItem;
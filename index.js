const FormData = require('form-data');
const utils = require('./utils');

// Authentication setup
const authentication = {
  type: 'custom',
  test: {
    headers: {
      Authorization: 'Token {{bundle.authData.api_key}}',
    },
    url: 'https://api.screenlyapp.com/api/v4/assets/',
    method: 'GET',
  },
  fields: [
    {
      key: 'api_key',
      type: 'string',
      required: true,
      label: 'API Key',
      helpText: 'Your Screenly API key from https://app.screenlyapp.com/settings/api-keys',
    },
  ],
  connectionLabel: '{{bundle.authData.api_key}}',
};

// Upload Asset Action
const uploadAsset = {
  key: 'upload_asset',
  noun: 'Asset',
  display: {
    label: 'Upload Asset',
    description: 'Upload a new asset to Screenly',
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
        label: 'Title',
        type: 'string',
        required: true,
        helpText: 'Title of the asset',
      },
    ],
    perform: async (z, bundle) => {
      const response = await z.request({
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

      return utils.handleError(response, 'Failed to upload asset');
    },
    sample: {
      id: 1,
      title: 'Sample Asset',
      type: 'image',
      url: 'https://example.com/sample.jpg',
    },
  },
};

// Schedule Playlist Item Action
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
      // First, update the asset duration if specified
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

      // Build the conditions object
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

      // Only add conditions if they are specified
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

      if (response.status >= 400) {
        throw new Error(`Failed to add asset to playlist: ${response.content}`);
      }

      return response.json;
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

// Assign Screen to Playlist Action
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

      if (response.status >= 400) {
        throw new Error(`Failed to assign screen to playlist: ${response.content}`);
      }

      return response.json;
    },
    sample: {
      id: 1,
      name: 'Sample Screen',
      playlist: 1,
    },
  },
};

// Get Screens Trigger
const getScreens = {
  key: 'get_screens',
  noun: 'Screen',
  display: {
    label: 'Get Screens',
    description: 'Triggers when listing available Screenly screens.',
  },
  operation: {
    perform: async (z, bundle) => {
      const response = await z.request({
        url: 'https://api.screenlyapp.com/api/v4/screens/',
        headers: {
          Authorization: `Token ${bundle.authData.api_key}`,
        },
      });

      return utils.handleError(response, 'Failed to fetch screens');
    },
    sample: {
      id: 1,
      name: 'Sample Screen',
      description: 'A sample screen',
      playlist: 1,
    },
  },
};

// Get Playlists Trigger
const getPlaylists = {
  key: 'get_playlists',
  noun: 'Playlist',
  display: {
    label: 'Get Playlists',
    description: 'Triggers when listing available Screenly playlists.',
  },
  operation: {
    perform: async (z, bundle) => {
      const response = await z.request({
        url: 'https://api.screenlyapp.com/api/v4/playlists/',
        headers: {
          Authorization: `Token ${bundle.authData.api_key}`,
        },
      });

      return utils.handleError(response, 'Failed to fetch playlists');
    },
    sample: {
      id: 1,
      name: 'Sample Playlist',
      description: 'A sample playlist',
      items_count: 5,
    },
  },
};

// Get Assets Trigger
const getAssets = {
  key: 'get_assets',
  noun: 'Asset',
  display: {
    label: 'Get Assets',
    description: 'Triggers when listing available Screenly assets.',
  },
  operation: {
    perform: async (z, bundle) => {
      const response = await z.request({
        url: 'https://api.screenlyapp.com/api/v4/assets/',
        headers: {
          Authorization: `Token ${bundle.authData.api_key}`,
        },
      });

      return utils.handleError(response, 'Failed to fetch assets');
    },
    sample: {
      id: 1,
      title: 'Sample Asset',
      type: 'image',
      duration: 10,
      url: 'https://example.com/sample.jpg',
    },
  },
};

// Helper to tag resources created by Zapier
const ZAPIER_TAG = 'created_by_zapier';

// Complete Workflow Action
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
      // Validate playlist information
      if (!bundle.inputData.playlist_id && !bundle.inputData.new_playlist_name) {
        throw new Error('Either select an existing playlist or provide a name for a new one');
      }

      // Step 1: Upload the asset
      const formData = new FormData();
      formData.append('title', bundle.inputData.title);
      formData.append('duration', bundle.inputData.duration || 10);
      formData.append('tags', ZAPIER_TAG); // Tag the asset

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

      // Step 2: Get or create playlist
      let playlistId = bundle.inputData.playlist_id;

      if (!playlistId) {
        // Create new playlist
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

      // Step 3: Add asset to playlist
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

      // Step 4: Assign playlist to screen
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

// Cleanup Action
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

      // Step 1: Get all Zapier-created assets
      const assetsResponse = await z.request({
        url: 'https://api.screenlyapp.com/api/v4/assets/',
        method: 'GET',
        headers: {
          Authorization: `Token ${bundle.authData.api_key}`,
        },
      });

      const assets = utils
        .handleError(assetsResponse, 'Failed to fetch assets')
        .filter((asset) => asset.tags.includes(ZAPIER_TAG));

      // Step 2: Get all Zapier-created playlists
      const playlistsResponse = await z.request({
        url: 'https://api.screenlyapp.com/api/v4/playlists/',
        method: 'GET',
        headers: {
          Authorization: `Token ${bundle.authData.api_key}`,
        },
      });

      const playlists = utils
        .handleError(playlistsResponse, 'Failed to fetch playlists')
        .filter((playlist) => playlist.tags && playlist.tags.includes(ZAPIER_TAG));

      // Step 3: Delete assets
      for (const asset of assets) {
        await z.request({
          url: `https://api.screenlyapp.com/api/v4/assets/${asset.id}/`,
          method: 'DELETE',
          headers: {
            Authorization: `Token ${bundle.authData.api_key}`,
          },
        });
      }

      // Step 4: Delete playlists
      for (const playlist of playlists) {
        await z.request({
          url: `https://api.screenlyapp.com/api/v4/playlists/${playlist.id}/`,
          method: 'DELETE',
          headers: {
            Authorization: `Token ${bundle.authData.api_key}`,
          },
        });
      }

      return {
        playlists_removed: playlists.length,
        assets_removed: assets.length,
      };
    },
    sample: {
      assets_removed: 1,
      playlists_removed: 1,
      message: 'Successfully cleaned up Zapier content',
    },
  },
};

// Export the app definition
module.exports = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,

  authentication,

  triggers: {
    [getScreens.key]: getScreens,
    [getPlaylists.key]: getPlaylists,
    [getAssets.key]: getAssets,
  },

  creates: {
    [uploadAsset.key]: uploadAsset,
    [schedulePlaylistItem.key]: schedulePlaylistItem,
    [assignScreenToPlaylist.key]: assignScreenToPlaylist,
    [completeWorkflow.key]: completeWorkflow,
    [cleanupZapierContent.key]: cleanupZapierContent,
  },

  searches: {},

  resources: {},
};

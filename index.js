const FormData = require('form-data');
const fetch = require('node-fetch');

// Authentication setup
const authentication = {
  type: 'custom',
  test: {
    headers: {
      Authorization: 'Token {{bundle.authData.api_key}}'
    },
    url: 'https://api.screenlyapp.com/api/v4/assets/',
    method: 'GET'
  },
  fields: [
    {
      key: 'api_key',
      type: 'string',
      required: true,
      secure: true,
      label: 'API Key',
      helpText: 'Your Screenly API key from https://app.screenlyapp.com/settings/api-keys'
    }
  ]
};

// Helper to make authenticated requests
const makeRequest = async (z, url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Token ${z.authData.api_key}`
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Screenly API Error: ${response.status} ${error}`);
  }

  return response.json();
};

// Upload Asset Action
const uploadAsset = {
  key: 'upload_asset',
  noun: 'Asset',
  display: {
    label: 'Upload Asset',
    description: 'Upload a new asset to Screenly'
  },
  operation: {
    inputFields: [
      {
        key: 'file',
        label: 'File URL',
        type: 'string',
        required: true,
        helpText: 'The URL of the file to upload'
      },
      {
        key: 'title',
        label: 'Title',
        type: 'string',
        required: true,
        helpText: 'Title of the asset'
      },
      {
        key: 'duration',
        label: 'Duration (seconds)',
        type: 'integer',
        required: false,
        default: '10',
        helpText: 'How long should the asset be shown (in seconds)'
      }
    ],
    perform: async (z, bundle) => {
      // First, fetch the file
      const fileResponse = await fetch(bundle.inputData.file);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file: ${fileResponse.status}`);
      }
      const buffer = await fileResponse.buffer();

      // Create form data
      const formData = new FormData();
      formData.append('title', bundle.inputData.title);
      formData.append('duration', bundle.inputData.duration || 10);
      formData.append('file', buffer, 'asset');

      const response = await fetch('https://api.screenlyapp.com/api/v4/assets/', {
        method: 'POST',
        headers: {
          Authorization: `Token ${bundle.authData.api_key}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to upload asset: ${error}`);
      }

      return response.json();
    }
  }
};

// Schedule Playlist Item Action
const schedulePlaylistItem = {
  key: 'schedule_playlist_item',
  noun: 'Playlist Item',
  display: {
    label: 'Add Asset to Playlist',
    description: 'Add an asset to a playlist with scheduling'
  },
  operation: {
    inputFields: [
      {
        key: 'playlist_id',
        label: 'Playlist',
        type: 'string',
        required: true,
        dynamic: 'get_playlists.id.name',
        helpText: 'Select the playlist'
      },
      {
        key: 'asset_id',
        label: 'Asset',
        type: 'string',
        required: true,
        dynamic: 'get_assets.id.title',
        helpText: 'Select the asset to schedule'
      },
      {
        key: 'duration',
        label: 'Duration (seconds)',
        type: 'integer',
        required: false,
        default: '10',
        helpText: 'How long should this asset be shown (in seconds)'
      },
      {
        key: 'start_date',
        label: 'Start Date',
        type: 'datetime',
        required: false,
        helpText: 'When should this item start being available for playback (optional)'
      },
      {
        key: 'end_date',
        label: 'End Date',
        type: 'datetime',
        required: false,
        helpText: 'When should this item stop being available (optional)'
      }
    ],
    perform: async (z, bundle) => {
      // First, update the asset duration if specified
      if (bundle.inputData.duration) {
        const assetResponse = await fetch(`https://api.screenlyapp.com/api/v4/assets/${bundle.inputData.asset_id}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${bundle.authData.api_key}`
          },
          body: JSON.stringify({
            duration: parseInt(bundle.inputData.duration, 10)
          })
        });

        if (!assetResponse.ok) {
          const error = await assetResponse.text();
          throw new Error(`Failed to update asset duration: ${error}`);
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
        playlist: bundle.inputData.playlist_id
      };

      // Only add conditions if they are specified
      if (Object.keys(conditions).length > 0) {
        payload.conditions = conditions;
      }

      const response = await fetch('https://api.screenlyapp.com/api/v4/playlist-items/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${bundle.authData.api_key}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to add asset to playlist: ${error}`);
      }

      return response.json();
    }
  }
};

// Assign Screen to Playlist Action
const assignScreenToPlaylist = {
  key: 'assign_screen_to_playlist',
  noun: 'Screen Assignment',
  display: {
    label: 'Assign Screen to Playlist',
    description: 'Assign a screen to play a specific playlist'
  },
  operation: {
    inputFields: [
      {
        key: 'screen_id',
        label: 'Screen',
        type: 'string',
        required: true,
        dynamic: 'get_screens.id.name',
        helpText: 'Select the screen to assign'
      },
      {
        key: 'playlist_id',
        label: 'Playlist',
        type: 'string',
        required: true,
        dynamic: 'get_playlists.id.name',
        helpText: 'Select the playlist to assign to the screen'
      }
    ],
    perform: async (z, bundle) => {
      const response = await fetch(`https://api.screenlyapp.com/api/v4/screens/${bundle.inputData.screen_id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${bundle.authData.api_key}`
        },
        body: JSON.stringify({
          playlist: bundle.inputData.playlist_id
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to assign screen to playlist: ${error}`);
      }

      return response.json();
    }
  }
};

// Get Screens Trigger (for dynamic dropdown)
const getScreens = {
  key: 'get_screens',
  noun: 'Screen',
  display: {
    label: 'Get Screens',
    hidden: true
  },
  operation: {
    perform: async (z, bundle) => {
      const response = await fetch('https://api.screenlyapp.com/api/v4/screens/', {
        method: 'GET',
        headers: {
          Authorization: `Token ${bundle.authData.api_key}`
        }
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch screens: ${error}`);
      }

      return response.json();
    }
  }
};

// Get Playlists Trigger (for dynamic dropdown)
const getPlaylists = {
  key: 'get_playlists',
  noun: 'Playlist',
  display: {
    label: 'Get Playlists',
    hidden: true
  },
  operation: {
    perform: async (z, bundle) => {
      const response = await fetch('https://api.screenlyapp.com/api/v4/playlists/', {
        method: 'GET',
        headers: {
          Authorization: `Token ${bundle.authData.api_key}`
        }
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch playlists: ${error}`);
      }

      return response.json();
    }
  }
};

// Get Assets Trigger (for dynamic dropdown)
const getAssets = {
  key: 'get_assets',
  noun: 'Asset',
  display: {
    label: 'Get Assets',
    hidden: true
  },
  operation: {
    perform: async (z, bundle) => {
      const response = await fetch('https://api.screenlyapp.com/api/v4/assets/', {
        method: 'GET',
        headers: {
          Authorization: `Token ${bundle.authData.api_key}`
        }
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch assets: ${error}`);
      }

      return response.json();
    }
  }
};

// Helper to tag resources created by Zapier
const ZAPIER_TAG = 'created_by_zapier';

// Complete Workflow Action
const completeWorkflow = {
  key: 'complete_workflow',
  noun: 'Digital Signage Setup',
  display: {
    label: 'Add Content to Screen',
    description: 'Upload an asset, add it to a playlist, and assign it to a screen'
  },
  operation: {
    inputFields: [
      {
        key: 'file',
        label: 'File URL',
        type: 'string',
        required: true,
        helpText: 'The URL of the file to upload'
      },
      {
        key: 'title',
        label: 'Title',
        type: 'string',
        required: true,
        helpText: 'Title of the asset'
      },
      {
        key: 'duration',
        label: 'Duration (seconds)',
        type: 'integer',
        required: false,
        default: '10',
        helpText: 'How long should this asset be shown (in seconds)'
      },
      {
        key: 'playlist_id',
        label: 'Playlist',
        type: 'string',
        required: false,
        dynamic: 'get_playlists.id.name',
        helpText: 'Select an existing playlist or leave empty to create a new one'
      },
      {
        key: 'new_playlist_name',
        label: 'New Playlist Name',
        type: 'string',
        required: false,
        helpText: 'If no playlist is selected above, enter a name for a new playlist'
      },
      {
        key: 'screen_id',
        label: 'Screen',
        type: 'string',
        required: true,
        dynamic: 'get_screens.id.name',
        helpText: 'Select the screen to display this content'
      },
      {
        key: 'start_date',
        label: 'Start Date',
        type: 'datetime',
        required: false,
        helpText: 'When should this content start being available for playback (optional)'
      },
      {
        key: 'end_date',
        label: 'End Date',
        type: 'datetime',
        required: false,
        helpText: 'When should this content stop being available (optional)'
      }
    ],
    perform: async (z, bundle) => {
      // Step 1: Upload the asset
      const formData = new FormData();
      formData.append('title', bundle.inputData.title);
      formData.append('duration', bundle.inputData.duration || 10);
      formData.append('tags', ZAPIER_TAG);  // Tag the asset

      const fileResponse = await fetch(bundle.inputData.file);
      if (!fileResponse.ok) {
        throw new Error(`Failed to fetch file: ${fileResponse.status}`);
      }
      const buffer = await fileResponse.buffer();
      formData.append('file', buffer, 'asset');

      const assetResponse = await fetch('https://api.screenlyapp.com/api/v4/assets/', {
        method: 'POST',
        headers: {
          Authorization: `Token ${bundle.authData.api_key}`
        },
        body: formData
      });

      if (!assetResponse.ok) {
        const error = await assetResponse.text();
        throw new Error(`Failed to upload asset: ${error}`);
      }

      const asset = await assetResponse.json();

      // Step 2: Get or create playlist
      let playlistId = bundle.inputData.playlist_id;

      if (!playlistId && !bundle.inputData.new_playlist_name) {
        throw new Error('Either select an existing playlist or provide a name for a new one');
      }

      if (!playlistId) {
        // Create new playlist with Zapier tag
        const playlistResponse = await fetch('https://api.screenlyapp.com/api/v4/playlists/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Token ${bundle.authData.api_key}`
          },
          body: JSON.stringify({
            name: bundle.inputData.new_playlist_name,
            tags: [ZAPIER_TAG]
          })
        });

        if (!playlistResponse.ok) {
          const error = await playlistResponse.text();
          throw new Error(`Failed to create playlist: ${error}`);
        }

        const playlist = await playlistResponse.json();
        playlistId = playlist.id;
      }

      // Step 3: Add asset to playlist
      const conditions = {};
      if (bundle.inputData.start_date) {
        conditions.start_date = bundle.inputData.start_date;
      }
      if (bundle.inputData.end_date) {
        conditions.end_date = bundle.inputData.end_date;
      }

      const playlistItemPayload = {
        asset: asset.id,
        playlist: playlistId
      };

      if (Object.keys(conditions).length > 0) {
        playlistItemPayload.conditions = conditions;
      }

      const playlistItemResponse = await fetch('https://api.screenlyapp.com/api/v4/playlist-items/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${bundle.authData.api_key}`
        },
        body: JSON.stringify(playlistItemPayload)
      });

      if (!playlistItemResponse.ok) {
        const error = await playlistItemResponse.text();
        throw new Error(`Failed to add asset to playlist: ${error}`);
      }

      // Step 4: Assign playlist to screen
      const screenResponse = await fetch(`https://api.screenlyapp.com/api/v4/screens/${bundle.inputData.screen_id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Token ${bundle.authData.api_key}`
        },
        body: JSON.stringify({
          playlist: playlistId
        })
      });

      if (!screenResponse.ok) {
        const error = await screenResponse.text();
        throw new Error(`Failed to assign playlist to screen: ${error}`);
      }

      const screen = await screenResponse.json();

      // Return complete workflow result
      return {
        asset: asset,
        playlist_id: playlistId,
        screen: screen,
        message: 'Successfully set up digital signage workflow'
      };
    }
  }
};

// Cleanup Action
const cleanupZapierContent = {
  key: 'cleanup_zapier_content',
  noun: 'Cleanup',
  display: {
    label: 'Clean Up Zapier Content',
    description: 'Remove playlists and assets created by Zapier'
  },
  operation: {
    inputFields: [
      {
        key: 'confirm',
        label: 'Confirm Cleanup',
        type: 'boolean',
        required: true,
        helpText: 'Are you sure you want to remove all content created by Zapier?'
      }
    ],
    perform: async (z, bundle) => {
      if (!bundle.inputData.confirm) {
        throw new Error('Please confirm the cleanup operation');
      }

      // Step 1: Get all Zapier-created assets
      const assetsResponse = await fetch('https://api.screenlyapp.com/api/v4/assets/', {
        method: 'GET',
        headers: {
          Authorization: `Token ${bundle.authData.api_key}`
        }
      });

      if (!assetsResponse.ok) {
        throw new Error('Failed to fetch assets');
      }

      const assets = await assetsResponse.json();
      const zapierAssets = assets.filter(asset => asset.tags && asset.tags.includes(ZAPIER_TAG));

      // Step 2: Get all Zapier-created playlists
      const playlistsResponse = await fetch('https://api.screenlyapp.com/api/v4/playlists/', {
        method: 'GET',
        headers: {
          Authorization: `Token ${bundle.authData.api_key}`
        }
      });

      if (!playlistsResponse.ok) {
        throw new Error('Failed to fetch playlists');
      }

      const playlists = await playlistsResponse.json();
      const zapierPlaylists = playlists.filter(playlist => playlist.tags && playlist.tags.includes(ZAPIER_TAG));

      // Step 3: Remove Zapier playlists
      for (const playlist of zapierPlaylists) {
        await fetch(`https://api.screenlyapp.com/api/v4/playlists/${playlist.id}/`, {
          method: 'DELETE',
          headers: {
            Authorization: `Token ${bundle.authData.api_key}`
          }
        });
      }

      // Step 4: Remove Zapier assets
      for (const asset of zapierAssets) {
        await fetch(`https://api.screenlyapp.com/api/v4/assets/${asset.id}/`, {
          method: 'DELETE',
          headers: {
            Authorization: `Token ${bundle.authData.api_key}`
          }
        });
      }

      return {
        playlists_removed: zapierPlaylists.length,
        assets_removed: zapierAssets.length,
        message: `Successfully removed ${zapierPlaylists.length} playlists and ${zapierAssets.length} assets created by Zapier`
      };
    }
  }
};

module.exports = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,
  authentication,
  triggers: {
    [getPlaylists.key]: getPlaylists,
    [getAssets.key]: getAssets,
    [getScreens.key]: getScreens
  },
  creates: {
    [uploadAsset.key]: uploadAsset,
    [schedulePlaylistItem.key]: schedulePlaylistItem,
    [assignScreenToPlaylist.key]: assignScreenToPlaylist,
    [completeWorkflow.key]: completeWorkflow,
    [cleanupZapierContent.key]: cleanupZapierContent
  }
};
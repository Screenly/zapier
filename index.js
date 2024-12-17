const utils = require('./utils');
const FormData = require('form-data');

// Authentication setup
const authentication = {
  type: 'custom',
  test: async (z, bundle) => {
    try {
      const response = await utils.makeRequest(z, 'https://api.screenlyapp.com/api/v4/assets/', {
        params: { limit: 1 },
        headers: {
          Authorization: `Token ${bundle.authData.api_key}`
        }
      });
      return response.json;
    } catch (error) {
      z.console.log('Authentication test failed:', error.message);
      throw error;
    }
  },
  fields: [
    {
      key: 'api_key',
      type: 'string',
      required: true,
      label: 'Screenly API Key',
      helpText: 'Your Screenly API key from https://app.screenlyapp.com/settings/api-keys',
    },
    {
      key: 'google_access_token',
      type: 'string',
      required: false,
      label: 'Google Drive Access Token',
      helpText: 'Required only if you plan to use files from Google Drive',
    },
    {
      key: 'box_access_token',
      type: 'string',
      required: false,
      label: 'Box Access Token',
      helpText: 'Required only if you plan to use files from Box',
    },
    {
      key: 'dropbox_access_token',
      type: 'string',
      required: false,
      label: 'Dropbox Access Token',
      helpText: 'Required only if you plan to use files from Dropbox',
    },
  ],
  connectionLabel: '{{bundle.authData.api_key}}',
};

// File handling utilities
const fileUtils = {
  isGoogleDriveUrl(url) {
    return url.includes('drive.google.com') || url.includes('docs.google.com');
  },

  isBoxUrl(url) {
    return url.includes('app.box.com') || url.includes('box.com/s/');
  },

  isDropboxUrl(url) {
    return url.includes('dropbox.com/s/');
  },

  getGoogleDriveFileId(url) {
    const patterns = [
      /\/file\/d\/([^/]+)/,  // matches /file/d/{fileId}
      /id=([^&]+)/,          // matches ?id={fileId}
      /\/document\/d\/([^/]+)/, // matches /document/d/{fileId}
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    throw new Error('Invalid Google Drive URL format');
  },

  getBoxFileId(url) {
    const match = url.match(/\/s\/([^/]+)/);
    if (!match || !match[1]) {
      throw new Error('Invalid Box URL format');
    }
    return match[1];
  },

  getDropboxFileId(url) {
    const match = url.match(/\/s\/([^/]+)/);
    if (!match || !match[1]) {
      throw new Error('Invalid Dropbox URL format');
    }
    return match[1];
  },

  async getGoogleDriveDownloadUrl(z, fileId, token) {
    try {
      const response = await utils.makeRequest(z, `https://www.googleapis.com/drive/v3/files/${fileId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          fields: 'name,mimeType,webContentLink',
        },
      });

      const { name, mimeType, webContentLink } = response.json;
      utils.validateFileType(mimeType);

      return {
        name,
        type: mimeType,
        url: webContentLink,
      };
    } catch (error) {
      utils.handleGoogleError(error);
    }
  },

  async getBoxDownloadUrl(z, fileId, token) {
    try {
      const fileResponse = await utils.makeRequest(z, `https://api.box.com/2.0/files/${fileId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const { name, type } = fileResponse.json;
      utils.validateFileType(type);

      const downloadResponse = await utils.makeRequest(z, `https://api.box.com/2.0/files/${fileId}/content`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        followRedirect: false,
      });

      const location = downloadResponse.headers?.get('location');
      if (!location) {
        throw new Error('Failed to get download URL from Box');
      }

      return {
        name,
        type,
        url: location,
      };
    } catch (error) {
      utils.handleBoxError(error);
    }
  },

  async getDropboxDownloadUrl(z, fileId, token) {
    try {
      const metadataResponse = await utils.makeRequest(z, 'https://api.dropboxapi.com/2/sharing/get_shared_link_metadata', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: {
          url: `https://www.dropbox.com/s/${fileId}`,
        },
      });

      const { name, link_metadata } = metadataResponse.json;
      const mimeType = link_metadata.mime_type;
      utils.validateFileType(mimeType);

      const downloadResponse = await utils.makeRequest(z, 'https://api.dropboxapi.com/2/sharing/get_shared_link_file', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Dropbox-API-Arg': JSON.stringify({ url: `https://www.dropbox.com/s/${fileId}` }),
        },
      });

      const location = downloadResponse.headers?.get('location');
      if (!location) {
        throw new Error('Failed to get download URL from Dropbox');
      }

      return {
        name,
        type: mimeType,
        url: location,
      };
    } catch (error) {
      utils.handleDropboxError(error);
    }
  },

  async getDownloadUrl(z, bundle) {
    const { file } = bundle.inputData;
    const { google_access_token, box_access_token, dropbox_access_token } = bundle.authData;

    // Check for cloud storage URLs first
    if (this.isGoogleDriveUrl(file)) {
      if (!google_access_token) {
        throw new Error('Google Drive access token is required for Google Drive files');
      }
      const fileId = this.getGoogleDriveFileId(file);
      return this.getGoogleDriveDownloadUrl(z, fileId, google_access_token);
    }

    if (this.isDropboxUrl(file)) {
      if (!dropbox_access_token) {
        throw new Error('Dropbox access token is required for Dropbox files');
      }
      const fileId = this.getDropboxFileId(file);
      return this.getDropboxDownloadUrl(z, fileId, dropbox_access_token);
    }

    if (this.isBoxUrl(file)) {
      if (!box_access_token) {
        throw new Error('Box access token is required for Box files');
      }
      const fileId = this.getBoxFileId(file);
      return this.getBoxDownloadUrl(z, fileId, box_access_token);
    }

    // For direct URLs, validate the URL format
    try {
      const url = new URL(file);
      return {
        name: url.pathname.split('/').pop() || 'file',
        type: 'application/octet-stream',
        url: file,
      };
    } catch (error) {
      throw new Error('Invalid file URL format');
    }
  }
};

// Create asset in Screenly
const uploadAsset = {
  key: 'upload_asset',
  noun: 'Asset',
  display: {
    label: 'Upload Asset',
    description: 'Uploads a new asset to Screenly.',
  },
  operation: {
    inputFields: [
      {
        key: 'file',
        label: 'File URL',
        type: 'string',
        required: true,
        helpText: 'URL of the file to upload. Supports direct URLs, Google Drive, Box, and Dropbox links.',
      },
      {
        key: 'title',
        label: 'Title',
        type: 'string',
        required: true,
        helpText: 'Title of the asset.',
      },
      {
        key: 'duration',
        label: 'Duration (seconds)',
        type: 'integer',
        required: true,
        default: '10',
        helpText: 'How long the asset should be displayed in seconds.',
      },
      {
        key: 'start_date',
        label: 'Start Date',
        type: 'datetime',
        required: false,
        helpText: 'When the asset should start being displayed. Defaults to immediately.',
      },
      {
        key: 'end_date',
        label: 'End Date',
        type: 'datetime',
        required: false,
        helpText: 'When the asset should stop being displayed. Defaults to never.',
      },
      {
        key: 'is_enabled',
        label: 'Enable Asset',
        type: 'boolean',
        required: false,
        default: 'true',
        helpText: 'Whether the asset should be enabled immediately after upload.',
      },
      {
        key: 'skip_asset_validation',
        label: 'Skip Asset Validation',
        type: 'boolean',
        required: false,
        default: 'false',
        helpText: 'Skip asset validation (use with caution).',
      }
    ],
    perform: async (z, bundle) => {
      try {
        // Validate input
        utils.validateAssetInput(bundle.inputData);

        // Get the download URL for the file
        const fileInfo = await fileUtils.getDownloadUrl(z, bundle);
        z.console.log('File info:', fileInfo);

        // Create form data for the upload
        const formData = new FormData();
        formData.append('title', bundle.inputData.title);
        formData.append('duration', bundle.inputData.duration);
        formData.append('file_url', fileInfo.url);
        if (fileInfo.type !== 'application/octet-stream') {
          formData.append('mime_type', fileInfo.type);
        }

        // Add optional fields if provided
        if (bundle.inputData.start_date) {
          formData.append('start_date', bundle.inputData.start_date);
        }
        if (bundle.inputData.end_date) {
          formData.append('end_date', bundle.inputData.end_date);
        }
        if (bundle.inputData.is_enabled !== undefined) {
          formData.append('is_enabled', bundle.inputData.is_enabled);
        }
        if (bundle.inputData.skip_asset_validation !== undefined) {
          formData.append('disable_verification', bundle.inputData.skip_asset_validation);
        }

        // Upload the asset to Screenly

        const response = await utils.makeRequest(z, 'https://api.screenlyapp.com/api/v4/assets/', {
          method: 'POST',
          headers: {
            'Authorization': `Token ${bundle.authData.api_key}`,
            'Content-Type': `application/json`,
            'Prefer': 'return=representation',
          },
          body: {
            'title': bundle.inputData.title,
            'source_url': fileInfo.url,
            'disable_verification': bundle.inputData.skip_asset_validation,
          }
        });

        return response.json[0];
      } catch (error) {
        z.console.error('Asset upload failed:', error);
        throw error;
      }
    },
  },
};

// List assets
const listAssets = {
  key: 'list_assets',
  noun: 'Asset',
  display: {
    label: 'List Assets',
    description: 'Lists all assets in your Screenly account.',
  },
  operation: {
    perform: async (z, bundle) => {
      try {
        const response = await utils.makeRequest(z, 'https://api.screenlyapp.com/api/v4/assets/', {
          headers: {
            Authorization: `Token ${bundle.authData.api_key}`,
          },
        });
        return response.json.assets;
      } catch (error) {
        z.console.error('Failed to list assets:', error);
        throw error;
      }
    },
    sample: {
      id: 'asset-123',
      title: 'Sample Asset',
      duration: 10,
      mime_type: 'image/jpeg',
      url: 'https://example.com/image.jpg',
      is_enabled: true,
      start_date: null,
      end_date: null,
    },
  },
};

// Delete asset
const deleteAsset = {
  key: 'delete_asset',
  noun: 'Asset',
  display: {
    label: 'Delete Asset',
    description: 'Deletes an asset from your Screenly account.',
  },
  operation: {
    inputFields: [
      {
        key: 'asset_id',
        label: 'Asset ID',
        type: 'string',
        required: true,
        helpText: 'The ID of the asset to delete.',
      },
    ],
    perform: async (z, bundle) => {
      try {
        await utils.makeRequest(z, `https://api.screenlyapp.com/api/v4/assets/${bundle.inputData.asset_id}/`, {
          method: 'DELETE',
          headers: {
            Authorization: `Token ${bundle.authData.api_key}`,
          },
        });
        return { id: bundle.inputData.asset_id, deleted: true };
      } catch (error) {
        z.console.error('Failed to delete asset:', error);
        throw error;
      }
    },
  },
};

module.exports = {
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,
  authentication,
  triggers: {
    [listAssets.key]: listAssets,
  },
  creates: {
    [uploadAsset.key]: uploadAsset,
    [deleteAsset.key]: deleteAsset,
  },
};

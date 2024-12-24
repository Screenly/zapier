const utils = require('../utils');

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
      {
        key: 'duration',
        label: 'Duration (seconds)',
        type: 'integer',
        required: false,
        default: '10',
        helpText: 'How long should the asset be shown (in seconds)',
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

      const assets = utils.handleError(response, 'Failed to upload asset');

      if (assets.length === 0) {
        throw new Error('No assets returned from the Screenly API');
      }

      return assets[0];
    },
    sample: {
      id: 1,
      title: 'Sample Asset',
      duration: 10,
      type: 'image',
      url: 'https://example.com/sample.jpg',
    },
  },
};

module.exports = uploadAsset;

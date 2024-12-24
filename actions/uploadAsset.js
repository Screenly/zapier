const FormData = require('form-data');
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
      const fileResponse = await z.request({
        url: bundle.inputData.file,
        raw: true,
      });

      if (fileResponse.status >= 400) {
        throw new Error(`Failed to fetch file: ${fileResponse.status}`);
      }

      const formData = new FormData();
      formData.append('title', bundle.inputData.title);
      formData.append('duration', bundle.inputData.duration || 10);
      formData.append('file', fileResponse.body, 'asset');

      const response = await z.request({
        url: 'https://api.screenlyapp.com/api/v4/assets/',
        method: 'POST',
        headers: {
          Authorization: `Token ${bundle.authData.api_key}`,
        },
        body: formData,
      });

      return utils.handleError(response, 'Failed to upload asset');
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
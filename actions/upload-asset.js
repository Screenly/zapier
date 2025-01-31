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
    ],
    perform: async (z, bundle) => {
      return await utils.createAsset(z, bundle, {
        title: bundle.inputData.title,
        sourceUrl: bundle.inputData.file,
      });
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

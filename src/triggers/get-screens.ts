import utils from '../utils.js';

const getScreens = {
  key: 'get_screens',
  noun: 'Screen',
  display: {
    label: 'Get Screens',
    description: 'Triggers when listing available Screenly screens.',
    hidden: true,
  },
  operation: {
    perform: async (z: any, bundle: any) => {
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

export { getScreens };

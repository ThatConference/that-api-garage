import debug from 'debug';

const dlog = debug('that:api:assets:query:assets');

export const fieldResolvers = {
  AssetsQuery: {
    asset: (_, { assetId }) => {
      dlog('asset %s', assetId);
      return { assetId };
    },
  },
};

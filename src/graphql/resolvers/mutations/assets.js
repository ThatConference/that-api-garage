import debug from 'debug';

import assetStore from '../../../dataSources/cloudFirestore/asset';

const dlog = debug('that:api:assets:mutation:assets');

export const fieldResolvers = {
  AssetsMutation: {
    create: (_, { asset }, { dataSources: { firestore }, user }) => {
      dlog('create asset called');
      return assetStore(firestore).create({ user, newAsset: asset });
    },
    asset: (_, { id: assetId }) => {
      dlog('asset mutation on %s', assetId);
      return { assetId };
    },
    me: () => ({}),
  },
};

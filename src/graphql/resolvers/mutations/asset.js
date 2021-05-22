import debug from 'debug';
import assetStore from '../../../dataSources/cloudFirestore/asset';

const dlog = debug('that:api:assets:mutation:asset');

export const fieldResolvers = {
  AssetMutation: {
    update: ({ assetId }, { asset }, { dataSources: { firestore }, user }) => {
      dlog('update asset called on %s', assetId);
      return assetStore(firestore).update({ user, assetId, asset });
    },
  },
};

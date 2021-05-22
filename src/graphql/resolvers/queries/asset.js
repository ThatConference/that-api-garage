import debug from 'debug';
import assetStore from '../../../dataSources/cloudFirestore/asset';

const dlog = debug('that:api:assets:query:asset');

export const fieldResolvers = {
  AssetQuery: {
    get: ({ assetId }, __, { dataSources: { firestore } }) => {
      dlog('get %s', assetId);
      return assetStore(firestore).get(assetId);
    },
  },

  Asset: {
    __resolveReference({ id }, { dataSources: { assetLoader } }) {
      dlog('resolveReference %s', id);
      return assetLoader.load(id);
    },

    assignments: ({ id: assetId }, __, { dataSources: { firestore } }) => {
      dlog(`asset's assignments %s`, assetId);
      return assetStore(firestore).getAssetAssignments(assetId);
      // const assignments = await assetStore(firestore).getAssetAssignments(
      //   assetId,
      // );
      // const promises = assignments.map(a => {
      //   if (a.entityType === 'SESSION') {
      //     return sessionLoader
      //       .load(a.id)
      //       .then(session => ({ ...session, entityType: a.entityType }));
      //   }
      //   return a;
      // });
      // return Promise.all(promises);
    },

    createdBy: ({ createdBy }) => ({ id: createdBy }),

    lastUpdatedBy: ({ lastUpdatedBy }) => ({ id: lastUpdatedBy }),
  },
};

import debug from 'debug';
import affiliateStore from '../../../dataSources/cloudFirestore/affiliate';

const dlog = debug('that:api:garage:query:affiliates');

export const fieldResolvers = {
  AffiliatesQuery: {
    all: (_, __, { dataSources: { firestore } }) => {
      dlog('all called');
      return affiliateStore(firestore).getAll();
    },
    affiliate: (_, { affiliateId }, { dataSources: { firestore } }) => {
      dlog('call affiliate for %s', affiliateId);
      return { affiliateId };
    },
    // me
    // us
  },
};

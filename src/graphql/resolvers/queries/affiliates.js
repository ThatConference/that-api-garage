import debug from 'debug';
import affiliateStore from '../../../dataSources/cloudFirestore/affiliate';

const dlog = debug('that:api:garage:query:affiliates');

export const fieldResolvers = {
  AffiliatesQuery: {
    all: (_, __, { dataSources: { firestore } }) => {
      dlog('all called');
      return affiliateStore(firestore).getAll();
    },
    affiliate: (_, { affiliateId }) => {
      dlog('call affiliate for %s', affiliateId);
      return { affiliateId };
    },
    me: (_, __, { dataSources: { firestore }, user }) => {
      dlog('me affiliates called');
      return affiliateStore(firestore)
        .findAffiliateByRefId({
          referenceId: user.sub,
          affiliateType: 'MEMBER',
        })
        .then(d => {
          dlog('me:: %o', d);
          return d;
        });
    },
    // us
  },
};

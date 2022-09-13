import debug from 'debug';
import affiliateStore from '../../../dataSources/cloudFirestore/affiliate';

const dlog = debug('that:api:garage:mutation:affilates');

export const fieldResolvers = {
  AffiliatesMutation: {
    create: (_, { affiliate }, { dataSources: { firestore }, user }) => {
      dlog('creating new affiliate: %o', affiliate);
      return affiliateStore(firestore).create({
        affiliate,
        userId: user.sub,
      });
    },
    affiliate: (_, { affiliateId }) => {
      dlog('heading down affiliate path with id %s', affiliateId);
      return { affiliateId };
    },
  },
};

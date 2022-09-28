import debug from 'debug';
import affiliateStore from '../../../dataSources/cloudFirestore/affiliate';

const dlog = debug('that:api:garage:mutation:affilate');

export const fieldResolvers = {
  AffiliateMutation: {
    update: (
      { affiliateId },
      { affiliate },
      { dataSources: { firestore }, user },
    ) => {
      dlog('update id %s with %o', affiliateId, affiliate);
      return affiliateStore(firestore).update({
        affiliateId,
        affiliate,
        userId: user.sub,
      });
    },
    promotionCodes: ({ affiliateId }) => ({ affiliateId }),
    payments: ({ affiliateId }) => ({ affiliateId }),
  },
};

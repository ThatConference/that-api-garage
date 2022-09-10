import debug from 'debug';
import affiliateStore from '../../../dataSources/cloudFirestore/affiliate';

const dlog = debug('that:api:garage:query:affiliate');

export const fieldResolvers = {
  AffiliateQuery: {
    get: ({ affiliateId }, __, { dataSources: { firestore } }) => {
      dlog('getting affilite %s', affiliateId);
      return affiliateStore(firestore).get(affiliateId);
    },
  },
  Affiliate: {
    promotionCodes: (
      { id: affiliateId },
      { filter },
      { dataSources: { firestore } },
    ) => {
      dlog('query promotion codes for %', affiliateId);
      if (filter?.eventId) {
        return affiliateStore(firestore)
          .findAffiliatePromoCodeForEvent({
            affiliateId,
            eventId: filter.eventId,
            promoCodeType: filter.promoCodeType,
          })
          .then(r => (r ? [r] : []));
      }

      return affiliateStore(firestore).getAllAffiliatePromoCodes(affiliateId);
    },
  },
};

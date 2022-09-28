import debug from 'debug';
import affiliateStore from '../../../dataSources/cloudFirestore/affiliate';
import promoCodeStore from '../../../dataSources/cloudFirestore/affiliatePromoCode';
import paymentStore from '../../../dataSources/cloudFirestore/affiliatePayment';

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
        return promoCodeStore(firestore)
          .findAffiliatePromoCodeForEvent({
            affiliateId,
            eventId: filter.eventId,
            promoCodeType: filter.promoCodeType,
          })
          .then(r => (r ? [r] : []));
      }

      return promoCodeStore(firestore).getAllAffiliatePromoCodes(affiliateId);
    },
    referrals: (
      affiliate,
      { eventId },
      { dataSources: { firestore }, user },
    ) => {
      dlog('finding affiliate referrals for %s', user.sub);
    },
    payments: (affiliate, __, { dataSources: { firestore }, user }) => {
      dlog('finding affiliate payments for %s', user.sub);
      if (!affiliate) {
        dlog('user not an affilaite');
        return [];
      }
      return paymentStore(firestore).getAllAffiliatePayments({
        affiliateId: affiliate.id,
      });
    },
  },
};

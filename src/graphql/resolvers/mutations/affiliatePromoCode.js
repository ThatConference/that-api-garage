import debug from 'debug';
import promoCodeStore from '../../../dataSources/cloudFirestore/affiliatePromoCode';

const dlog = debug('that:api:garage:mutation:affilatePromoCode');

export const fieldResolvers = {
  AffiliatePromoCodeMutation: {
    update: (
      { affiliateId, promoCodeId },
      { promotionCode },
      { dataSources: { firestore } },
    ) => {
      dlog('update promotion code');
      return promoCodeStore(firestore).update({
        affiliateId,
        promoCodeId,
        promotionCode,
      });
    },
    delete: (
      { affiliateId, promoCodeId },
      __,
      { dataSources: { firestore } },
    ) => {
      dlog('delete promoCode %s for affiliate %s', promoCodeId, affiliateId);
      return promoCodeStore(firestore).remove({ affiliateId, promoCodeId });
    },
  },
};

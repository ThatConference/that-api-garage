import debug from 'debug';
import promoCodeStore from '../../../dataSources/cloudFirestore/affiliatePromoCode';

const dlog = debug('that:api:garage:mutation:affilatePromoCodes');

export const fieldResolvers = {
  AffiliatePromoCodesMutation: {
    create: (
      { affiliateId },
      { promotionCode },
      { dataSources: { firestore } },
    ) => {
      dlog(
        'create promo code for affiliate %s, %o',
        affiliateId,
        promotionCode,
      );
      return promoCodeStore(firestore).create({ affiliateId, promotionCode });
    },
    promotionCode: ({ affiliateId }, { promoCodeId }) => {
      dlog('mutate promotion code %s, affiliate %s', promoCodeId, affiliateId);
      return { affiliateId, promoCodeId };
    },
  },
};

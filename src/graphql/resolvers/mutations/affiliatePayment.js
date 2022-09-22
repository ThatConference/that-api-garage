import debug from 'debug';
import paymentStore from '../../../dataSources/cloudFirestore/affiliatePayment';

const dlog = debug('that:api:garage:mutation:affilatePayment');

export const fieldResolvers = {
  AffiliatePaymentMutation: {
    update: (
      { affiliateId, paymentId },
      { payment },
      { dataSources: { firestore }, user },
    ) => {
      dlog('updating payment %s for affiliate %s', paymentId, affiliateId);
      return paymentStore(firestore).update({
        affiliateId,
        paymentId,
        payment,
        userId: user.sub,
      });
    },
    delete: ({ affiliateId, paymentId }, _, { dataSources: { firestore } }) => {
      dlog('deleting payment %s for affiliate %s', paymentId, affiliateId);
      return paymentStore(firestore).remove({ affiliateId, paymentId });
    },
  },
};

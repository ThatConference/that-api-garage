import debug from 'debug';
import paymentStore from '../../../dataSources/cloudFirestore/affiliatePayment';

const dlog = debug('that:api:garage:mutation:affilatePayments');

export const fieldResolvers = {
  AffiliatePaymentsMutation: {
    create: ({ affiliateId }, { payment }, { dataSources: { firestore } }) => {
      dlog('creating payment for affiliate %s: %o', affiliateId, payment);
      return paymentStore(firestore).create({ affiliateId, payment });
    },
    payment: ({ affiliateId }, { paymentId }) => {
      dlog('payment path for %s and payment %s', affiliateId, paymentId);
      return { affiliateId, paymentId };
    },
  },
};

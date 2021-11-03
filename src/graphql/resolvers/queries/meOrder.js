import debug from 'debug';
import orderStore from '../../../dataSources/cloudFirestore/order';
import getPortalUrlFromMemberId from '../../../lib/stripe/getPortalUrlFromMemberId';
import constants from '../../../constants';

const dlog = debug('that:api:garage:query:MeOrder');

export const fieldResolvers = {
  MeOrder: {
    __resolveReference({ id }, { dataSources: { orderLoader } }) {
      dlog('resolve reference');
      return orderLoader.load(id);
    },
    member: ({ member: id }) => ({ id }),
    partner: ({ partner: id }) => (id ? { id } : null),
    event: ({ event: id }) => (id ? { id } : null),
    createdBy: ({ createdBy: id }, __, { dataSources: { memberLoader } }) =>
      memberLoader.load(id),
    lastUpdatedBy: (
      { lastUpdatedBy: id },
      __,
      { dataSources: { memberLoader } },
    ) => memberLoader.load(id),
    orderAllocations: ({ id: orderId }, __, { dataSources: { firestore } }) => {
      dlog('order allocations for an order: %s', orderId);
      return orderStore(firestore).findOrderAllocations({ orderId });
    },
    receipt: (
      { member: memberId, stripeMode, stripePaymentIntentReceiptUrl },
      __,
      { dataSources: { firestore } },
    ) => {
      dlog('Order for %s', memberId);
      if (stripeMode === constants.STRIPE.CHECKOUT_MODE.PAYMENT)
        return stripePaymentIntentReceiptUrl;
      return getPortalUrlFromMemberId({ memberId, firestore });
    },
    // orders are all defaulted to 'REGUAR' type orders
    orderType: ({ orderType }) => orderType || 'REGULAR',
  },
};

import debug from 'debug';
import orderStore from '../../../dataSources/cloudFirestore/order';

const dlog = debug('that:api:garage:query:orders');

export const fieldResolvers = {
  OrdersQuery: {
    all: (
      _,
      { pageSize = 20, cursor, eventId },
      { dataSources: { firestore } },
    ) => {
      dlog('all called with page size %d, eventId %s', pageSize, eventId);
      // No max page size
      return orderStore(firestore).getPaged({
        pageSize,
        cursor,
        eventId,
      });
    },

    order: (_, { orderId }, { dataSources: { firestore } }) => {
      dlog('order called');
      return orderStore(firestore).get(orderId);
    },

    me: (_, __, { user }) => {
      dlog('me called');
      return { user };
    },
  },
};

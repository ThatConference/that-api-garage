import debug from 'debug';
import orderStore from '../../../dataSources/cloudFirestore/order';

const dlog = debug('that:api:garage:mutation:OrdersMutation');

export const fieldResolvers = {
  OrdersMutation: {
    create: (_, { order }, { dataSources: { firestore }, user }) => {
      dlog('create called');
      return orderStore(firestore).create({ newOrder: order, user });
    },
    order: (_, { orderId }) => {
      dlog('order called with id %s', orderId);
      return { orderId };
    },
    me: (_, __, { user }) => {
      dlog('checkout called');
      return { memberId: user.sub };
    },
  },
};

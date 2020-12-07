import debug from 'debug';
import orderStore from '../../../dataSources/cloudFirestore/order';

const dlog = debug('that:api:garage:mutation:OrderMutation');

export const fieldResolvers = {
  OrderMutation: {
    update: ({ orderId }, { order }, { dataSources: { firestore }, user }) => {
      dlog('update order %s', orderId);
      return orderStore(firestore).update({ orderId, upOrder: order, user });
    },
  },
};
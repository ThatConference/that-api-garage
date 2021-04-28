import debug from 'debug';
import orderStore from '../../../dataSources/cloudFirestore/order';

const dlog = debug('that:api:garage:mutation:order');

export const fieldResolvers = {
  OrderMutation: {
    update: ({ orderId }, { order }, { dataSources: { firestore }, user }) => {
      dlog('update order %s', orderId);
      return orderStore(firestore).update({ orderId, upOrder: order, user });
    },
    orderAllocation: (_, { orderAllocationId }) => {
      dlog('OrderMutation, orderallocation called, %s', orderAllocationId);
      return { orderAllocationId };
    },
  },
};

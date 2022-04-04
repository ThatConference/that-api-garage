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
    setRefunded: ({ orderId }, __, { dataSources: { firestore }, user }) => {
      dlog('setRefunded called on order %s', orderId);
      return orderStore(firestore).updateStatusOrderAndOrderAllocations({
        orderId,
        newStatus: 'REFUNDED',
        user,
      });
    },
    setCancelled: ({ orderId }, __, { dataSources: { firestore }, user }) => {
      dlog('setCancelled called on order %s', orderId);
      return orderStore(firestore).updateStatusOrderAndOrderAllocations({
        orderId,
        newStatus: 'CANCELLED',
        user,
      });
    },
  },
};

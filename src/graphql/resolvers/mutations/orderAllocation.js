import debug from 'debug';
import orderStore from '../../../dataSources/cloudFirestore/order';

const dlog = debug(`that:api:garage:mutation:OrderAllocationMutation`);

export const fieldResolvers = {
  OrderAllocationMutation: {
    // order allocation
    allocateTo: () => {
      dlog('allocateTo called');
      throw new Error('Not Implemented Yet');
    },
    setRefunded: (
      { orderAllocationId },
      __,
      { dataSources: { firestore }, user },
    ) => {
      dlog('setRefunded called on %s', orderAllocationId);
      const updateAllocation = {
        allocatedTo: null,
        isAllocated: false,
        status: 'REFUNDED',
      };
      return orderStore(firestore)
        .updateOrderAllocation({
          orderAllocationId,
          updateAllocation,
          user,
        })
        .then(({ id }) => orderStore(firestore).getOrderAllocation(id));
    },
    setCancelled: (
      { orderAllocationId },
      __,
      { dataSources: { firestore }, user },
    ) => {
      dlog('setCancelled called on %s', orderAllocationId);
      const updateAllocation = {
        allocatedTo: null,
        isAllocated: false,
        status: 'CANCELLED',
      };
      return orderStore(firestore)
        .updateOrderAllocation({
          orderAllocationId,
          updateAllocation,
          user,
        })
        .then(({ id }) => orderStore(firestore).getOrderAllocation(id));
    },
  },
};

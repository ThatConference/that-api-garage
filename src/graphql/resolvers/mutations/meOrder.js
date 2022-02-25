import debug from 'debug';
import orderStore from '../../../dataSources/cloudFirestore/order';
import { AllocationError } from '../../../lib/errors';

const dlog = debug('that:api:garage:mutation:order');

export const fieldResolvers = {
  MeOrderMutation: {
    orderAllocation: (
      { order },
      { orderAllocationId },
      { dataSources: { firestore } },
    ) => {
      dlog('meOrderMutation, orderAllocation called, %s', orderAllocationId);
      return orderStore(firestore)
        .findOrderAllocationForOrder({
          orderId: order.id,
          orderAllocationId,
        })
        .then(orderAllocation => {
          if (!orderAllocation)
            throw new AllocationError(
              `OrderAllocation doesn't exist on order. Unable to mutate`,
            );
          dlog('OrderAllocation: %o', orderAllocation);

          return { order, orderAllocation };
        });
    },
  },
};

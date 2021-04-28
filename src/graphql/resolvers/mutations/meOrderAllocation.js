import debug from 'debug';
import { AllocationError } from '../../../lib/errors';
import memberStore from '../../../dataSources/cloudFirestore/member';
import orderStore from '../../../dataSources/cloudFirestore/order';

const dlog = debug('that:api:garage:mutation:meOrderAllocation');

export const fieldResolvers = {
  MeOrderAllocationMutation: {
    allocateTo: async (
      { order, orderAllocationId },
      { email },
      { dataSources: { firestore }, user },
    ) => {
      dlog('allocateTo called:: %s, %s', email);
      const [memberToAllocate, orderAllocation] = await Promise.all([
        memberStore(firestore).findByEmail(email),
        orderStore(firestore).findOrderAllocationForOrder({
          orderId: order.id,
          orderAllocationId,
        }),
      ]);
      dlog('memberToAllocate:: %o', memberToAllocate);
      dlog('orderAllocation:: %o', orderAllocationId);
      if (memberToAllocate.length < 1)
        throw new AllocationError(
          `Member not found with email address ${email}`,
        );
      if (memberToAllocate.length > 1)
        throw new AllocationError(
          `Multiple members with email address ${email}. Contact us to allocate member`,
        );
      if (!orderAllocation)
        throw new AllocationError(`OrderAllocation requested not found`);
      const updateAllocation = {
        allocatedTo: memberToAllocate[0].id,
        isAllocated: true,
      };
      return orderStore(firestore)
        .updateOrderAllocation({
          orderAllocationId,
          updateAllocation,
          user,
        })
        .then(() => true);
    },
  },
};

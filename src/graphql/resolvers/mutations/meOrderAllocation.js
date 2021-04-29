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
      const result = {
        result: false,
        message: 'not set',
        allocatedTo: null,
      };
      if (memberToAllocate.length < 1) {
        result.message = `Member not found with email address ${email}`;
      } else if (memberToAllocate.length > 1) {
        result.message = `Multiple members with email address ${email}. Contact us to allocate member`;
      } else {
        result.result = true;
        result.message = 'ok';
        result.allocatedTo = {
          ...memberToAllocate[0],
          __typename: memberToAllocate[0].canFeature
            ? 'PublicProfile'
            : 'PrivateProfile',
        };
      }
      if (!orderAllocation)
        throw new AllocationError(`OrderAllocation requested not found`);

      if (result.result === false) return result;

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
        .then(() => result);
    },
  },
};

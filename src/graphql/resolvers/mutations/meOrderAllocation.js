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
      {
        dataSources: {
          firestore,
          events: { orderAllocationEvents },
        },
        user,
      },
    ) => {
      dlog('allocateTo called:: %s, %s', email);
      const result = {
        result: false,
        message: 'not set',
        allocatedTo: null,
      };
      if (!order.status || order.status !== 'COMPLETE') {
        result.message = `Unable to allocate ticket, the order is not complete (${order.status})`;
        return result;
      }

      const [membersResult, orderAllocation] = await Promise.all([
        memberStore(firestore).findByEmail(email),
        orderStore(firestore).findOrderAllocationForOrder({
          orderId: order.id,
          orderAllocationId,
        }),
      ]);
      dlog('membersResult:: %o', membersResult);
      dlog('orderAllocation:: %o', orderAllocationId);
      let memberToAllocate;
      if (membersResult.length < 1) {
        result.message = `Member not found with email address ${email}`;
      } else if (membersResult.length > 1) {
        result.message = `Multiple members with email address ${email}. Contact us to allocate member`;
      } else if (orderAllocation?.hasCheckedIn === true) {
        result.message = `Order Allocation checked-in, it cannot be re-allocated`;
      } else {
        [memberToAllocate] = membersResult;
        result.result = true;
        result.message = 'ok';
        result.allocatedTo = {
          ...memberToAllocate,
          __typename: memberToAllocate.canFeature
            ? 'PublicProfile'
            : 'PrivateProfile',
        };
      }
      if (!orderAllocation)
        throw new AllocationError(`OrderAllocation requested not found`);

      if (result.result === false) return result;

      const updateAllocation = {
        allocatedTo: memberToAllocate.id,
        isAllocated: true,
        hasCompletedQuestions: false,
        questionsReference: 'not sent',
      };
      return orderStore(firestore)
        .updateOrderAllocation({
          orderAllocationId,
          updateAllocation,
          user,
        })
        .then(() => {
          orderAllocationEvents.emit('productAllocatedTo', {
            memberTo: memberToAllocate,
            orderAllocation,
            firestore,
          });
          return result;
        });
    },
  },
};

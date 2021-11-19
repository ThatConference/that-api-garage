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
        questionsReference: null,
        tshirtSize: null,
        hoodieSize: null,
        dietaryRequirement: null,
        dietaryOther: null,
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
    saveQuestionResponses: async (
      { order, orderAllocationId },
      { responses },
      { dataSources: { firestore }, user },
    ) => {
      dlog('saveQuestionResponses called: %o', responses);
      const result = { success: false, message: '' };
      const orderAllocation = await orderStore(
        firestore,
      ).findOrderAllocationForOrder({
        orderId: order.id,
        orderAllocationId,
      });
      if (!orderAllocation) {
        result.message = `Allocation Id ${orderAllocationId} is not part of provided order`;
        return result;
      }
      /*
       * The following block of code will validate that an activity exists
       * to set a t-shirt or hoodie size on an allocation. It was decided
       * to not do this check, though we'll keep this code here if we wish to
       * add the logic back
       */
      // const product = await productStore(firestore).get(
      //   orderAllocation.product,
      // );
      // const { eventActivities } = product;
      // if (responses.tshirtSize && !eventActivities.includes('T_SHIRT')) {
      //   result.message = `Product ${product.name} doesn't include a t-shirt`;
      // } else if (responses.hoodieSize && !eventActivities.includes('HOODIE')) {
      //   result.message = `Product ${product.name} doesn't include a Hoodie`;
      // }
      // if (result.message !== '') return result;

      const oaUpdate = {
        tshirtSize: responses.tshirtSize || null,
        hoodieSize: responses.hoodieSize || null,
        dietaryRequirement: responses.dietaryRequirement || null,
        dietaryOther: responses.dietaryOther || null,
        hasCompletedQuestions: true,
      };

      await orderStore(firestore).updateOrderAllocation({
        orderAllocationId,
        updateAllocation: oaUpdate,
        user,
      });

      result.success = true;
      result.message = 'Questions updated successfully';
      return result;
    },
  },
};

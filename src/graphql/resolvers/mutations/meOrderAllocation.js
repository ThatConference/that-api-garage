import debug from 'debug';
import memberStore from '../../../dataSources/cloudFirestore/member';
import orderStore from '../../../dataSources/cloudFirestore/order';
import constants from '../../../constants';
import saveOaQuestionResponses from './shared/saveOaQuestionResponses';
import setOaEnrollmentStatus from './shared/setOaEnrollmentStatus';

const dlog = debug('that:api:garage:mutation:meOrderAllocation');

function sendGraphCdnEvent({ graphCdnEvents, orderAllocationId }) {
  graphCdnEvents.emit(
    constants.GRAPHCDN.EVENT_NAME.PURGE,
    constants.GRAPHCDN.PURGE.ORDER_ALLOCATION,
    orderAllocationId,
  );
}

export const fieldResolvers = {
  MeOrderAllocationMutation: {
    allocateTo: async (
      { order, orderAllocation },
      { email },
      {
        dataSources: {
          firestore,
          events: { orderAllocationEvents, graphCdnEvents },
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

      const membersResult = await memberStore(firestore).findByEmail(email);

      dlog('membersResult:: %o', membersResult);
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
      if (result.result === false) return result;

      // Reset fields when allocating to new member
      const updateAllocation = {
        allocatedTo: memberToAllocate.id,
        isAllocated: true,
        checkedInAt: null,
        checkedInBy: null,
        hasCheckedIn: null,
        hasCompletedQuestions: false,
        questionsReference: null,
        tshirtSize: null,
        hoodieSize: null,
        dietaryRequirement: null,
        dietaryOther: null,
      };
      return orderStore(firestore)
        .updateOrderAllocation({
          orderAllocationId: orderAllocation.id,
          updateAllocation,
          user,
        })
        .then(() => {
          orderAllocationEvents.emit('productAllocatedTo', {
            memberTo: memberToAllocate,
            orderAllocation,
            firestore,
          });
          sendGraphCdnEvent({
            graphCdnEvents,
            orderAllocationId: orderAllocation.id,
          });
          return result;
        });
    },
    saveQuestionResponses: (
      { orderAllocation },
      { responses },
      {
        dataSources: {
          firestore,
          events: { graphCdnEvents },
        },
        user,
      },
    ) => {
      dlog('saveQuestionResponses called: %o', responses);

      return saveOaQuestionResponses({
        orderAllocation,
        responses,
        firestore,
        user,
      }).then(result => {
        sendGraphCdnEvent({
          graphCdnEvents,
          orderAllocationId: orderAllocation.id,
        });

        return result;
      });
    },
    setEnrollmentStatus: (
      { orderAllocation },
      { status },
      {
        dataSources: {
          firestore,
          events: { graphCdnEvents },
        },
        user,
      },
    ) => {
      dlog('setEnrollmentStatus called %s, %s', orderAllocation.id, status);

      return setOaEnrollmentStatus({
        orderAllocationId: orderAllocation.id,
        status,
        firestore,
        user,
      }).then(result => {
        sendGraphCdnEvent({
          graphCdnEvents,
          orderAllocationId: orderAllocation.id,
        });

        return result;
      });
    },
  },
};

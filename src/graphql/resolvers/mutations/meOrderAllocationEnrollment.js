import debug from 'debug';
import constants from '../../../constants';
import saveOaQuestionResponses from './shared/saveOaQuestionResponses';
import setOaEnrollmentStatus from './shared/setOaEnrollmentStatus';

const dlog = debug('that:api:garage:mutation:meOrderAllocationEnrollment');

function sendGraphCdnEvent({ graphCdnEvents, orderAllocationId }) {
  graphCdnEvents.emit(
    constants.GRAPHCDN.EVENT_NAME.PURGE,
    constants.GRAPHCDN.PURGE.ORDER_ALLOCATION,
    orderAllocationId,
  );
}

export const fieldResolvers = {
  MeOrderAllocationEnrollmentMutation: {
    saveQuestionResponses: async (
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
      dlog(
        'saveQuestionResponses called, %s, %o',
        orderAllocation.id,
        responses,
      );

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

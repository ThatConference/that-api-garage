import debug from 'debug';
import orderStore from '../../../dataSources/cloudFirestore/order';

const dlog = debug('that:api:garage:mutation:MeOrders');

export const fieldResolvers = {
  MeOrdersMutation: {
    checkout: ({ memberId }) => {
      dlog('me checkout called');
      return { memberId };
    },
    markQuestionsComplete: (
      { memberId },
      { eventId },
      { dataSources: { firestore } },
    ) => {
      dlog('markQuestionsComplete member: %s, event: %s', memberId, eventId);
      return orderStore(firestore).markMyAllocationsQuestionsComplete({
        memberId,
        eventId,
      });
    },
  },
};

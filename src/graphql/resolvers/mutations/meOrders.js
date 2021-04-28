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
    order: async (_, { orderId }, { dataSources: { firestore }, user }) => {
      dlog('order called, id: %s', orderId);
      const order = await orderStore(firestore).getMe({ user, orderId });
      if (!order) throw new Error(`Invalid orderId. Order not found for user`);
      return { order };
    },
  },
};

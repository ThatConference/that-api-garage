import debug from 'debug';
import * as Sentry from '@sentry/node';
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
      { eventId, orderReference },
      { dataSources: { firestore } },
    ) => {
      dlog(
        'markQuestionsComplete member: %s, event: %s, orderReference: %s',
        memberId,
        eventId,
        orderReference,
      );
      if (!orderReference || (orderReference && orderReference.length < 9))
        return orderStore(firestore).markMyAllocationsQuestionsComplete({
          memberId,
          eventId,
          orderReference: orderReference || 'not sent',
        });

      const updateOA = {
        hasCompletedQuestions: true,
        questionsReference: orderReference,
      };
      // if orderReference is > 8 it is probably a Order Allocation id
      // we verify it is, the memeber is allocated to it, then update that the
      // questions are complete.
      return orderStore(firestore)
        .getOrderAllocation(orderReference)
        .then(allocation => {
          if (!allocation) return false;
          if (allocation.allocatedTo !== memberId) {
            Sentry.captureMessage(
              'order allocation questions completed by member not assigned to order allocation',
              { memberId, orderAllocationId: orderReference, eventId },
              Sentry.Severity.Warning,
            );
            return false;
          }
          return orderStore(firestore)
            .updateOrderAllocation({
              orderAllocationId: orderReference,
              updateAllocation: updateOA,
              user: { sub: memberId },
            })
            .then(() => true);
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

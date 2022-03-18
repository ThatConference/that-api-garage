import debug from 'debug';
import orderStore from '../../../dataSources/cloudFirestore/order';

const dlog = debug('that:api:garage:query:eventAdmin');

export const fieldResolvers = {
  EventAdminQuery: {
    orderAllocations: (
      { eventId },
      { filter },
      { dataSources: { firestore } },
    ) => {
      dlog('EventAdmin.orderAllocations called for event %s', eventId);
      dlog('EventAdmin.orderAllocation filter # %O', filter);
      return orderStore(firestore).findOrderAllocationsForEvent({
        eventId,
        enrollmentStatusFilter: filter,
      });
    },
    orders: ({ eventId }, __, { dataSources: { firestore } }) => {
      dlog('EventAdmin.orders called for event %s', eventId);
      return orderStore(firestore).findByEvent(eventId);
    },
  },
};

import debug from 'debug';
import orderStore from '../../../dataSources/cloudFirestore/order';

const dlog = debug('that:api:garage:query:eventAdmin');

export const fieldResolvers = {
  EventAdminQuery: {
    orderAllocations: ({ eventId }, __, { dataSources: { firestore } }) => {
      dlog('EventAdmin.orderAllocations called for event %s', eventId);
      return orderStore(firestore).findOrderAllocationsForEvent({ eventId });
    },
  },
};

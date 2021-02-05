import debug from 'debug';
import orderStore from '../../../dataSources/cloudFirestore/order';

const dlog = debug('that:api:garage:query:MeOrderQuery');

export const fieldResolvers = {
  MeOrderQuery: {
    all: (
      { user },
      { pageSize = 20, cursor },
      { dataSources: { firestore } },
    ) => {
      dlog('me all called with page size %d', pageSize);
      if (pageSize > 100)
        throw new Error('Max page size of 100 exceeded, %d', pageSize);
      return orderStore(firestore).getPagedMe({ user, pageSize, cursor });
    },
    order: ({ user }, { orderId }, { dataSources: { firestore } }) => {
      dlog(`me (${user.sub}) order called for %s`, orderId);
      return orderStore(firestore).getMe({ user, orderId });
    },
    portal: ({ user }) => {
      dlog('portal called');
      return { user };
    },
  },
};

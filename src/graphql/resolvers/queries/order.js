import debug from 'debug';

const dlog = debug('that:api:garage:query:Order');

export const fieldResolvers = {
  Order: {
    __resolveReference({ id }, { dataSources: { orderLoader } }) {
      dlog('resolve reference');
      return orderLoader.load(id);
    },
    member: ({ member: id }) => ({ id }),
    partner: ({ partner: id }) => (id ? { id } : null),
    event: ({ event: id }) => (id ? { id } : null),
    createdBy: ({ createdBy: id }) => ({ id }),
    lastUpdatedBy: ({ lastUpdatedBy: id }) => ({ id }),
  },
};

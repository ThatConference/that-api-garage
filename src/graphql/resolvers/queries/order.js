import debug from 'debug';

const dlog = debug('that:api:garage:query:Order');

export const fieldResolvers = {
  Order: {
    member: ({ member: id }) => ({ id }),
    partner: ({ partner: id }) => ({ id }),
    event: ({ event: id }) => ({ id }),
    products: () => {},
    createdBy: ({ createdBy: id }) => ({ id }),
    lastUpdatedBy: ({ lastUpdatedBy: id }) => ({ id }),
  },
};

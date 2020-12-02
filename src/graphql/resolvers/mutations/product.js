import debug from 'debug';

const dlog = debug('that:api:garbage:mutation:ProductMutation');

export const fieldResolvers = {
  ProductMutation: {
    update: ({ productId }) => {
      dlog('update called for %s', productId);
      return { productId };
    },
  },
};

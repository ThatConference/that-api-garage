import debug from 'debug';

const dlog = debug('that:api:garage:mutation:products');

export const fieldResolvers = {
  ProductsMutation: {
    create: () => {
      dlog('create called');
      return {};
    },
    product: (_, { productId }) => {
      dlog('product called for %s', productId);
      return { productId };
    },
  },
};

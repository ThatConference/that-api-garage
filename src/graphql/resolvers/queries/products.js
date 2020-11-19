import debug from 'debug';

const dlog = debug('that:api:garage:query:ProductsQuery');

export const fieldResolvers = {
  ProductsQuery: {
    all: () => {
      dlog('all called');
      return {};
    },

    product: () => {
      dlog('product called');
      return {};
    },
  },
};

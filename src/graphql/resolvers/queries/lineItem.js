import debug from 'debug';

const dlog = debug('that:api:garage:query:LineItem');

export const fieldResolvers = {
  LineItem: {
    product: (
      { product: productId },
      __,
      { dataSources: { productLoader } },
    ) => {
      dlog('product line item %s', productId);
      return productLoader.load(productId);
    },
  },
};

import debug from 'debug';
import productStore from '../../../dataSources/cloudFirestore/product';

const dlog = debug('that:api:garage:query:ProductsQuery');

export const fieldResolvers = {
  ProductsQuery: {
    all: () => {
      dlog('all called');
      return {};
    },

    product: (_, { productId }, { dataSources: { firestore } }) => {
      dlog('product called');
      return productStore(firestore).get(productId);
      // return { productId };
    },
  },
};

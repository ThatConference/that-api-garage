import debug from 'debug';
import productStore from '../../../dataSources/cloudFirestore/product';

const dlog = debug('that:api:garage:query:ProductsQuery');

export const fieldResolvers = {
  ProductsQuery: {
    all: (_, { pageSize = 20, cursor }, { dataSources: { firestore } }) => {
      dlog('all called with page size %d', pageSize);
      return productStore(firestore).getPaged({
        pageSize,
        cursor,
      });
    },

    product: (_, { productId }, { dataSources: { firestore } }) => {
      dlog('product called');
      return productStore(firestore).get(productId);
      // return { productId };
    },
  },
};

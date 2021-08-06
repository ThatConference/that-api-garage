import debug from 'debug';
import orderStore from '../../../dataSources/cloudFirestore/order';
import productStore from '../../../dataSources/cloudFirestore/product';

const dlog = debug('that:api:garbage:mutation:product');

export const fieldResolvers = {
  ProductMutation: {
    update: ({ productId }) => {
      dlog('update called for %s', productId);
      return { productId };
    },
    delete: async ({ productId }, __, { dataSources: { firestore } }) => {
      dlog('delete called for product %s', productId);
      const result = {
        result: true,
        message: 'ok',
        productId,
      };
      const allocationCount = await orderStore(
        firestore,
      ).orderAllocationCountWithProduct(productId);
      if (allocationCount > 0) {
        result.result = false;
        result.message = `Product ${productId} exists on order allocations. Cannot delete`;
        return result;
      }

      const delResult = await productStore(firestore).remove(productId);
      if (!delResult.writeTime) {
        result.result = false;
        result.message = `Product ${productId} failed, no write result received.`;
        return result;
      }

      return result;
    },
  },
};

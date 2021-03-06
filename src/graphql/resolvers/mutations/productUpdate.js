import debug from 'debug';

import productStore from '../../../dataSources/cloudFirestore/product';

const dlog = debug('that:api:garage:mutation:ProductUpdate');

export const fieldResolvers = {
  ProductUpdate: {
    ticket: (
      { productId },
      { ticket },
      { dataSources: { firestore }, user },
    ) => {
      dlog('update ticket called');
      return productStore(firestore).update({
        productId,
        newProduct: ticket,
        userId: user.sub,
      });
    },

    membership: (
      { productId },
      { membership },
      { dataSources: { firestore }, user },
    ) => {
      dlog('update membership called');
      return productStore(firestore).update({
        productId,
        newProduct: membership,
        userId: user.sub,
      });
    },

    partnership: (
      { productId },
      { partnership },
      { dataSources: { firestore }, user },
    ) => {
      dlog('update partnership called');
      return productStore(firestore).update({
        productId,
        newProduct: partnership,
        userId: user.sub,
      });
    },

    coupon: () => {
      throw new Error('Not implemented yet');
    },

    food: ({ productId }, { food }, { dataSources: { firestore }, user }) => {
      dlog('update food called');
      return productStore(firestore).update({
        productId,
        newProduct: food,
        userId: user.sub,
      });
    },

    training: (
      { productId },
      { training },
      { dataSources: { firestore }, user },
    ) => {
      dlog('update training called');
      return productStore(firestore).update({
        productId,
        newProduct: training,
        userId: user.sub,
      });
    },

    family: (
      { productId },
      { family },
      { dataSources: { firestore }, user },
    ) => {
      dlog('update family called');
      return productStore(firestore).update({
        productId,
        newProduct: family,
        userId: user.sub,
      });
    },
  },
};

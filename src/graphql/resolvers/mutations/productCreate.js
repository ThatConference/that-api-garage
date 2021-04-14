import debug from 'debug';

import productStore from '../../../dataSources/cloudFirestore/product';

const dlog = debug('that:api:garage:mutation:ProductCreate');

export const fieldResolvers = {
  ProductCreate: {
    ticket: (_, { ticket }, { dataSources: { firestore }, user }) => {
      dlog('create ticket called');
      const newProduct = ticket;
      newProduct.type = 'TICKET';
      return productStore(firestore).create({
        newProduct,
        userId: user.sub,
      });
    },

    membership: (_, { membership }, { dataSources: { firestore }, user }) => {
      dlog('create membership called');
      const newProduct = membership;
      newProduct.type = 'MEMBERSHIP';
      return productStore(firestore).create({
        newProduct,
        userId: user.sub,
      });
    },

    partnership: (_, { partnership }, { dataSources: { firestore }, user }) => {
      dlog('create partnership called');
      const newProduct = partnership;
      newProduct.type = 'PARTNERSHIP';
      return productStore(firestore).create({
        newProduct,
        userId: user.sub,
      });
    },

    coupon: () => {
      throw new Error('Not implemented yet');
    },

    food: (_, { food }, { dataSources: { firestore }, user }) => {
      dlog('create food called');
      const newProduct = food;
      newProduct.type = 'FOOD';
      return productStore(firestore).create({
        newProduct,
        userId: user.sub,
      });
    },

    training: (_, { training }, { dataSources: { firestore }, user }) => {
      dlog('create training called');
      const newProduct = training;
      newProduct.type = 'TRAINING';
      return productStore(firestore).create({
        newProduct,
        userId: user.sub,
      });
    },

    family: (_, { family }, { dataSources: { firestore }, user }) => {
      dlog('create family called');
      const newProduct = family;
      newProduct.type = 'FAMILY';
      return productStore(firestore).create({
        newProduct,
        userId: user.sub,
      });
    },
  },
};

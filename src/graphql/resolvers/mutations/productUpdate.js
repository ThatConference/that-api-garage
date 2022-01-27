import debug from 'debug';

import productStore from '../../../dataSources/cloudFirestore/product';
import constants from '../../../constants';

const dlog = debug('that:api:garage:mutation:ProductUpdate');

function sendGraphCdnEvent({ graphCdnEvents, productId }) {
  graphCdnEvents.emit(
    constants.GRAPHCDN.EVENT_NAME.PURGE,
    constants.GRAPHCDN.PURGE.PRODUCT,
    productId,
  );
}

export const fieldResolvers = {
  ProductUpdate: {
    ticket: (
      { productId },
      { ticket },
      {
        dataSources: {
          firestore,
          events: { graphCdnEvents },
        },
        user,
      },
    ) => {
      dlog('update ticket called');
      return productStore(firestore)
        .update({
          productId,
          newProduct: ticket,
          userId: user.sub,
        })
        .then(result => {
          sendGraphCdnEvent({ graphCdnEvents, productId });
          return result;
        });
    },

    membership: (
      { productId },
      { membership },
      {
        dataSources: {
          firestore,
          events: { graphCdnEvents },
        },
        user,
      },
    ) => {
      dlog('update membership called');
      return productStore(firestore)
        .update({
          productId,
          newProduct: membership,
          userId: user.sub,
        })
        .then(result => {
          sendGraphCdnEvent({ graphCdnEvents, productId });
          return result;
        });
    },

    partnership: (
      { productId },
      { partnership },
      {
        dataSources: {
          firestore,
          events: { graphCdnEvents },
        },
        user,
      },
    ) => {
      dlog('update partnership called');
      return productStore(firestore)
        .update({
          productId,
          newProduct: partnership,
          userId: user.sub,
        })
        .then(result => {
          sendGraphCdnEvent({ graphCdnEvents, productId });
          return result;
        });
    },

    coupon: () => {
      throw new Error('Not implemented yet');
    },

    food: (
      { productId },
      { food },
      {
        dataSources: {
          firestore,
          events: { graphCdnEvents },
        },
        user,
      },
    ) => {
      dlog('update food called');
      return productStore(firestore)
        .update({
          productId,
          newProduct: food,
          userId: user.sub,
        })
        .then(result => {
          sendGraphCdnEvent({ graphCdnEvents, productId });
          return result;
        });
    },

    training: (
      { productId },
      { training },
      {
        dataSources: {
          firestore,
          events: { graphCdnEvents },
        },
        user,
      },
    ) => {
      dlog('update training called');
      return productStore(firestore)
        .update({
          productId,
          newProduct: training,
          userId: user.sub,
        })
        .then(result => {
          sendGraphCdnEvent({ graphCdnEvents, productId });
          return result;
        });
    },

    family: (
      { productId },
      { family },
      {
        dataSources: {
          firestore,
          events: { graphCdnEvents },
        },
        user,
      },
    ) => {
      dlog('update family called');
      return productStore(firestore)
        .update({
          productId,
          newProduct: family,
          userId: user.sub,
        })
        .then(result => {
          sendGraphCdnEvent({ graphCdnEvents, productId });
          return result;
        });
    },
  },
};

import debug from 'debug';

import productStore from '../../../dataSources/cloudFirestore/product';
import constants from '../../../constants';

const dlog = debug('that:api:garage:mutation:ProductCreate');

function sendGraphCdnEvent({ graphCdnEvents, eventId }) {
  graphCdnEvents.emit(constants.GRAPHCDN.EVENT_NAME.CREATED_PRODUCT, {
    eventId,
  });
}

export const fieldResolvers = {
  ProductCreate: {
    ticket: (
      _,
      { ticket },
      {
        dataSources: {
          firestore,
          events: { graphCdnEvents },
        },
        user,
      },
    ) => {
      dlog('create ticket called');
      const newProduct = ticket;
      newProduct.type = 'TICKET';
      return productStore(firestore)
        .create({
          newProduct,
          userId: user.sub,
        })
        .then(result => {
          sendGraphCdnEvent({ graphCdnEvents, eventId: result.eventId });
          return result;
        });
    },

    membership: (
      _,
      { membership },
      {
        dataSources: {
          firestore,
          events: { graphCdnEvents },
        },
        user,
      },
    ) => {
      dlog('create membership called');
      const newProduct = membership;
      newProduct.type = 'MEMBERSHIP';
      return productStore(firestore)
        .create({
          newProduct,
          userId: user.sub,
        })
        .then(result => {
          sendGraphCdnEvent({ graphCdnEvents, eventId: result.eventId });
          return result;
        });
    },

    partnership: (
      _,
      { partnership },
      {
        dataSources: {
          firestore,
          events: { graphCdnEvents },
        },
        user,
      },
    ) => {
      dlog('create partnership called');
      const newProduct = partnership;
      newProduct.type = 'PARTNERSHIP';
      return productStore(firestore)
        .create({
          newProduct,
          userId: user.sub,
        })
        .then(result => {
          sendGraphCdnEvent({ graphCdnEvents, eventId: result.eventId });
          return result;
        });
    },

    coupon: () => {
      throw new Error('Not implemented yet');
    },

    food: (
      _,
      { food },
      {
        dataSources: {
          firestore,
          events: { graphCdnEvents },
        },
        user,
      },
    ) => {
      dlog('create food called');
      const newProduct = food;
      newProduct.type = 'FOOD';
      return productStore(firestore)
        .create({
          newProduct,
          userId: user.sub,
        })
        .then(result => {
          sendGraphCdnEvent({ graphCdnEvents, eventId: result.eventId });
          return result;
        });
    },

    training: (
      _,
      { training },
      {
        dataSources: {
          firestore,
          events: { graphCdnEvents },
        },
        user,
      },
    ) => {
      dlog('create training called');
      const newProduct = training;
      newProduct.type = 'TRAINING';
      return productStore(firestore)
        .create({
          newProduct,
          userId: user.sub,
        })
        .then(result => {
          sendGraphCdnEvent({ graphCdnEvents, eventId: result.eventId });
          return result;
        });
    },

    family: (
      _,
      { family },
      {
        dataSources: {
          firestore,
          events: { graphCdnEvents },
        },
        user,
      },
    ) => {
      dlog('create family called');
      const newProduct = family;
      newProduct.type = 'FAMILY';
      return productStore(firestore)
        .create({
          newProduct,
          userId: user.sub,
        })
        .then(result => {
          sendGraphCdnEvent({ graphCdnEvents, eventId: result.eventId });
          return result;
        });
    },
  },
};

/* eslint-disable no-unused-vars */
import debug from 'debug';

const dlog = debug('that:api:garage:query:Product');

export const fieldResolvers = {
  Product: {
    __resolveType(obj, content, info) {
      dlog('__resolveType called');
      let result = null;
      switch (obj.type) {
        case 'TICKET':
          result = 'Ticket';
          break;
        case 'MEMBERSHIP':
          result = 'Membership';
          break;
        case 'PARTNERSHIP':
          result = 'Partnership';
          break;
        case 'FOOD':
          result = 'Food';
          break;
        default:
          throw new Error('Resolver encountered unknown product type');
      }
      dlog('result: %s', result);
      return result;
    },
    __resolveReference({ id }, { dataSources: { productLoader } }) {
      dlog('resolve reference');
      return productLoader.load(id);
    },
  },
  Ticket: {
    createdBy: ({ createdBy: id }) => ({ id }),
    lastUpdatedBy: ({ lastUpdatedBy: id }) => ({ id }),
  },
  Membership: {
    createdBy: ({ createdBy: id }) => ({ id }),
    lastUpdatedBy: ({ lastUpdatedBy: id }) => ({ id }),
  },
  Partnership: {
    createdBy: ({ createdBy: id }) => ({ id }),
    lastUpdatedBy: ({ lastUpdatedBy: id }) => ({ id }),
  },
};

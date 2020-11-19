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
      }
      dlog('result: %s', result);
      return result;
    },
  },
};

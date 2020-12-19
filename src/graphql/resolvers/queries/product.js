/* eslint-disable no-unused-vars */
import debug from 'debug';
import { resolveType } from '@thatconference/schema';

const dlog = debug('that:api:garage:query:Product');

export const fieldResolvers = {
  Product: {
    __resolveType(obj, content, info) {
      return resolveType.productType(obj.type);
    },
    __resolveReference({ id }, { dataSources: { productLoader } }) {
      dlog('resolve reference');
      return productLoader.load(id);
    },
  },
  Ticket: {
    __resolveReference({ id }, { dataSources: { productLoader } }) {
      dlog('resolve reference');
      return productLoader.load(id);
    },
    createdBy: ({ createdBy: id }) => ({ id }),
    lastUpdatedBy: ({ lastUpdatedBy: id }) => ({ id }),
  },
  Membership: {
    __resolveReference({ id }, { dataSources: { productLoader } }) {
      dlog('resolve reference');
      return productLoader.load(id);
    },
    createdBy: ({ createdBy: id }) => ({ id }),
    lastUpdatedBy: ({ lastUpdatedBy: id }) => ({ id }),
  },
  Partnership: {
    __resolveReference({ id }, { dataSources: { productLoader } }) {
      dlog('resolve reference');
      return productLoader.load(id);
    },
    createdBy: ({ createdBy: id }) => ({ id }),
    lastUpdatedBy: ({ lastUpdatedBy: id }) => ({ id }),
  },
};

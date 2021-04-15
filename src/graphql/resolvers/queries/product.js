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
      dlog('resolve product reference');
      return productLoader.load(id);
    },
  },
  Ticket: {
    __resolveReference({ id }, { dataSources: { productLoader } }) {
      dlog('resolve ticket reference');
      return productLoader.load(id);
    },
    createdBy: ({ createdBy: id }) => ({ id }),
    lastUpdatedBy: ({ lastUpdatedBy: id }) => ({ id }),
    eventActivities: ({ eventActivities = [] }) => eventActivities,
  },
  Membership: {
    __resolveReference({ id }, { dataSources: { productLoader } }) {
      dlog('resolve membership reference');
      return productLoader.load(id);
    },
    createdBy: ({ createdBy: id }) => ({ id }),
    lastUpdatedBy: ({ lastUpdatedBy: id }) => ({ id }),
    eventActivities: ({ eventActivities = [] }) => eventActivities,
  },
  Partnership: {
    __resolveReference({ id }, { dataSources: { productLoader } }) {
      dlog('resolve partnership reference');
      return productLoader.load(id);
    },
    createdBy: ({ createdBy: id }) => ({ id }),
    lastUpdatedBy: ({ lastUpdatedBy: id }) => ({ id }),
    eventActivities: ({ eventActivities = [] }) => eventActivities,
  },
  Coupon: {
    __resolveReference({ id }, { dataSources: { productLoader } }) {
      dlog('resolve coupon reference');
      return productLoader.load(id);
    },
    createdBy: ({ createdBy: id }) => ({ id }),
    lastUpdatedBy: ({ lastUpdatedBy: id }) => ({ id }),
    eventActivities: ({ eventActivities = [] }) => eventActivities,
  },
  Food: {
    __resolveReference({ id }, { dataSources: { productLoader } }) {
      dlog('resolve food reference');
      return productLoader.load(id);
    },
    createdBy: ({ createdBy: id }) => ({ id }),
    lastUpdatedBy: ({ lastUpdatedBy: id }) => ({ id }),
    eventActivities: ({ eventActivities = [] }) => eventActivities,
  },
  Training: {
    __resolveReference({ id }, { dataSources: { productLoader } }) {
      dlog('resolve training reference');
      return productLoader.load(id);
    },
    createdBy: ({ createdBy: id }) => ({ id }),
    lastUpdatedBy: ({ lastUpdatedBy: id }) => ({ id }),
    eventActivities: ({ eventActivities = [] }) => {
      dlog('eventActivities', eventActivities);
      return eventActivities;
    },
  },
  Family: {
    __resolveReference({ id }, { dataSources: { productLoader } }) {
      dlog('resolve family reference');
      return productLoader.load(id);
    },
    createdBy: ({ createdBy: id }) => ({ id }),
    lastUpdatedBy: ({ lastUpdatedBy: id }) => ({ id }),
    eventActivities: ({ eventActivities = [] }) => eventActivities,
  },
};

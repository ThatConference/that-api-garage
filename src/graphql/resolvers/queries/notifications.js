import debug from 'debug';

const dlog = debug('that:api:notifications:query:NotificationsQuery');

export const fieldResolvers = {
  NotificationsQuery: {
    all: (_, __, { dataSources }) => {
      dlog('all');
      throw new Error('Not implemented yet.');
    },
  },
};

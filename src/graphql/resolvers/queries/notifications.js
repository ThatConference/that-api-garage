import debug from 'debug';

const dlog = debug('that:api:garage:query:NotificationsQuery');

export const fieldResolvers = {
  NotificationsQuery: {
    all: () => {
      dlog('all');
      throw new Error('Not implemented yet.');
    },
  },
};

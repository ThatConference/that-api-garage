import debug from 'debug';

const dlog = debug('that:api:garage:mutations:NotificationsMutation');

export const fieldResolvers = {
  NotificationsMutation: {
    create: () => {
      dlog('create');
      throw new Error('Not implemented yet.');
    },
  },
};

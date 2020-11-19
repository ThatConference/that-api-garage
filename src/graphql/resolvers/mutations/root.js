import debug from 'debug';

const dlog = debug('that:api:garage:mutations:root');

const resolvers = {
  notifications: () => {
    dlog('root:notifications mutation called');
    return {};
  },
};

export default resolvers;

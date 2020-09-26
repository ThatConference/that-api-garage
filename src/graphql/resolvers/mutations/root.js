import debug from 'debug';

const dlog = debug('that:api:notifications:mutations:root');

const resolvers = {
  notifications: () => {
    dlog('root:notifications mutation called');
    return {};
  },
};

export default resolvers;

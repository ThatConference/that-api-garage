import debug from 'debug';

const dlog = debug('that:api:notifications:query');

const resolvers = {
  notifications: () => {
    dlog('root:notifications query called');
    return {};
  },
};

export default resolvers;

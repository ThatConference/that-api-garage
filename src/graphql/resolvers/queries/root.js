import debug from 'debug';

const dlog = debug('that:api:garage:query');

const resolvers = {
  notifications: () => {
    dlog('root:notifications query called');
    return {};
  },

  products: () => {
    dlog('root products mutation called');
    return {};
  },
};

export default resolvers;

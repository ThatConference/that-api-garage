import debug from 'debug';

const dlog = debug('that:api:garage:mutations');

const resolvers = {
  products: () => {
    dlog('root mutation called');
    return {};
  },
  orders: () => {
    dlog('root:orders mutation called');
    return {};
  },
  assets: () => {
    dlog('root:assets mutation called');
    return {};
  },
  affiliates: () => {
    dlog('root:affiliates mutation called');
    return {};
  },
};

export default resolvers;

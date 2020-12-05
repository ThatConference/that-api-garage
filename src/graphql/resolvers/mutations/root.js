import debug from 'debug';

const dlog = debug('that:api:garage:mutations:root');

const resolvers = {
  products: () => {
    dlog('root:products mutation called');
    return {};
  },
  orders: () => {
    dlog('root:orders mutation called');
    return {};
  },
};

export default resolvers;

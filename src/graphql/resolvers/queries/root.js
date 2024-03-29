import debug from 'debug';

const dlog = debug('that:api:garage:query');

const resolvers = {
  products: () => {
    dlog('root products query called');
    return {};
  },
  orders: () => {
    dlog('root orders called');
    return {};
  },
  assets: () => {
    dlog('root:assets query called');
    return {};
  },
  affiliates: () => {
    dlog('root:affiliates query called');
    return {};
  },
};

export default resolvers;

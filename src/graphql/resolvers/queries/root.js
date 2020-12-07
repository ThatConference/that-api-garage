import debug from 'debug';

const dlog = debug('that:api:garage:query');

const resolvers = {
  products: () => {
    dlog('root products called');
    return {};
  },
  orders: () => {
    dlog('root orders called');
    return {};
  },
};

export default resolvers;

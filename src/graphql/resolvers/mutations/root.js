import debug from 'debug';

const dlog = debug('that:api:garage:mutations:root');

const resolvers = {
  products: () => {
    dlog('root:products mutation called');
    return {};
  },
};

export default resolvers;

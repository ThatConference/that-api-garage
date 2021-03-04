import debug from 'debug';

const dlog = debug('that:api:garage:mutation:MeOrders');

export const fieldResolvers = {
  MeOrdersMutation: {
    checkout: ({ memberId }) => {
      dlog('me checkout called');
      return { memberId };
    },
  },
};

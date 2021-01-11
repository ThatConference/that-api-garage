import debug from 'debug';

const dlog = debug('that:api:garage:mutation:MeOrdersMutation');

export const fieldResolvers = {
  MeOrdersMutation: {
    checkout: ({ memberId }) => {
      dlog('me checkout called');
      return { memberId };
    },
  },
};

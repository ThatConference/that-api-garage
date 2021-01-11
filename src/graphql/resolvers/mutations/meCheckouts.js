import debug from 'debug';
import stripeApi from '../../../dataSources/apis/stripe';

const dlog = debug('that:api:garage:mutation:orders:meCheckout');

export const fieldResolvers = {
  MeCheckoutsMutation: {
    stripe: ({ memberId }) => {
      dlog('stripe called');
      return { memberId };
    },
  },
};

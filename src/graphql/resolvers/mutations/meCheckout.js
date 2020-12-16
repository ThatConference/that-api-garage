import debug from 'debug';
import stripeApi from '../../../dataSources/apis/stripe';

const dlog = debug('that:api:garage:mutation:Checkout');

export const fieldResolvers = {
  MeCheckoutMutation: {
    create: ({ memberId }, { checkout }) => {
      dlog('create checkout called');
      return stripeApi().createCheckout({ checkout, memberId });
    },
  },
};

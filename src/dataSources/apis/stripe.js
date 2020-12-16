import debug from 'debug';
import * as Sentry from '@sentry/node';
import stripelib from 'stripe';
import envConfig from '../../envConfig';
import { OrderError } from '../../lib/errors';

const dlog = debug('that:api:garage:dataource:stripe');
const stripe = stripelib(envConfig.stripeSecretKey);

const stripeApi = () => {
  dlog('stripe instance created');

  function createCheckout({ checkout, memberId }) {
    dlog('create checkout for %s', memberId);
    if (!memberId)
      throw new Error(
        'memberId is required to create a Stripe Checkout session',
      );
    const sessionCheckoutPayload = {
      payment_method_types: ['card'],
      mode: 'payment', // need to investigate if we can use this for one-time only, only
      client_reference_id: memberId,
      allow_promotion_codes: true,
      success_url: 'https://that.us/',
      cancel_url: 'https://that.us/',
    };
    const lineItems = checkout.lineItems.map(li => ({
      price: li,
      quantity: 1,
    }));
    sessionCheckoutPayload.line_items = lineItems;

    return stripe.checkout.sessions
      .create(sessionCheckoutPayload)
      .then(session => session.id)
      .catch(err => {
        const exceptionId = Sentry.captureException(err);
        throw new OrderError(exceptionId);
      });
  }

  return { createCheckout };
};

export default stripeApi;

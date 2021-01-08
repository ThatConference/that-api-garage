import debug from 'debug';
import * as Sentry from '@sentry/node';
import stripelib from 'stripe';
import envConfig from '../../envConfig';
import { OrderError } from '../../lib/errors';

const dlog = debug('that:api:garage:dataource:stripe');
const stripe = stripelib(envConfig.stripeSecretKey);

const stripeApi = () => {
  dlog('stripe instance created');

  function createCustomer({ member }) {
    dlog('create customer called');
    const newCust = {
      email: member.email,
      name: `${member.firstName} ${member.lastName}`,
      metadata: {
        memberId: member.id,
        slug: member.profileSlug,
        firstName: member.firstName,
        lastName: member.lastName,
      },
    };

    return stripe.customers.create(newCust);
  }

  function createCheckout({ checkout, products, member }) {
    dlog(
      'create checkout for %s, with %d line items (%d)',
      member.id,
      products.length,
      checkout.products.length,
    );
    const metadata = {
      memberId: member.id,
      eventId: checkout.eventId,
      productsIds: JSON.stringify(checkout.products.map(cp => cp.productId)),
    };
    const checkoutSessionPayload = {
      success_url: envConfig.stripeSuccessUrl,
      cancel_url: envConfig.stripeCancelUrl,
      payment_method_types: ['card'],
      customer: member.stripeCustomerId,
      client_reference_id: member.id,
      allow_promotion_codes: true,
      metadata,
    };
    const modes = [];
    const lineItems = checkout.products.map(cp => {
      const product = products.find(p => p.id === cp.productId);
      if (!product) throw new Error('Product lookup mismatch. Checkout failed');
      if (!product.processor)
        throw new Error(
          `Processor reference missing from product ${product.name}. Checkout failed`,
        );
      modes.push(product.processor.checkoutMode);
      return {
        price: product.processor.itemRefId,
        quantity: cp.quantity,
        description: product.name,
      };
    });
    checkoutSessionPayload.line_items = lineItems;
    if (modes.includes('SUBSCRIPTION')) {
      checkoutSessionPayload.mode = 'subscription';
      checkoutSessionPayload.subscription_data = { metadata };
    } else {
      checkoutSessionPayload.mode = 'payment';
      checkoutSessionPayload.payment_intent_data = { metadata };
    }
    dlog(
      'our checkoutSessionPayload sending to Stripe:: %o',
      checkoutSessionPayload,
    );

    return stripe.checkout.sessions.create(checkoutSessionPayload);
  }

  function createCheckoutOrig({ checkout, memberId }) {
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
      success_url: envConfig.stripeSuccessUrl,
      cancel_url: envConfig.stripeCancelUrl,
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

  return {
    createCheckout,
    createCustomer,
  };
};

export default stripeApi;

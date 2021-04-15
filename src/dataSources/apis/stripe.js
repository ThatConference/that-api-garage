import debug from 'debug';
import * as Sentry from '@sentry/node';
import stripelib from 'stripe';
import envConfig from '../../envConfig';
import { CheckoutError } from '../../lib/errors';

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

  function createCheckout({ checkout, products, member, event }) {
    dlog(
      'create checkout for %s, with %d line items (%d)',
      member.id,
      products.length,
      checkout.products.length,
    );
    if (!member.stripeCustomerId) {
      dlog('member missing stripe customer id %o', member);
      Sentry.setContext({ member }, { checkout }, { products });
      throw new CheckoutError('member missing stripe customer id');
    }
    const successUrl = event.checkoutSuccess || envConfig.stripeSuccessUrl;
    const cancelUrl = event.checkoutCancel || envConfig.stripeCancelUrl;
    const metadata = {
      memberId: member.id,
      eventId: checkout.eventId,
      productIds: JSON.stringify(checkout.products.map(cp => cp.productId)),
      checkoutLineItems: JSON.stringify(checkout.products),
    };
    const eventActivities = new Set();
    products.forEach(product => {
      if (Array.isArray(product.eventActivities)) {
        product.eventActivities.forEach(activity =>
          eventActivities.add(activity),
        );
      }
    });
    const params = new URLSearchParams([...eventActivities].map(a => [a, 1]));
    params.append('eventId', checkout.eventId);
    const checkoutSessionPayload = {
      success_url: `${successUrl}?${params.toString()}`,
      cancel_url: cancelUrl,
      payment_method_types: ['card'],
      customer: member.stripeCustomerId,
      client_reference_id: member.id,
      allow_promotion_codes: true,
      metadata,
    };
    const modes = [];
    const lineItems = checkout.products.map(cp => {
      const product = products.find(p => p.id === cp.productId);
      if (!product) {
        dlog('Product lookup mismatch. Checkout failed');
        Sentry.setContext({ member }, { checkout }, { products });
        throw new CheckoutError('Product lookup mismatch. Checkout failed');
      }
      if (!product.processor) {
        dlog(
          `Processor reference missing from product ${product.name}. Checkout failed`,
        );
        Sentry.setContext({ member }, { checkout }, { products });
        throw new CheckoutError(
          `Processor reference missing from product ${product.name}. Checkout failed`,
        );
      }
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

  function getPortalUrl(stripeCustomerId) {
    dlog('getPortalUrl for stripe customer %s', stripeCustomerId);
    return stripe.billingPortal.sessions
      .create({
        customer: stripeCustomerId,
        return_url: envConfig.stripePortalReturnUrl,
      })
      .then(result => result.url);
  }

  return {
    createCheckout,
    createCustomer,
    getPortalUrl,
  };
};

export default stripeApi;

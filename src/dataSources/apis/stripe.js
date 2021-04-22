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
    const orderReference = Math.random()
      .toString(36)
      .substr(2, 6)
      .toUpperCase(); // e.g. 'CM2JUR'
    const successUrl = event.checkoutSuccess || envConfig.stripeSuccessUrl;
    const cancelUrl = event.checkoutCancel || envConfig.stripeCancelUrl;
    const metadata = {
      memberId: member.id,
      eventId: checkout.eventId,
      productIds: JSON.stringify(checkout.products.map(cp => cp.productId)),
      checkoutLineItems: JSON.stringify(checkout.products),
      orderReference,
    };
    const eventActivities = new Map();
    products.forEach(product => {
      if (Array.isArray(product.eventActivities)) {
        product.eventActivities.forEach(activity => {
          const v = eventActivities.get(activity) || 0;
          eventActivities.set(activity, v + 1);
        });
      }
      if (product.uiReference === 'SWAG') {
        const swag = 'SWAG';
        const qty =
          checkout.products.find(cop => cop.productId === product.id)
            ?.quantity || 0;
        const w = eventActivities.get(swag) || 0;
        eventActivities.set(swag, w + qty);
      }
    });
    const params = new URLSearchParams([...eventActivities]);
    params.append('eventId', checkout.eventId);
    params.append('orderReference', orderReference);
    dlog('success string parameters :: %s', params.toString());

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
      checkoutSessionPayload.payment_intent_data.description =
        'For detailed ticket information see Orders History in your user profile at https://that.us/my/settings/order-history';
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

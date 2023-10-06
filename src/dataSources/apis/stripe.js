import debug from 'debug';
import * as Sentry from '@sentry/node';
import stripelib from 'stripe';
import envConfig from '../../envConfig';
import { CheckoutError } from '../../lib/errors';

const dlog = debug('that:api:garage:dataource:stripe');
const stripe = stripelib(envConfig.stripe.secretKey, {
  apiVersion: envConfig.stripe.apiVersion,
});

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

  function createCheckout({
    checkout,
    products,
    member,
    event,
    promotionCode,
    domain,
  }) {
    dlog(
      'create checkout for %s, with %d line items (%d) on event %s',
      member.id,
      products.length,
      checkout.products.length,
      event.slug,
    );
    if (!member.stripeCustomerId) {
      dlog('member missing stripe customer id %o', member);
      Sentry.setContext('member', { member: JSON.stringify(member) });
      Sentry.setContext('checkout', { checkout: JSON.stringify(checkout) });
      Sentry.setContext('products', { products: JSON.stringify(products) });
      throw new CheckoutError('member missing stripe customer id');
    }
    let successUrl = event.checkoutSuccess;
    if (event.checkoutSuccess) {
      if (event.checkoutSuccess.startsWith('https://')) {
        successUrl = event.checkoutSuccess.replace('that.us', domain);
      } else {
        successUrl = `https://${domain}${event.checkoutSuccess}`;
      }
    } else {
      successUrl = envConfig.stripe.successUrl;
    }
    let cancelUrl = event.checkoutCancel;
    if (event.checkoutCancel) {
      if (event.checkoutCancel.startsWith('https://')) {
        cancelUrl = event.checkoutCancel.replace('that.us', domain);
      } else {
        cancelUrl = `https://${domain}${event.checkoutSuccess}`;
      }
    } else {
      cancelUrl = envConfig.stripe.cancelUrl;
    }

    const eventLoc = event.slug.split('/')[0]?.toLowerCase() || 'thatus';
    const metadata = {
      memberId: member.id,
      eventId: checkout.eventId,
      productIds: JSON.stringify(checkout.products.map(cp => cp.productId)),
      checkoutLineItems: JSON.stringify(checkout.products),
      eventSlug: event.slug,
      affiliateCode: checkout.affiliateCode ?? null,
      promotionCode: promotionCode ?? 'n/a',
    };
    // we only care if any one of the conditions exist to send with the
    // checkout success page. e.g. ?BULK=0&TL=on&TL=at&M=0
    const ticketTypes = {
      on: false,
      at: false,
      m: false,
      bulk: false,
    };
    const onthatRefs = ['VIRTUAL_CAMPER', null, undefined];
    products.forEach(product => {
      if (product.type === 'MEMBERSHIP') {
        ticketTypes.m = true;
      } else if (onthatRefs.includes(product.uiReference)) {
        ticketTypes.on = true;
      } else {
        ticketTypes.at = true;
      }
    });
    checkout.products.forEach(cop => {
      if (cop.isBulkPurchase === true) {
        ticketTypes.bulk = true;
      }
    });

    const params = new URLSearchParams();
    params.append('EL', eventLoc);
    params.append('M', ticketTypes.m ? 1 : 0);
    params.append('B', ticketTypes.bulk ? 1 : 0);
    if (ticketTypes.on) params.append('TL', 'on');
    if (ticketTypes.at) params.append('TL', 'at');
    dlog('success string parameters :: %s', params.toString());

    const checkoutSessionPayload = {
      success_url: `${successUrl}?${params.toString()}`,
      cancel_url: cancelUrl,
      customer: member.stripeCustomerId,
      client_reference_id: member.id,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      metadata,
    };
    if (promotionCode) {
      checkoutSessionPayload.discounts = [
        {
          promotion_code: promotionCode,
        },
      ];
      delete checkoutSessionPayload.allow_promotion_codes;
    }

    const modes = [];
    const lineItems = checkout.products.map(cp => {
      const product = products.find(p => p.id === cp.productId);
      if (!product) {
        dlog('Product lookup mismatch. Checkout failed');
        Sentry.setContext('product details', {
          member,
          checkout,
          products,
        });
        throw new CheckoutError('Product lookup mismatch. Checkout failed');
      }
      if (!product.processor) {
        dlog(
          `Processor reference missing from product ${product.name}. Checkout failed`,
        );
        Sentry.setContext('product details', {
          member,
          checkout,
          products,
        });
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
        'For detailed ticket information see Orders History in your user profile at https://that.us/my/settings/order-history/';
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
        return_url: envConfig.stripe.portalReturnUrl,
      })
      .then(result => result.url);
  }

  // https://stripe.com/docs/api/promotion_codes/retrieve?lang=node
  // The returned object includes coupon promo code is part of
  function findPromoCodeDetails(stripePromoCode) {
    dlog('getPromoCodeDetails called for %s', stripePromoCode);
    return stripe.promotionCodes.retrieve(stripePromoCode);
  }

  // https://stripe.com/docs/api/coupons/retrieve?lang=node
  function findCouponDetails(couponId) {
    dlog('findCouponDetails called on couponId %s', couponId);
    return stripe.coupons.retrieve(couponId);
  }

  return {
    createCheckout,
    createCustomer,
    getPortalUrl,
    findPromoCodeDetails,
    findCouponDetails,
  };
};

export default stripeApi;

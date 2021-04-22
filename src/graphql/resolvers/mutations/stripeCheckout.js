import debug from 'debug';
import * as Sentry from '@sentry/node';
import { dataSources } from '@thatconference/api';
import memberStore from '../../../dataSources/cloudFirestore/member';
import productStore from '../../../dataSources/cloudFirestore/product';
import stripeApi from '../../../dataSources/apis/stripe';
import { CheckoutError } from '../../../lib/errors';
import checkoutValidation from '../../../lib/checkoutValidation';

const dlog = debug('that:api:garage:mutation:checkout:stripe');
const eventStore = dataSources.cloudFirestore.event;

export const fieldResolvers = {
  StripeCheckoutMutation: {
    create: async (
      { memberId },
      { checkout },
      { dataSources: { firestore } },
    ) => {
      dlog('create called');
      dlog('checkout object:: %o', checkout);
      Sentry.setTag('memberId', memberId);
      Sentry.setContext({ checkout });
      try {
        await checkoutValidation({ checkout });
      } catch (err) {
        const exceptionId = Sentry.captureException(err);
        throw new CheckoutError(exceptionId);
      }

      let member = await memberStore(firestore).get(memberId);
      if (!member || !member.profileSlug)
        throw new Error(`Member must have a profile to order items`);
      if (!member.stripeCustomerId) {
        // create stripe customer
        let stripeCust;
        try {
          stripeCust = await stripeApi().createCustomer({ member });
        } catch (err) {
          const exceptionId = Sentry.captureException(err);
          throw new CheckoutError(exceptionId);
        }

        dlog('New Stripe customer object %o', stripeCust);
        // save to member record
        member = await memberStore(firestore).update({
          profile: { stripeCustomerId: stripeCust.id },
          memberId,
        });
      }
      // verify items and get event info
      let products;
      let event;
      try {
        // products = await productStore(firestore).validateSale(checkout);
        [products, event] = await Promise.all([
          productStore(firestore).validateSale(checkout),
          eventStore(firestore).get(checkout.eventId),
        ]);
      } catch (err) {
        const exceptionId = Sentry.captureException(err);
        throw new CheckoutError(exceptionId);
      }
      if (!products || products.length <= 0) {
        const exceptionId = Sentry.captureException(
          new Error(
            'Checkout validation failed. Cannot complete order. No products',
          ),
        );
        throw new CheckoutError(exceptionId);
      }
      if (!event) {
        const exceptionId = Sentry.captureException(
          new Error(
            `Check validation failed. Invalid or unknown eventId, ${checkout.eventId}`,
          ),
        );
        throw new CheckoutError(exceptionId);
      }
      // create new checkout session
      return stripeApi()
        .createCheckout({
          checkout,
          products,
          member,
          event,
        })
        .then(co => co.id)
        .catch(err => {
          const exceptionId = Sentry.captureException(err);
          throw new CheckoutError(exceptionId);
        });
    },
  },
};

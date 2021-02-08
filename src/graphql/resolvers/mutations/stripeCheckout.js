import debug from 'debug';
import * as Sentry from '@sentry/node';
import memberStore from '../../../dataSources/cloudFirestore/member';
import productStore from '../../../dataSources/cloudFirestore/product';
import stripeApi from '../../../dataSources/apis/stripe';
import { CheckoutError } from '../../../lib/errors';
import checkoutValidation from '../../../lib/checkoutValidation';

const dlog = debug('that:api:garage:mutation:checkout:stripe');

export const fieldResolvers = {
  StripeCheckoutMutation: {
    create: async (
      { memberId },
      { checkout },
      { dataSources: { firestore } },
    ) => {
      dlog('create called');
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
      // verify items
      let products;
      try {
        products = await productStore(firestore).validateSale(checkout);
      } catch (err) {
        const exceptionId = Sentry.captureException(err);
        throw new CheckoutError(exceptionId);
      }
      if (!products || products.length <= 0) {
        const exceptionId = Sentry.captureException(
          new Error('Checkout validation failed. Cannot complete order'),
        );
        throw new CheckoutError(exceptionId);
      }
      // create new checkout session
      return stripeApi()
        .createCheckout({
          checkout,
          products,
          member,
        })
        .then(co => co.id)
        .catch(err => {
          const exceptionId = Sentry.captureException(err);
          throw new CheckoutError(exceptionId);
        });
    },
  },
};

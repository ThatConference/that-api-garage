import debug from 'debug';
import * as Sentry from '@sentry/node';
import { dataSources } from '@thatconference/api';
import memberStore from '../../../dataSources/cloudFirestore/member';
import productStore from '../../../dataSources/cloudFirestore/product';
import affiliateStore from '../../../dataSources/cloudFirestore/affiliate';
import promoCodeStore from '../../../dataSources/cloudFirestore/affiliatePromoCode';
import stripeApi from '../../../dataSources/apis/stripe';
import { CheckoutError, ValidationError } from '../../../lib/errors';
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
      Sentry.setContext('checkout input object', {
        checkout: JSON.stringify(checkout),
      });
      const returnResult = {
        success: false,
        message: '',
        stripeCheckoutId: null,
      };
      let stripePromotionCode;
      try {
        // yup-based validation
        await checkoutValidation({ checkout });
      } catch (err) {
        const exceptionId = Sentry.captureException(err);
        returnResult.message = `Checkout validation failed. Ref: ${exceptionId}`;
        return returnResult;
      }

      // Affiliates
      if (checkout.affiliateCode) {
        dlog('working with affiliate code %s', checkout.affiliateCode);
        let affiliate;
        let affiliatePromo;
        // Intentially checking both to know which is missing
        // the affiliate as a whole or simply the event for the affilitate
        try {
          [affiliate, affiliatePromo] = await Promise.all([
            affiliateStore(firestore).get(checkout.affiliateCode),
            promoCodeStore(firestore).findAffiliatePromoCodeForEvent({
              affiliateId: checkout.affiliateCode,
              eventId: checkout.eventId,
            }),
          ]);
        } catch (err) {
          const exceptionId = Sentry.captureException(err);
          returnResult.message = `Error retrieving affiliate data. ref: ${exceptionId}`;
          return returnResult;
        }
        dlog('affiliate:: %o', affiliate);
        dlog('affiliatePromo:: %o', affiliatePromo);
        if (!affiliate) {
          returnResult.message = `affiliate not found`;
        } else if (!affiliatePromo?.promotionCode) {
          returnResult.message = `invalid affiliate promotion`;
        }
        if (returnResult.message.length > 0) {
          return returnResult;
        }
        stripePromotionCode = affiliatePromo.promotionCode;
      }

      let member;
      try {
        member = await memberStore(firestore).get(memberId);
      } catch (err) {
        const exceptionId = Sentry.captureException(err);
        returnResult.message = `Error retrieving member. ref ${exceptionId}`;
        return returnResult;
      }

      if (!member || !member.profileSlug) {
        Sentry.captureException(
          new CheckoutError('Member record not found for checkout'),
        );
        returnResult.message = `Member profile not found. Member Profile required to order products`;
        return returnResult;
      }
      if (!member.stripeCustomerId) {
        // create stripe customer
        let stripeCust;
        try {
          stripeCust = await stripeApi().createCustomer({ member });
        } catch (err) {
          const exceptionId = Sentry.captureException(err);
          returnResult.message = `Unable to create Stripe resource. Please contact THAT Staff. Ref: ${exceptionId}`;
          return returnResult;
        }

        dlog('New Stripe customer object %o', stripeCust);
        // save to member record
        try {
          member = await memberStore(firestore).update({
            profile: { stripeCustomerId: stripeCust.id },
            memberId,
          });
        } catch (err) {
          const exceptionId = Sentry.captureException(err);
          returnResult.message = `Error updating member record. Please contact THAT Staff. ref: ${exceptionId}`;
          return returnResult;
        }
      }
      // verify items and get event info
      let products;
      let event;
      try {
        [products, event] = await Promise.all([
          productStore(firestore).validateSale(checkout),
          eventStore(firestore).get(checkout.eventId),
        ]);
      } catch (err) {
        const exceptionId = Sentry.captureException(err);
        if (err instanceof ValidationError) {
          returnResult.message = `${err.message} ref: ${exceptionId}`;
        } else {
          returnResult.message = `Error validating checkout items. Please contact THAT Staff. ref: ${exceptionId}`;
        }
        return returnResult;
      }
      if (!products || products.length <= 0) {
        const errorMsg =
          'Checkout validation failed. Cannot complete order. No products.';
        const exceptionId = Sentry.captureException(new Error(errorMsg));
        returnResult.message = `${errorMsg} ref: ${exceptionId}`;
        return returnResult;
      }
      if (!event) {
        const errorMsg = `Check validation failed. Invalid or unknown eventId, ${checkout.eventId}`;
        const exceptionId = Sentry.captureException(new Error(errorMsg));
        returnResult.message = `${errorMsg} ref: ${exceptionId}`;
        return returnResult;
      }
      // create new checkout session
      return stripeApi()
        .createCheckout({
          checkout,
          products,
          member,
          event,
          promotionCode: stripePromotionCode,
        })
        .then(co => {
          returnResult.success = true;
          returnResult.message = 'success';
          returnResult.stripeCheckoutId = co.id;
          return returnResult;
        })
        .catch(err => {
          dlog('error creating checkout: %o', err.message);
          const exceptionId = Sentry.captureException(err);
          returnResult.message = `Unable to create checkout at stripe. Please contact THAT Staff. Ref: ${exceptionId}`;
          return returnResult;
        });
    },
  },
};

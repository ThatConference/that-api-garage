import debug from 'debug';
import memberStore from '../../../dataSources/cloudFirestore/member';
import productStore from '../../../dataSources/cloudFirestore/product';
import stripeApi from '../../../dataSources/apis/stripe';

const dlog = debug('that:api:garage:mutation:checkout:stripe');

export const fieldResolvers = {
  StripeCheckoutMutation: {
    create: async (
      { memberId },
      { checkout },
      { dataSources: { firestore } },
    ) => {
      dlog('create called');
      let member = await memberStore(firestore).get(memberId);
      if (!member.profileSlug)
        throw new Error(`Member must a profile to order items`);
      if (!member.stripeCustomerId) {
        // create stripe customer
        const stripeCust = await stripeApi().createCustomer({ member });
        // save to member record
        member = await memberStore(firestore).update({
          stripeCustomerId: stripeCust.id,
        });
      }
      // verify items
      const products = await productStore(firestore).validateSale(checkout);
      if (!products || products.length <= 0)
        throw new Error('Checkout validation failed. Cannot complete order');
      // create new checkout session
    },
  },
};

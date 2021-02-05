import debug from 'debug';
import memberStore from '../../../dataSources/cloudFirestore/member';
import stripeApi from '../../../dataSources/apis/stripe';

const dlog = debug('that:api:garage:query:MePortal');

export const fieldResolvers = {
  MePortal: {
    stripe: ({ user }, __, { dataSources: { firestore } }) => {
      dlog('stripe portal request called for user %s', user.sub);
      return memberStore(firestore)
        .get(user.sub)
        .then(member => {
          if (!member.stripeCustomerId) return null;
          return stripeApi().getPortalUrl(member.stripeCustomerId);
        });
    },
  },
};

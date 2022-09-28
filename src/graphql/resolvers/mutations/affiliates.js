import debug from 'debug';
import affiliateStore from '../../../dataSources/cloudFirestore/affiliate';
import sendAffiliateDigest from '../../../lib/affiliates/sendAffiliateDigest';

const dlog = debug('that:api:garage:mutation:affilates');

export const fieldResolvers = {
  AffiliatesMutation: {
    create: (_, { affiliate }, { dataSources: { firestore }, user }) => {
      dlog('creating new affiliate: %o', affiliate);
      return affiliateStore(firestore).create({
        affiliate,
        userId: user.sub,
      });
    },
    affiliate: (_, { affiliateId }) => {
      dlog('heading down affiliate path with id %s', affiliateId);
      return { affiliateId };
    },
    generateReferralDigest: (
      _,
      { params },
      { dataSources: { firestore }, user },
    ) => {
      const { eventId, spanInDays = 7 } = params;
      dlog(
        'generateReferralDigest called on event %s for days %d',
        eventId,
        spanInDays,
      );

      return sendAffiliateDigest({
        eventId,
        spanInDays,
        firestore,
        userId: user.sub,
      }).then(r => {
        dlog('response: %O', r);
        return r;
      });
    },
  },
};

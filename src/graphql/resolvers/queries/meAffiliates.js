import debug from 'debug';

const dlog = debug('that:api:garage:meAffiliates');

export const fieldResolvers = {
  MeAffiliatesQuery: {
    isAffiliate: parent => parent.length > 0,
    info: ([parent]) => ({ ...parent }),
    referrals: (parent, { eventId }, { dataSources: { firestore }, user }) => {
      dlog('finding referrals for %s', user.sub);
    },
  },
};

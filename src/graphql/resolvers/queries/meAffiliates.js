import debug from 'debug';

const dlog = debug('that:api:garage:query:meAffiliates');

export const fieldResolvers = {
  MeAffiliatesQuery: {
    isAffiliate: parent => parent.length > 0,
    info: ([parent]) => ({ ...parent }),
  },
};

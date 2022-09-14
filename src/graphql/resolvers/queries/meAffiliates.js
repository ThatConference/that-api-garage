export const fieldResolvers = {
  MeAffiliatesQuery: {
    isAffiliate: parent => parent.length > 0,
    info: ([parent]) => ({ ...parent }),
  },
};

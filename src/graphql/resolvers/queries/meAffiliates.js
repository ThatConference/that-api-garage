export const fieldResolvers = {
  MeAffiliatesQuery: {
    isAffiliate: affilate => !!affilate,
    info: affiliate => ({ ...affiliate }),
  },
};

export const fieldResolvers = {
  AffiliatePromoCode: {
    rewardPercentage: ({ rewardPercentage }) => rewardPercentage ?? 0,
  },
};

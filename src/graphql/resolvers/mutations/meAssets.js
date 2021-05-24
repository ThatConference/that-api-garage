export const fieldResolvers = {
  MeAssetsMutation: {
    create: () => {
      throw new Error('Not Implemented Yet');
    },
    asset: (_, { assetId }) => ({ assetId }),
  },
};

export const fieldResolvers = {
  PublicOrderAllocation: {
    event: ({ event: id }) => ({ id }),
    orderId: ({ order: orderId }) => orderId,
    product: ({ product: productId }, __, { dataSources: { productLoader } }) =>
      productLoader.load(productId),
    allocatedTo: ({ allocatedTo }, __, { dataSources: { memberLoader } }) => {
      if (!allocatedTo) return null;
      return memberLoader.load(allocatedTo);
    },
    purchasedBy: ({ purchasedBy }, __, { dataSources: { memberLoader } }) =>
      memberLoader.load(purchasedBy),
  },
};

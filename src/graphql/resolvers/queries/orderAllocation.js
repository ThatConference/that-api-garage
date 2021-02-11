export const fieldResolvers = {
  OrderAllocation: {
    event: ({ event: id }) => ({ id }),
    order: ({ order: orderId }, __, { dataSources: { orderLoader } }) =>
      orderLoader.load(orderId),
    product: ({ product: productId }, __, { dataSources: { productLoader } }) =>
      productLoader.load(productId),
    allocatedTo: ({ allocatedTo }, __, { dataSources: { memberLoader } }) => {
      if (!allocatedTo) return null;
      return memberLoader.load(allocatedTo);
    },
    purchasedBy: ({ purchasedBy: id }) => ({ id }),
  },
};
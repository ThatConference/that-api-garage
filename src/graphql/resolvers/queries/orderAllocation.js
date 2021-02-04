export const fieldResolvers = {
  OrderAllocation: {
    event: ({ event: id }) => ({ id }),
    order: ({ order: orderId }, __, { dataSources: { orderLoader } }) =>
      orderLoader.load(orderId),
    product: ({ product: productId }, __, { dataSources: { productLoader } }) =>
      productLoader.load(productId),
    allocatedTo: ({ allocatedTo: id }) => (id ? { id } : null),
    purchasedBy: ({ purchasedBy: id }) => ({ id }),
  },
};

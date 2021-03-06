import fetchAllocationsQuestionsLink from '../../../lib/that/fetchAllocationsQuestionsLink';

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
    isAllocated: ({ allocatedTo }) => allocatedTo?.length > 4,
    questionsLink: (
      { event: eventId, product: productId, id: orderAllocationId },
      __,
      { dataSources: { firestore } },
    ) =>
      fetchAllocationsQuestionsLink({
        eventId,
        productId,
        firestore,
        orderAllocationId,
      }),
    hasCheckedIn: ({ checkedInAt }) => {
      let isCheckedIn = false;
      if (checkedInAt) isCheckedIn = true;
      return isCheckedIn;
    },
    checkedInBy: ({ checkedInBy }, __, { dataSources: { memberLoader } }) => {
      if (!checkedInBy) return null;
      return memberLoader.load(checkedInBy);
    },
  },
};

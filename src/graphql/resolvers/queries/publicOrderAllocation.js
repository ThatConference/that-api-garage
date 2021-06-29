import fetchAllocationsQuestionsLink from '../../../lib/that/fetchAllocationsQuestionsLink';

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
    isAllocated: ({ isAllocated, allocatedTo }) =>
      isAllocated && allocatedTo?.length > 4,
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
  },
};

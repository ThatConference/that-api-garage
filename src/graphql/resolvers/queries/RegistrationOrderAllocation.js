import fetchAllocationsQuestionsLink from '../../../lib/that/fetchAllocationsQuestionsLink';

export const fieldResolvers = {
  RegistrationOrderAllocation: {
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
    hasCheckedIn: ({ checkedInAt, hasCheckedIn }) =>
      checkedInAt || hasCheckedIn,
    checkedInBy: ({ checkedInBy }, __, { dataSources: { memberLoader } }) => {
      if (!checkedInBy) return null;
      return memberLoader.load(checkedInBy);
    },
    receivedSwag: ({ receivedSwag }) => receivedSwag === true,
  },
};

import debug from 'debug';

const dlog = debug('that:api:garage:mutation:order');

export const fieldResolvers = {
  MeOrderMutation: {
    orderAllocation: ({ order }, { orderAllocationId }) => {
      dlog('meOrderMutation, orderAllocation called, %s', orderAllocationId);
      return { order, orderAllocationId };
    },
  },
};

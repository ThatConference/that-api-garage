import debug from 'debug';

const dlog = debug(`that:api:garage:mutation:OrderAllocationMutation`);

export const fieldResolvers = {
  OrderAllocationMutation: {
    // order allocation
    allocateTo: () => {
      dlog('allocateTo called');
      throw new Error('Not Implemented Yet');
    },
    setRefunded: () => {
      dlog('setRefunded called');
      throw new Error('Not Implemented Yet');
    },
  },
};

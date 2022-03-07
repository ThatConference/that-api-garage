import debug from 'debug';
import orderStore from '../../../dataSources/cloudFirestore/order';

const dlog = debug('that:api:garage:query:RegistrationOrder');

export const fieldResolvers = {
  RegistrationOrder: {
    __resolveReference({ id }, { dataSources: { orderLoader } }) {
      dlog('resolve reference');
      return orderLoader.load(id);
    },
    member: ({ member: memberId }, __, { dataSources: { memberLoader } }) => {
      if (!memberId) return null;
      return memberLoader.load(memberId);
    },
    partner: ({ partner: id }) => (id ? { id } : null),
    event: ({ event: id }) => (id ? { id } : null),
    createdBy: ({ createdBy: id }, __, { dataSources: { memberLoader } }) =>
      memberLoader.load(id),
    lastUpdatedBy: (
      { lastUpdatedBy: id },
      __,
      { dataSources: { memberLoader } },
    ) => memberLoader.load(id),
    orderAllocations: ({ id: orderId }, __, { dataSources: { firestore } }) => {
      dlog('order allocations for an order: %s', orderId);
      return orderStore(firestore).findOrderAllocations({ orderId });
    },
    // old orders defaulted to 'COMPLETE' which would be null unless refuneded
    status: ({ status }) => status ?? 'COMPLETE',
  },
};

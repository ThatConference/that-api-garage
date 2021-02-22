import debug from 'debug';
import validateManualOrder from '../../../lib/that/validateManualOrder';

const dlog = debug('that:api:garage:mutation:OrdersMutation');

export const fieldResolvers = {
  OrdersMutation: {
    create: (
      _,
      { order },
      { dataSources: { firestore, bouncerApi }, user },
    ) => {
      dlog('create called');
      // create that event to send to bouncer
      const now = new Date();
      const thatEvent = {
        id: `thatev_${now.toISOString()}`,
        eventId: order.event,
        created: Math.floor(now.getTime() / 1000),
        order: {
          ...order,
          orderDate: new Date(order.orderDate),
          createdBy: user.sub,
          status: order.status ? order.status : 'SUBMITTED',
        },
        type: 'that.order.manual.created',
      };

      // order checks
      return validateManualOrder({
        orderData: thatEvent.order,
        firestore,
      }).then(() =>
        bouncerApi.postManualOrderEvent(thatEvent).then(r => {
          dlog('bouncer rest result:: %o', r);
          return 'submitted';
        }),
      );
    },
    order: (_, { orderId }) => {
      dlog('order called with id %s', orderId);
      return { orderId };
    },
    me: (_, __, { user }) => {
      dlog('checkout called');
      return { memberId: user.sub };
    },
  },
};

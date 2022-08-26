import debug from 'debug';
import validateManualOrder from '../../../lib/that/validateManualOrder';

const dlog = debug('that:api:garage:mutation:orders:meCheckouts');

export const fieldResolvers = {
  MeCheckoutsMutation: {
    stripe: ({ memberId }) => {
      dlog('stripe called');
      return { memberId };
    },
    claim: (
      { memberId },
      { claim },
      { dataSources: { firestore, bouncerApi } },
    ) => {
      dlog('claim called by %s, order: %o', memberId, claim);
      if (!claim.eventId) throw new Error('EventId is a required parameter');
      if (!claim.productId)
        throw new Error('ProductId is a required parameter');
      // create that claim event to send to Bouncer
      const now = new Date();
      const thatClaimEvent = {
        id: `thatev_clm_${now.toISOString()}`,
        eventId: claim.eventId,
        created: Math.floor(now.getTime() / 1000),
        type: 'that.order.manual.created',
        livemode: process.env.NODE_ENV === 'production',
        order: {
          // order object as needed by bouncer
          member: memberId,
          event: claim.eventId,
          orderDate: now,
          orderType: 'CLAIMABLE',
          createdBy: memberId,
          status: 'COMPLETE',
          lineItems: [
            {
              productId: claim.productId ?? '',
              quantity: 1,
              isBulkPurchase: false,
            },
          ],
        },
      };
      // validateClaimOrder
      return validateManualOrder({
        orderData: thatClaimEvent.order,
        firestore,
        isClaimOrder: true,
      }).then(() =>
        bouncerApi.postManualOrderEvent(thatClaimEvent).then(r => {
          dlog('bouncer rest result:: %o', r);
          return {
            result: true,
            message: 'Submitted. Check orders for product',
          };
        }),
      );
    },
  },
};

/*
{
	"order": {
		"member": "auth0|5e5c7fbf11d8510d3c437187",
		"event": "w1ZQFzsSZzRuItVCNVmC",
		"orderDate": "2022-07-13T14:11:32.665Z",
		"orderType": "REGULAR",
		"total": 0,
		"lineItems": [
			{
				"productId": "ZExYSrDqC2vW3ktfkxET",
				"quantity": 7,
				"isBulkPurchase": true
			}
		]
	}
}
*/

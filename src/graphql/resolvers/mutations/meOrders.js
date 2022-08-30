import debug from 'debug';
import * as Sentry from '@sentry/node';
import { dataSources, lib, validate } from '@thatconference/api';
import orderStore from '../../../dataSources/cloudFirestore/order';
import productStore from '../../../dataSources/cloudFirestore/product';
import validateEventSpeakerProducts from '../../../lib/validateEventSpeakerProducts';
import envConfig from '../../../envConfig';

const dlog = debug('that:api:garage:mutation:MeOrders');
const eventSpeakerStore = dataSources.cloudFirestore.eventSpeaker;
const { eventFindBy } = lib;

export const fieldResolvers = {
  MeOrdersMutation: {
    checkout: ({ memberId }) => {
      dlog('me checkout called');
      return { memberId };
    },
    markQuestionsComplete: (
      { memberId },
      { eventId, orderReference },
      { dataSources: { firestore } },
    ) => {
      dlog(
        'markQuestionsComplete member: %s, event: %s, orderReference: %s',
        memberId,
        eventId,
        orderReference,
      );
      if (!orderReference) return false;
      if (orderReference.length < 9)
        return orderStore(firestore).markMyAllocationsQuestionsComplete({
          memberId,
          eventId,
          orderReference,
        });

      const updateOA = {
        hasCompletedQuestions: true,
        questionsReference: orderReference,
      };
      // if orderReference is > 8 it is probably a Order Allocation id
      // we verify it is, the memeber is allocated to it, then update that the
      // questions are complete.
      return orderStore(firestore)
        .getOrderAllocation(orderReference)
        .then(allocation => {
          if (!allocation) return false;
          if (allocation.allocatedTo !== memberId) {
            Sentry.captureMessage(
              'order allocation questions completed by member not assigned to order allocation',
              { memberId, orderAllocationId: orderReference, eventId },
              'warning',
            );
            return false;
          }
          return orderStore(firestore)
            .updateOrderAllocation({
              orderAllocationId: orderReference,
              updateAllocation: updateOA,
              user: { sub: memberId },
            })
            .then(() => true);
        });
    },
    order: async (_, { orderId }, { dataSources: { firestore }, user }) => {
      dlog('order called, id: %s', orderId);
      const order = await orderStore(firestore).getMe({ user, orderId });
      if (!order) throw new Error(`Invalid orderId. Order not found for user`);
      dlog('The Order: %o', order);
      return { order };
    },
    orderSpeakerProducts: async (
      _,
      { findEventBy, products },
      { dataSources: { firestore, bouncerApi }, user },
    ) => {
      dlog('Speaker %s, getting %o', user.sub, products);
      const result = { success: false, message: '' };

      const v0 = validateEventSpeakerProducts(products);
      if (!v0.isValid) {
        result.message = v0.message;
        return result;
      }

      const { eventId } = await eventFindBy(findEventBy, firestore);
      const _eventSpeaker = await eventSpeakerStore(firestore).get({
        eventId,
        memberId: user.sub,
      });
      dlog('EVENT SPEAKER RESULT: %O', _eventSpeaker);
      if (!_eventSpeaker.isAcceptedSpeaker)
        result.message = `Member has not been selected to speak`;
      else if (!_eventSpeaker.agreeToSpeak)
        result.message = `Member has not accepted speaking engagement`;
      else if (_eventSpeaker.status === 'COMPLETE')
        result.message = `Member has already completed their speaker enrollment sign up`;
      else if (_eventSpeaker.orderId?.length > 0)
        result.message = `Member has already completed their speaker products order`;
      else if (!_eventSpeaker.platform)
        result.message = `Platform (AT or ON) speaker is presenting on is not set`;
      else if (
        (products.includes('COUNSELOR_AT_THAT') &&
          _eventSpeaker.platform === 'ON_THAT') ||
        (products.includes('COUNSELOR_ON_THAT') &&
          _eventSpeaker.platform === 'AT_THAT')
      )
        result.message = `Speaker platform and counselor ticket type mismatch (AT THAT/ON THAT)`;
      if (result.message.length > 0) {
        return result;
      }

      const eventProducts = await productStore(firestore).findAllByEventId(
        eventId,
      );
      const epUiRef = eventProducts.map(ep => ep.uiReference);
      const missingProducts = [];
      const eventProductCheck = products.map(p => {
        if (!epUiRef.includes(p)) {
          missingProducts.push(p);
          return false;
        }
        return true;
      });

      if (eventProductCheck.includes(false)) {
        result.message = `Requested product(s) not available in Event: ${missingProducts}`;
        return result;
      }

      const newOrderLineItems = products.map(p => {
        const evp = eventProducts.find(ep => ep.uiReference === p);
        return {
          productId: evp.id,
          quantity: 1,
          isBulkPurchase: false,
        };
      });

      /* 
      // Add ON THAT ticket for speaker to give-away
      const onThatTicket = eventProducts.find(
        ep => ep.uiReference === 'VIRTUAL_CAMPER',
      );
      if (onThatTicket) {
        newOrderLineItems.push({
          productId: onThatTicket.id,
          quantity: 1,
          isBulkPurchase: true,
        });
      } else {
        Sentry.configureScope(scope => {
          scope.setLevel('warning');
          scope.setTag('eventId', eventId);
          Sentry.captureException(
            `Unable to locate ON THAT ticket for event ${eventId} to allocate to speaker`,
          );
        });
      }
      */

      const now = new Date();
      const newOrderEvent = {
        id: `thatev_spkr_${now.toISOString()}`,
        eventId,
        created: Math.floor(now.getTime() / 1000),
        type: `that.order.manual.created`,
        livemode: process.env.NODE_ENV === 'production',
        order: {
          member: user.sub,
          event: eventId,
          orderDate: now,
          total: 0,
          lineItems: newOrderLineItems,
          orderType: 'SPEAKER',
          createdBy: user.sub,
        },
      };

      try {
        await validate.manualOrderEvent(newOrderEvent);
      } catch (err) {
        result.message = `order validation failed: ${err.message}`;
        return result;
      }

      // Short-circuit out if not in production (development/testing)
      if (
        process.env.NODE_ENV !== 'production' &&
        !envConfig.devSendOrderSpeakerRequest
      ) {
        dlog('Our new order event object: %O', newOrderEvent);
        result.message = 'Request not sent, in development mode testing';
        return result;
      }

      let orderRes;
      try {
        orderRes = await bouncerApi.postManualOrderEvent(newOrderEvent);
        dlog('Order Result from Bouncer', orderRes);
      } catch (err) {
        Sentry.setTags('eventId', eventId);
        Sentry.setContext('products', products);
        Sentry.setContext('eventOrder', JSON.stringify(newOrderEvent));
        Sentry.setContext('order result', orderRes);
        Sentry.captureException(err);
        result.message = `There was an error submitting the order. Please try again.`;
        return result;
      }

      await eventSpeakerStore(firestore).update({
        eventId,
        memberId: user.sub,
        updateObj: { status: 'IN_PROGRESS' },
      });

      result.success = true;
      result.message = 'Speaker products order sent successfully';
      return result;
    },
    enrollment: (
      _,
      { orderAllocationId },
      { dataSources: { firestore }, user },
    ) => {
      dlog('enrollment path called on allocationId %s', orderAllocationId);
      return orderStore(firestore)
        .getOrderAllocation(orderAllocationId)
        .then(orderAllocation => {
          if (orderAllocation.allocatedTo !== user.sub)
            throw new Error(
              'OrderAllocation not assigned to current user. Cannot mutate',
            );

          return { orderAllocation };
        });
    },
  },
};

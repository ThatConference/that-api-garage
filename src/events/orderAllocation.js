import { EventEmitter } from 'events';
import debug from 'debug';
import * as Sentry from '@sentry/node';
import { dataSources } from '@thatconference/api';
import sendTransactionalEmail from '../lib/postmark/sendTransactional';
import productStore from '../dataSources/cloudFirestore/product';
import { SendEmailError } from '../lib/errors';

const dlog = debug('that:api:garage:events:orderAllocation');
const eventStore = dataSources.cloudFirestore.event;

export default function orderAllocationEvents() {
  const orderAllocationEmitter = new EventEmitter();
  dlog('orderAllocation emitter created');

  // goal: send when ticket (prodcut) is allocatedTo a member. Sent to target member.
  async function sendNewAllocationEmail({
    memberTo,
    firestore,
    orderAllocation,
  }) {
    dlog('sendNewAllocationEmail called');
    Sentry.configureScope(scope => {
      scope.setTag('orderAllocationEvents', 'sendNewAllocationEmail');
      scope.setContext({
        memberTo: JSON.stringify(memberTo),
        orderAllocation: JSON.stringify(orderAllocation),
      });
      scope.setLevel(Sentry.Severity.Error);
    });
    if (!firestore && !firestore.collection) {
      Sentry.captureException(
        new SendEmailError(`firestore parameter is required`),
      );
      return undefined;
    }

    if (!orderAllocation && !orderAllocation.event) {
      Sentry.captureException(
        new SendEmailError(`orderAllocation parameter is required`),
      );
      return undefined;
    }
    // need event info and might as well get product (ticket) name
    let event;
    let product;
    try {
      [event, product] = await Promise.all([
        eventStore(firestore).get(orderAllocation.event),
        productStore(firestore).get(orderAllocation.product),
      ]);
    } catch (err) {
      process.nextTick(() =>
        orderAllocationEmitter.emit('sendEmailError', err),
      );
    }

    if (!event) {
      Sentry.captureException(
        new SendEmailError(`Invalid event on orderAllocation. Not found`),
      );
      return undefined;
    }
    if (!product) {
      Sentry.captureException(
        new SendEmailError(`Invalid product on orderAllocation. Not found`),
      );
      return undefined;
    }

    const templateModel = {
      member: {
        firstName: memberTo.firstname,
        lastName: memberTo.lastName,
      },
      product: {
        name: product.name,
      },
      event: {
        name: event.name,
        startDate: event.startDate,
        stopDate: event.stopDate,
        month: new Intl.DateTimeFormat('en-US', { month: 'long' }).format(
          event.startDate,
        ),
      },
    };

    return sendTransactionalEmail({
      mailTo: memberTo.email,
      templateModel,
      templateAlias: 'product-allocated-to-message',
    }).catch(err =>
      process.nextTick(() =>
        orderAllocationEmitter.emit('sendEmailError', err),
      ),
    );
  }

  function sendEventErrorToSentry(error) {
    dlog('orderEventEmitter error:: %o', error);
    Sentry.configureScope(scope => {
      scope.setTag('eventEmitter', 'functionError');
      scope.setLevel(Sentry.Severity.Error);
      Sentry.captureException(error);
    });
  }

  orderAllocationEmitter.on('productAllocatedTo', sendNewAllocationEmail);

  orderAllocationEmitter.on('sendEmailError', err =>
    sendEventErrorToSentry(new SendEmailError(err.message)),
  );

  return orderAllocationEmitter;
}

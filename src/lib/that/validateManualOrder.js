import debug from 'debug';
import * as Sentry from '@sentry/node';
import { dataSources } from '@thatconference/api';
import manualOrderChecks from './manualOrderChecks';
import claimOrderChecks from './claimOrderChecks';

const dlog = debug('that:api:brinks:validateManualOrder');
const productStoreFunc = dataSources.cloudFirestore.product;

export default function validateManualOrder({
  orderData,
  firestore,
  isClaimOrder = false,
}) {
  dlog('validateManualOrder called');
  let eventId;
  let lineItems;
  let productIds;
  let productStore;
  try {
    eventId = orderData.event;
    lineItems = orderData.lineItems;
    productIds = lineItems.map(li => li.productId);
    productStore = productStoreFunc(firestore);
  } catch (err) {
    return Promise.reject(err);
  }

  if (
    lineItems.filter(li => !li.isBulkPurchase && li.quantity !== 1).length > 0
  ) {
    throw new Error('Non-batch purchase line items must have a quantity of 1');
  }
  if (isClaimOrder === true) {
    if (lineItems.length !== 1) {
      throw new Error('Claim orders must have exactly 1 line item');
    }
    if (lineItems[0].quantity !== 1) {
      throw new Error('A claim order item must have a quantity of 1');
    }
  }

  return productStore.getBatch(productIds).then(prods => {
    const products = prods.filter(p => p !== null);
    const errorList = [];

    const moErrors = manualOrderChecks({
      products,
      productIds,
      eventId,
    });
    errorList.push(...moErrors);

    if (isClaimOrder === true) {
      const coErrors = claimOrderChecks({
        products,
        productIds,
        eventId,
      });
      errorList.push(...coErrors);
    }

    if (errorList.length > 0) {
      Sentry.setContext('products', { products });
      Sentry.setContext('order', { orderData });
      Sentry.setContext('errors', { errorList });
      Sentry.setTag('isClaimOrder', isClaimOrder);
      const issueId = Sentry.captureException(
        new Error('Manual order validation failed', scope =>
          scope.setLevel('error'),
        ),
      );
      throw new Error(
        `Manual order validation falied. Sentry issue id: ${issueId} > ${errorList}`,
      );
    }

    return true;
  });
}

// Fetches/generates questions link for product purchases
import debug from 'debug';
import { dataSources } from '@thatconference/api';
import productStore from '../../dataSources/cloudFirestore/product';

const dlog = debug('that:api:garage:fetchQuestionsLink');
const eventStore = dataSources.cloudFirestore.event;

// Single allocation parameters, not an order's parameters
export const orderAllocationSuccessUrlWithParams = ({
  event,
  product,
  orderAllocationId,
}) => {
  dlog('creating url with parameters');
  if (!orderAllocationId)
    throw new Error('orderAllocationId is a required parameter');
  const eventActivities = new Map();
  if (Array.isArray(product.eventActivities)) {
    product.eventActivities.forEach(activity =>
      eventActivities.set(activity, 1),
    );
  }
  if (product.uiReference === 'SWAG') eventActivities.set('SWAG', 1);
  const params = new URLSearchParams([...eventActivities]);
  params.append('eventId', event.id);
  params.append('orderReference', orderAllocationId);
  const outUrl = `${event.checkoutSuccess}?${params.toString()}`;
  dlog('returing URL %s', outUrl);

  return outUrl;
};

export default async ({ firestore, productId, eventId, orderAllocationId }) => {
  dlog('default called');
  if (!firestore?.collection)
    return Promise.reject(new Error('Invalid firestore reference provided'));
  if (!orderAllocationId)
    return Promise.reject(
      new Error('orderAllocationId is a required parameter'),
    );
  const [product, event] = await Promise.all([
    productStore(firestore).get(productId),
    eventStore(firestore).get(eventId),
  ]);
  if (!event) return Promise.reject(new Error(`Event ${eventId} not found`));
  if (!event.checkoutSuccess)
    return Promise.reject(
      new Error(`No checkout success link for event ${eventId}`),
    );
  if (!product || product.eventId !== event.id)
    return Promise.reject(new Error(`Product ${productId} not found`));

  return orderAllocationSuccessUrlWithParams({
    event,
    product,
    orderAllocationId,
  });
};

import debug from 'debug';
import orderStore from '../../../../dataSources/cloudFirestore/order';

const dlog = debug('that:api:garage:mutation:shared');

export default async function setOaEnrollmentStatus({
  orderAllocationId,
  status,
  firestore,
  user,
}) {
  dlog('setOaEnrollmentStatus called, %s, %s', orderAllocationId, status);
  const result = { result: false, message: '' };

  await orderStore(firestore).updateOrderAllocation({
    orderAllocationId,
    updateAllocation: {
      enrollmentStatus: status,
    },
    user,
  });

  result.result = true;
  result.message = `Successfully saved enrollment status ${status}`;
  return result;
}

import debug from 'debug';
import orderStore from '../../../../dataSources/cloudFirestore/order';

const dlog = debug('that:api:garage:mutation:shared');

export default async function saveOaQuestionResponses({
  orderAllocation,
  responses,
  firestore,
  user,
}) {
  dlog('call saveOaQuestionResponses for OA: %s', orderAllocation.id);
  const result = { success: false, message: '' };

  /*
   * The following block of code will validate that an activity exists
   * to set a t-shirt or hoodie size on an allocation. It was decided
   * to not do this check, though we'll keep this code here if we wish to
   * add the logic back
   */
  // const product = await productStore(firestore).get(
  //   orderAllocation.product,
  // );
  // const { eventActivities } = product;
  // if (responses.tshirtSize && !eventActivities.includes('T_SHIRT')) {
  //   result.message = `Product ${product.name} doesn't include a t-shirt`;
  // } else if (responses.hoodieSize && !eventActivities.includes('HOODIE')) {
  //   result.message = `Product ${product.name} doesn't include a Hoodie`;
  // }
  // if (result.message !== '') return result;

  const oaUpdate = {
    tshirtSize: responses.tshirtSize || null,
    hoodieSize: responses.hoodieSize || null,
    dietaryRequirement: responses.dietaryRequirement || null,
    dietaryOther: responses.dietaryOther || null,
    hasCompletedQuestions: true,
  };

  await orderStore(firestore).updateOrderAllocation({
    orderAllocationId: orderAllocation.id,
    updateAllocation: oaUpdate,
    user,
  });

  result.success = true;
  result.message = 'Questions updated successfully';
  return result;
}

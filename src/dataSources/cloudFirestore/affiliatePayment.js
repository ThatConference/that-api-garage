import debug from 'debug';
import * as Sentry from '@sentry/node';
import { utility } from '@thatconference/api';

const dlog = debug('that:api:garage:datasources:firebase:affiliate');
const { entityDateForge } = utility.firestoreDateForge;
const forgeFields = ['paymentDate', 'createdAt', 'lastUpdatedAt'];
const affiliatePaymentDateForge = entityDateForge({ fields: forgeFields });

const collectionName = 'affiliates';
const subCollectionName = 'payments';

function scrubAffiliatePayment({ payment, isNew = false, userId }) {
  dlog('scrubbing payment');
  const cleanPayment = payment;
  const now = new Date();
  if (isNew) {
    cleanPayment.createdAt = now;
    cleanPayment.createdBy = userId;
    cleanPayment.lastUpdatedAt = now;
    cleanPayment.lastUpdatedBy = userId;
  }
  cleanPayment.lastUpdatedAt = now;
  cleanPayment.lastUpdatedBy = userId;

  return cleanPayment;
}

const affiliatePayment = dbInstance => {
  dlog('instance created');
  Sentry.setTag('app location', 'affiliate payment store');

  const affiliateCollection = dbInstance.collection(collectionName);

  function get({ affiliateId, paymentId }) {
    dlog('get called: %s, %s', affiliateId, paymentId);
    return affiliateCollection
      .doc(affiliateId)
      .collection(subCollectionName)
      .doc(paymentId)
      .get()
      .then(docSnap => {
        let result = null;
        if (docSnap.exists) {
          result = {
            id: docSnap.id,
            ...docSnap.data(),
          };
        }
        return affiliatePaymentDateForge(result);
      });
  }

  function getAllAffiliatePayments(affiliateId) {
    dlog('get all payments for %s', affiliateId);
    return affiliateCollection
      .doc(affiliateId)
      .collection(subCollectionName)
      .get()
      .then(querySnap =>
        querySnap.docs.map(doc => {
          const r = {
            id: doc.id,
            ...doc.data(),
          };
          return affiliatePaymentDateForge(r);
        }),
      );
  }

  function create({ affiliateId, payment, userId }) {
    const paymentId = `payment_${affiliateId}${Math.floor(
      new Date().getTime() / 1000,
    )}`;
    dlog('create %o for %s, id: %s', payment, affiliateId, paymentId);
    const cleanPayment = scrubAffiliatePayment({
      payment,
      isNew: true,
      userId,
    });
    delete cleanPayment.id;
    return affiliateCollection
      .doc(affiliateId)
      .collection(subCollectionName)
      .doc(paymentId)
      .create(cleanPayment)
      .then(() => get({ affiliateId, paymentId }));
  }

  function update({ affiliateId, paymentId, payment, userId }) {
    dlog(
      'update affiliatePayment %s for affiliate %s, %o',
      paymentId,
      affiliateId,
      payment,
    );
    if (!affiliateId)
      throw new Error('affiliateId is required to update affiliate payment');
    if (!paymentId)
      throw new Error('paymentId is required to update affiliate payment');
    const cleanPayment = scrubAffiliatePayment({
      payment,
      userId,
    });

    return affiliateCollection
      .doc(affiliateId)
      .collection(subCollectionName)
      .doc(paymentId)
      .update(cleanPayment)
      .then(() => get({ affiliateId, paymentId }));
  }

  function remove({ affiliateId, paymentId }) {
    dlog('deleting payment %s on affilate %s', paymentId, affiliateId);
    affiliateCollection
      .doc(affiliateId)
      .collection(subCollectionName)
      .doc(paymentId)
      .delete()
      .then(() => ({ id: paymentId }));
  }

  return { get, getAllAffiliatePayments, create, update, remove };
};

export default affiliatePayment;

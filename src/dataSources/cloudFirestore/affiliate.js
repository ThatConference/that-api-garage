import debug from 'debug';
import * as Sentry from '@sentry/node';

const dlog = debug('that:api:garage:datasources:firebase:affiliate');

const collectionName = 'affiliates';
const subCollectionName = 'events';

const scrubAffiliate = ({ product, isNew, userId }) => {
  dlog('scrubProduct called');
  const scrubbedProduct = product;
  const thedate = new Date();
  if (isNew) {
    scrubbedProduct.createdAt = thedate;
    scrubbedProduct.createdBy = userId;
  }
  scrubbedProduct.lastUpdatedAt = thedate;
  scrubbedProduct.lastUpdatedBy = userId;

  return scrubbedProduct;
};

const affiliate = dbInstance => {
  dlog('instance created');
  Sentry.setTag('app location', 'affiliate store');

  const affiliateCollection = dbInstance.collection(collectionName);

  function get(affiliateId) {
    dlog('get %s', affiliateId);
    return affiliateCollection
      .doc(affiliateId)
      .get()
      .then(docSnap => {
        let result = null;
        if (docSnap.exists) {
          result = {
            id: docSnap.id,
            ...docSnap.data(),
          };
        }
        return result;
      });
  }

  function getAll() {
    dlog('get all affiliates');
    return affiliateCollection
      .get()
      .then(querySnap =>
        querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() })),
      );
  }

  function findAffiliateByRefId({ referenceId, affiliateType }) {
    dlog('findAffiliate %s of type %s', referenceId, affiliateType);
    return affiliateCollection
      .where('referenceId', '==', referenceId)
      .where('affiliateType', '==', affiliateType)
      .get()
      .then(querySnap => {
        if (querySnap.size > 1) {
          const err = new Error('multiple affiliate records for id');
          Sentry.withScope(scope => {
            scope.setTags({
              function: 'findAffilateByRefId',
              referenceId,
              affiliateType,
            });
            scope.setLevel('error');
            scope.setContext(
              'Affilate Ids',
              querySnap.docs.map(q => ({ id: q.id })),
            );
            Sentry.captureException(err);
          });
          throw err;
        }
        return querySnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      });
  }

  function getAllAffiliatePromoCodes(affiliateId) {
    dlog('getAllAffiliatePromoCodes %s', affiliateId);
    return affiliateCollection
      .doc(affiliateId)
      .collection(subCollectionName)
      .get()
      .then(querySnap =>
        querySnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })),
      );
  }

  function findAffiliatePromoCodeForEvent({
    affiliateId,
    eventId,
    promoCodeType,
  }) {
    dlog('getAffiliatePromoCodeForEvent %s, %s', affiliateId, eventId);
    return affiliateCollection
      .doc(affiliateId)
      .collection(subCollectionName)
      .doc(eventId)
      .get()
      .then(docSnap => {
        let result = null;
        if (docSnap.exists) {
          result = {
            id: docSnap.id,
            ...docSnap.data(),
          };
          if (promoCodeType && promoCodeType !== result.promoCodeType) {
            result = null;
          }
        }

        return result;
      });
  }

  // TODO: CRUD
  // create affiliate
  // update affiliate
  // create promo code
  // update promo code
  // delete promo code

  return {
    get,
    getAll,
    findAffiliateByRefId,
    getAllAffiliatePromoCodes,
    findAffiliatePromoCodeForEvent,
  };
};

export default affiliate;

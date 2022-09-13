import debug from 'debug';
import * as Sentry from '@sentry/node';

const dlog = debug('that:api:garage:datasources:firebase:affiliate');

const collectionName = 'affiliates';
const subCollectionName = 'events';

const scrubPromoCode = ({ promoCode, isNew = false }) => {
  dlog('scrubbing promotion code');
  const scrubbedPromoCode = promoCode;
  if (isNew) {
    scrubbedPromoCode.eventId = scrubbedPromoCode.id;
  }
  return scrubbedPromoCode;
};

const affiliatePromoCode = dbInstance => {
  dlog('instance created');
  Sentry.setTag('app location', 'affiliate store');

  const affiliateCollection = dbInstance.collection(collectionName);

  function get({ affiliateId, promoCodeId }) {
    dlog('get called: %s, %s', affiliateId, promoCodeId);
    return affiliateCollection
      .doc(affiliateId)
      .collection(subCollectionName)
      .doc(promoCodeId)
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

  function create({ affiliateId, promotionCode: newPromoCode }) {
    dlog('create %o for %s', newPromoCode, affiliateId);
    if (!newPromoCode.id)
      throw new Error(`id is required to create promotion code`);
    const cleanPromoCode = scrubPromoCode({
      promoCode: newPromoCode,
      isNew: true,
    });
    const promoCodeId = cleanPromoCode.id;
    delete cleanPromoCode.id;
    return affiliateCollection
      .doc(affiliateId)
      .collection(subCollectionName)
      .doc(promoCodeId)
      .create(cleanPromoCode)
      .then(() => get({ affiliateId, promoCodeId }));
  }

  function update({ affiliateId, promoCodeId, promotionCode: upPromoCode }) {
    dlog(
      'update promoCode %s for affiliate %s, %o',
      promoCodeId,
      affiliateId,
      upPromoCode,
    );
    if (!affiliateId)
      throw new Error('affiliateId is required to update promotion code');
    if (!promoCodeId)
      throw new Error('promoCodeId is required to updae promotion code');
    const cleanPromoCode = scrubPromoCode({ promoCode: upPromoCode });
    return affiliateCollection
      .doc(affiliateId)
      .collection(subCollectionName)
      .doc(promoCodeId)
      .update(cleanPromoCode)
      .then(() => get({ affiliateId, promoCodeId }));
  }

  function remove({ affiliateId, promoCodeId }) {
    dlog('delete promoCode %s under affiliate %s', promoCodeId, affiliateId);
    return affiliateCollection
      .doc(affiliateId)
      .collection(subCollectionName)
      .doc(promoCodeId)
      .delete()
      .then(() => ({ id: promoCodeId }));
  }

  return {
    get,
    getAllAffiliatePromoCodes,
    findAffiliatePromoCodeForEvent,
    create,
    update,
    remove,
  };
};

export default affiliatePromoCode;

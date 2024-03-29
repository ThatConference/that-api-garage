import debug from 'debug';
import * as Sentry from '@sentry/node';
import { utility } from '@thatconference/api';

const dlog = debug('that:api:garage:datasources:firebase:affiliatePromoCodes');
const { entityDateForge } = utility.firestoreDateForge;
const forgeFields = ['lastUpdatedAt', 'createdAt'];
const promoCodeDateForge = entityDateForge({ fields: forgeFields });

const collectionName = 'affiliatePromoCodes';
// const subCollectionName = 'events';

const scrubPromoCode = ({ promoCode, isNew = false }) => {
  dlog('scrubbing promotion code');
  const scrubbedPromoCode = promoCode;
  const now = new Date();
  if (isNew) {
    scrubbedPromoCode.createdAt = now;
    scrubbedPromoCode.lastUpdatedAt = now;
  }
  scrubbedPromoCode.lastUpdatedAt = now;

  return scrubbedPromoCode;
};

function createPromoCodeId({ affiliateId, eventId, instance = 0 }) {
  return `${affiliateId}|${eventId}|${instance}`;
}

function isAffilateInPromoCodeId({ affiliateId, promoCodeId }) {
  return promoCodeId.toLowerCase().startsWith(affiliateId.toLowerCase());
}

const affiliatePromoCode = dbInstance => {
  dlog('instance created');
  Sentry.configureScope(scope =>
    scope.setTag('app location', 'affiliate promoCode store'),
  );

  const affiliatePromoCodeCollection = dbInstance.collection(collectionName);

  function get(affiliatePromoCodeId) {
    dlog('get called for id %s', affiliatePromoCodeId);

    return affiliatePromoCodeCollection
      .doc(affiliatePromoCodeId)
      .get()
      .then(docSnap => {
        let result = null;
        if (docSnap.exists) {
          result = {
            id: docSnap.id,
            ...docSnap.data(),
          };
          result = promoCodeDateForge(result);
        }

        return result;
      });
  }

  function getAllAffiliatePromoCodes(affiliateId) {
    dlog('getAllAffiliatePromoCodes %s', affiliateId);
    return affiliatePromoCodeCollection
      .where('affiliateId', '==', affiliateId)
      .get()
      .then(querySnap =>
        querySnap.docs.map(doc => {
          const r = {
            id: doc.id,
            ...doc.data(),
          };
          return promoCodeDateForge(r);
        }),
      );
  }

  function findAffiliatePromoCodeForEvent({
    affiliateId,
    eventId,
    promoCodeType,
  }) {
    dlog('getAffiliatePromoCodeForEvent %s, %s', affiliateId, eventId);
    let query = affiliatePromoCodeCollection
      .where('affiliatId', '==', affiliateId)
      .where('eventId', '==', eventId);
    if (promoCodeType) {
      query = query.where('promoCodetype', '==', promoCodeType);
    }

    return query.get().then(querySnap => {
      if (querySnap.size > 1) {
        const err = new Error(
          `multiple promo codes found for affiliate ${affiliateId} and event ${eventId}`,
        );
        Sentry.withScope(scope => {
          scope.setTags({
            function: 'affiliatePromoCode.getAffilatePromoCodeForEvent',
            affiliateId,
            eventId,
          });
          scope.setLevel('error');
          scope.setContext(
            'ids discovered',
            querySnap.docs.map(q => q.id),
          );
          Sentry.captureException(err);
        });
        throw err;
      }
      const [doc] = querySnap.docs;
      let result = null;
      if (doc) {
        result = {
          id: doc.id,
          ...doc.data(),
        };
        result = promoCodeDateForge(result);
      }

      return result;
    });
  }

  function findAllPromoCodesForEvent(eventId) {
    dlog('findAllPromoCodesForEvent %s', eventId);
    return affiliatePromoCodeCollection
      .where('eventId', '==', eventId)
      .get()
      .then(querySnap =>
        querySnap.docs.map(doc => {
          const r = {
            id: doc.id,
            ...doc.data(),
          };
          return promoCodeDateForge(r);
        }),
      );
  }

  function create({ affiliateId, promotionCode: newPromoCode }) {
    dlog('create %o for %s', newPromoCode, affiliateId);
    if (!newPromoCode.eventId)
      throw new Error(`eventId is required to create promotion code`);
    const cleanPromoCode = scrubPromoCode({
      promoCode: newPromoCode,
      isNew: true,
    });
    cleanPromoCode.affiliateId = affiliateId;
    const affiliatePromoCodeId = createPromoCodeId({
      affiliateId,
      eventId: cleanPromoCode.eventId,
    });

    return affiliatePromoCodeCollection
      .doc(affiliatePromoCodeId)
      .create(cleanPromoCode)
      .then(() => get(affiliatePromoCodeId));
  }

  function update({ affiliateId, promoCodeId, promotionCode: upPromoCode }) {
    dlog(
      'update event %s for affiliate %s, %o',
      promoCodeId,
      affiliateId,
      upPromoCode,
    );
    if (!affiliateId)
      throw new Error('affiliateId is required to update promotion code');
    if (!promoCodeId)
      throw new Error('promoCodeId is required to update promotion code');
    if (!isAffilateInPromoCodeId({ affiliateId, promoCodeId }))
      throw new Error('Invalid promo code for affiliate');

    const cleanPromoCode = scrubPromoCode({ promoCode: upPromoCode });
    const affiliatePromoCodeId = promoCodeId;
    return affiliatePromoCodeCollection
      .doc(affiliatePromoCodeId)
      .update(cleanPromoCode)
      .then(() => get(affiliatePromoCodeId));
  }

  function remove({ affiliateId, promoCodeId }) {
    dlog('delete promoCode %s under affiliate %s', promoCodeId, affiliateId);
    if (!isAffilateInPromoCodeId({ affiliateId, promoCodeId }))
      throw new Error('Invalid promo code for affiliate');

    return affiliatePromoCodeCollection
      .doc(promoCodeId)
      .delete()
      .then(() => ({ id: promoCodeId }));
  }

  return {
    get,
    getAllAffiliatePromoCodes,
    findAffiliatePromoCodeForEvent,
    findAllPromoCodesForEvent,
    create,
    update,
    remove,
  };
};

export default affiliatePromoCode;

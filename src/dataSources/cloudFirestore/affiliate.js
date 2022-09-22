import debug from 'debug';
import * as Sentry from '@sentry/node';
import { utility } from '@thatconference/api';

const dlog = debug('that:api:garage:datasources:firebase:affiliate');
const { entityDateForge } = utility.firestoreDateForge;
const forgeFields = ['referralDigestLastSentOn'];
const affiliateDateForge = entityDateForge({ fields: forgeFields });

const collectionName = 'affiliates';

const scrubAffiliate = ({ affiliate, isNew = false, userId }) => {
  dlog('scrubAffiliate called');
  const scrubbedAffiliate = affiliate;
  const now = new Date();
  if (isNew) {
    scrubbedAffiliate.createdAt = now;
    scrubbedAffiliate.createdBy = userId;
    scrubbedAffiliate.referralDigestLastSentOn = now;
    scrubbedAffiliate.lastUpdatedAt = now;
    scrubbedAffiliate.lastUpdatedBy = userId;
  }
  scrubbedAffiliate.lastUpdatedAt = now;
  scrubbedAffiliate.lastUpdatedBy = userId;

  return scrubbedAffiliate;
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
        return affiliateDateForge(result);
      });
  }

  function getAll() {
    dlog('get all affiliates');
    return affiliateCollection.get().then(querySnap =>
      querySnap.docs.map(doc => {
        const r = { id: doc.id, ...doc.data() };
        return affiliateDateForge(r);
      }),
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
              function: 'affilate.findAffilateByRefId',
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
        const [doc] = querySnap.docs;
        let result = null;
        if (doc) {
          result = {
            id: doc.id,
            ...doc.data(),
          };
          affiliateDateForge(result);
        }

        return result;
      });
  }

  async function create({ affiliate: newAffiliate, userId }) {
    dlog('creating: %o', newAffiliate);
    if (!newAffiliate.id)
      throw new Error('id (code) is required to create an affiliate');
    if (!userId) throw new Error('userId required to create new affilate');
    const cleanAffiliate = scrubAffiliate({
      affiliate: newAffiliate,
      isNew: true,
      userId,
    });
    const check = await findAffiliateByRefId({
      referenceId: cleanAffiliate.referenceId,
      affiliateType: cleanAffiliate.affiliateType,
    });
    if (check.length > 0) {
      const err = new Error(
        `reference ${cleanAffiliate.referenceId} already an affiliate (${check[0].id})`,
      );
      Sentry.withScope(scope => {
        scope.setTags({
          function: 'create',
          referenceId: cleanAffiliate.referenceId,
          affiliateType: cleanAffiliate.affiliateType,
        });
        scope.setLevel('error');
        scope.setContext(
          'new affiliate object',
          JSON.stringify(cleanAffiliate),
        );
        scope.setContext('found affiliate', JSON.stringify(check));
        Sentry.captureException(err);
      });
      throw err;
    }
    const affiliateId = cleanAffiliate.id;
    delete cleanAffiliate.id;
    return affiliateCollection
      .doc(affiliateId)
      .create(cleanAffiliate)
      .then(() => get(affiliateId));
  }

  function update({ affiliateId, affiliate: upAffiliate, userId }) {
    dlog('update affiliate %s with %o', affiliateId, upAffiliate);
    scrubAffiliate({ affiliate: upAffiliate, userId });
    return affiliateCollection
      .doc(affiliateId)
      .update(upAffiliate)
      .then(() => get(affiliateId));
  }

  return {
    get,
    getAll,
    findAffiliateByRefId,
    create,
    update,
  };
};

export default affiliate;

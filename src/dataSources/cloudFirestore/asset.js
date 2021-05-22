import debug from 'debug';
import { utility } from '@thatconference/api';
import * as Sentry from '@sentry/node';

const { dateForge } = utility.firestoreDateForge;
const dlog = debug('that:api:assets:datasources:firebase');
const collectionName = 'assets';
const assignmentColName = 'assetAssignments';

function scrubAsset({ asset, isNew, user }) {
  const dirtyAsset = asset;
  const now = new Date();
  if (isNew) {
    dirtyAsset.createdAt = now;
    dirtyAsset.createdBy = user.sub;
    if (!dirtyAsset.links) dirtyAsset.links = [];
  }
  dirtyAsset.lastUpdatedAt = now;
  dirtyAsset.lastUpdatedBy = user.sub;

  if (dirtyAsset.links)
    dirtyAsset.links = dirtyAsset.links.map(l => ({
      linkType: l.linkType,
      url: l.url.toString(),
    }));

  return dirtyAsset;
}

// TODO move fixDates to that-api once Asset is more finalized
function fixDates({ asset }) {
  const assetOut = asset;
  if (asset.createdAt) assetOut.createdAt = dateForge(asset.createdAt);
  if (asset.lastUpdatedAt)
    assetOut.lastUpdatedAt = dateForge(asset.lastUpdatedAt);
  if (asset.startTime) assetOut.startTime = dateForge(asset.startTime);
  if (asset.stopTime) assetOut.stopTime = dateForge(asset.stopTime);

  return assetOut;
}

function assets(dbInstance) {
  dlog('sessions data source created');
  const assetCollection = dbInstance.collection(collectionName);
  const assignmentCollection = dbInstance.collection(assignmentColName);

  async function get(assetId) {
    dlog('get asset %s', assetId);
    const docSnap = await assetCollection.doc(assetId).get();
    let result = null;
    if (docSnap.exists) {
      result = {
        id: docSnap.id,
        ...docSnap.data(),
      };
      result = fixDates({ asset: result });
    }

    return result;
  }

  function getBatch(ids) {
    dlog('getBatch for %d asset ids', ids.length);
    if (!Array.isArray(ids))
      throw new Error('getBatch must receive an array of ids');

    return Promise.all(ids.map(id => get(id)));
  }

  async function setAssignmentsBatch({
    firestoreBatch,
    user,
    assignments,
    assetId,
  }) {
    dlog('set assignments batch %o', assignments);
    // TODO: verify that user may assign asset to given entity
    // as owner of asset they may remove it from any entity
    const writeBatch = firestoreBatch;
    const { docs } = await assignmentCollection
      .where('assetId', '==', assetId)
      .select()
      .get();
    docs.forEach(doc => writeBatch.delete(assignmentCollection.doc(doc.id)));

    const createdAt = new Date();
    const createdBy = user.sub;
    assignments.forEach(assignment => {
      const docref = assignmentCollection.doc();
      const newAssignment = {
        assetId,
        entityId: assignment.entityId,
        entityType: assignment.entityType,
        createdAt,
        createdBy,
      };
      writeBatch.create(docref, newAssignment);
    });

    return true;
  }

  async function create({ user, newAsset }) {
    dlog('create asset %o', newAsset);
    const cleanAsset = scrubAsset({
      asset: newAsset,
      isNew: true,
      user,
    });
    cleanAsset.owner = {};
    if (newAsset.setOwner && newAsset.setOwner.ownerId) {
      // TODO: check that user is allowed to set entity as owner
      cleanAsset.owner.entityType = newAsset.setOwner.entityType;
      cleanAsset.owner.id = newAsset.setOwner.ownerId;
    } else {
      cleanAsset.owner.entityType = 'MEMBER';
      cleanAsset.owner.id = user.sub;
    }
    delete cleanAsset.setOwner;

    const newAssetDocRef = assetCollection.doc();
    const writeBatch = dbInstance.batch();
    // assignments
    const { assignments } = newAsset;
    let okayToContinue = false;
    if (assignments) {
      // eslint-disable-next-line no-unused-vars
      okayToContinue = await setAssignmentsBatch({
        firestoreBatch: writeBatch,
        user,
        assignments,
        assetId: newAssetDocRef.id,
      });
    }
    delete cleanAsset.assignments;

    writeBatch.create(newAssetDocRef, cleanAsset);
    try {
      await writeBatch.commit();
    } catch (err) {
      dlog('failed create asset batch write: %O', err);
      Sentry.withScope(scope => {
        scope.setLevel('error');
        scope.setContext(
          'failed create asset batch write',
          { newAsset },
          { cleanAsset },
          { user: user.sub },
          { err },
        );
        Sentry.captureException(err);
      });
      throw new Error(
        'ailed create asset batch write:\n%o\n%o',
        cleanAsset,
        err,
      );
    }

    dlog('create finished %o', cleanAsset);
    return get(newAssetDocRef.id);
  }

  async function update({ user, assetId, asset }) {
    dlog('update asset %s', assetId);
    const cleanAsset = scrubAsset({ asset, user });
    const writeBatch = dbInstance.batch();
    const docRef = assetCollection.doc(assetId);
    const { assignments } = cleanAsset;
    if (assignments) {
      await setAssignmentsBatch({
        firestoreBatch: writeBatch,
        user,
        assignments,
        assetId,
      });
    }
    delete cleanAsset.assignments;
    writeBatch.update(docRef, cleanAsset);
    try {
      await writeBatch.commit();
    } catch (err) {
      dlog('failed update asset batch write: %O', err);
      Sentry.withScope(scope => {
        scope.setLevel('error');
        scope.setContext(
          'failed update asset batch write',
          { asset },
          { cleanAsset },
          { user: user.sub },
          { err },
        );
        Sentry.captureException(err);
      });
      throw new Error(
        'failed update asset batch write\n%o\n%o',
        cleanAsset,
        err,
      );
    }

    return get(assetId);
  }

  async function getAssetAssignments(assetId) {
    const { docs } = await assignmentCollection
      .where('assetId', '==', assetId)
      .get();

    return docs.map(doc => {
      const a = doc.data();
      return {
        id: a.entityId,
        entityType: a.entityType,
      };
    });
  }

  return {
    get,
    getBatch,
    create,
    update,
    getAssetAssignments,
  };
}

export default assets;

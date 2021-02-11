import debug from 'debug';
import { utility } from '@thatconference/api';

const dlog = debug('that:api:garage:datasources:firebase:members');
const { entityDateForge } = utility.firestoreDateForge;
const forgeFields = ['createdAt', 'lastUpdatedAt', 'membershipExpirationDate'];
const memberDateForge = entityDateForge({ fields: forgeFields });

const collectionName = 'members';

const member = dbInstance => {
  dlog('instance created');

  const memberCollection = dbInstance.collection(collectionName);

  function get(memberId) {
    dlog('get %s', memberId);
    return memberCollection
      .doc(memberId)
      .get()
      .then(docSnapshot => {
        let result = null;
        if (docSnapshot.exists) {
          result = {
            id: docSnapshot.id,
            ...docSnapshot.data(),
          };
          result = memberDateForge(result);
        }

        return result;
      });
  }

  function getIdType(memberId) {
    return get(memberId).then(m => {
      let typename = 'PrivateProfile';
      if (m.canFeature) typename = 'PublicProfile';
      return {
        id: m.id,
        __typename: typename,
      };
    });
  }

  function getBatch(ids) {
    dlog('getBatch called %d ids', ids.length);
    if (!Array.isArray(ids))
      throw new Error('getBatch must receive an array of ids');
    return Promise.all(ids.map(id => getIdType(id)));
  }

  async function update({ memberId, profile }) {
    dlog('update %s', memberId);
    const docRef = memberCollection.doc(memberId);
    const moddedProfile = profile;
    moddedProfile.lastUpdatedAt = new Date();
    await docRef.update(moddedProfile);

    return get(memberId);
  }

  return {
    get,
    getBatch,
    update,
  };
};

export default member;

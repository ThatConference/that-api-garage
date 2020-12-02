import debug from 'debug';
import { utility } from '@thatconference/api';

const dlog = debug('that:api:garage:datasources:firebase:product');
const { dateForge } = utility.firestoreDateForge;

const collectionName = 'orders';

const scrubOrder = ({ order, isNew, userId }) => {
  dlog('scrubProduct called');
  const scrubbedOrder = order;
  const thedate = new Date();
  if (isNew) {
    scrubbedOrder.createdAt = thedate;
    scrubbedOrder.createdBy = userId;
  }
  scrubbedOrder.lastUpdatedAt = thedate;
  scrubbedOrder.lastUpdatedBy = userId;

  return scrubbedOrder;
};

const order = dbInstance => {
  dlog('instance created');

  const orderCollection = dbInstance.collection(collectionName);

  function get(id) {
    dlog('get called %s', id);
    return orderCollection
      .doc(id)
      .get()
      .then(doc => {
        let result = null;
        if (doc.exists) {
          result = {
            id: doc.data(),
            ...doc.data(),
          };
          // TODO Date Forge
        }
        return result;
      });
  }

  function getBatch(ids) {
    if (!Array.isArray(ids))
      throw new Error('getBatch must receive an array of ids');
    dlog('getBatch called %d ids', ids.length);
    return Promise.all(ids.map(id => get(id)));
  }

  return {
    get,
    getBatch,
  };
};

export default order;

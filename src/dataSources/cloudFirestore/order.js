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

const order = dbInstance => {};

export default order;

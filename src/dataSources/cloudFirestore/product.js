import debug from 'debug';
import { productDateForge } from '../../lib/productDateForge';

const dlog = debug('that:api:garage:datasources:firebase:product');

const collectionName = 'products';

const scrubProduct = ({ product, isNew, userId }) => {
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

const product = dbInstance => {
  dlog('instance created');

  const productCollection = dbInstance.collection(collectionName);

  function get(id) {
    dlog('get called %s', id);
    return productCollection
      .doc(id)
      .get()
      .then(doc => {
        let result = null;
        if (doc.exists) {
          result = {
            id: doc.id,
            ...doc.data(),
          };
          result = productDateForge(result);
        }
        return result;
      });
  }

  function getBatch(ids) {
    if (!Array.isArray(ids))
      throw new Error('getBatch must receive an array of ids');
    return Promise.all(ids.map(id => get(id)));
  }

  async function create({ newProduct, userId }) {
    dlog('create called');
    const scrubbedProduct = scrubProduct({
      product: newProduct,
      isNew: true,
      userId,
    });
    const newDoc = await productCollection.add(scrubbedProduct);

    return get(newDoc.id);
  }

  async function update({ productId, newProduct, userId }) {
    dlog('update called');
    const scrubbedProduct = scrubProduct({ product: newProduct, userId });
    const docRef = productCollection.doc(productId);
    await docRef.update(scrubbedProduct);

    return get(docRef.id);
  }

  return {
    get,
    getBatch,
    create,
    update,
  };
};

export default product;

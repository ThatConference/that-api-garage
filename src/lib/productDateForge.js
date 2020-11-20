import { utility } from '@thatconference/api';

const { dateForge } = utility.firestoreDateForge;

export const productDateForge = product => {
  const forgedProduct = product;
  if (product.createdAt) forgedProduct.createdAt = dateForge(product.createdAt);
  if (product.lastUpdatedAt)
    forgedProduct.lastUpdatedAt = dateForge(product.lastUpdatedAt);

  return forgedProduct;
};

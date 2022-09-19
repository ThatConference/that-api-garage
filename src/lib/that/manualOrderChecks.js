// Order structure checks for manaual orders
// not for claim orders

export default function manualOrderChecks({
  products = [],
  productIds = [],
  eventId,
}) {
  const errorList = [];

  if (products.length !== productIds.length) {
    errorList.push(
      `Not all products in manual order found in product collection`,
    );
  }
  if (
    products.filter(p => p.eventId === eventId).length !== productIds.length
  ) {
    errorList.push(
      `Product(s) in manual order which don't exist in eventId ${eventId}`,
    );
  }
  if (products.filter(p => p.type === 'MEMBERSHIP').length > 0) {
    errorList.push(
      `'MEMBERSHIP' type products cannot be added to manual orders`,
    );
  }
  const now = new Date();
  if (products.filter(p => p.onSaleFrom && p.onSaleFrom > now).length > 0) {
    errorList.push(`Product not available for sale (date)`);
  }
  if (products.filter(p => p.onSaleUntil && p.onSaleUntil < now).length > 0) {
    errorList.push(`Product not available for sale (date)`);
  }
  return errorList;
}

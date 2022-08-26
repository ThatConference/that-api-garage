// order checks for claim orders
// inclusive after manual order checks

// eslint-disable-next-line no-unused-vars
export default function claimOrderChecks({ products, productIds, eventId }) {
  const errorList = [];

  if (products.length !== 1 || productIds.length !== 1) {
    errorList.push(`Claim orders must have exactly 1 line item`);
  }
  if (products.filter(p => p.isClaimable !== true).length > 0) {
    errorList.push(`Product on order is not a claimable product`);
  }
  if (products.filter(p => p?.processor?.processor !== 'THAT').length > 0) {
    errorList.push(`Only THAT processed products can be claimed`);
  }
  if (products.filter(p => p?.uiReference !== 'CLAIMABLE_TICKET').length > 0) {
    errorList.push(`Product uiReference not CLAIMABLE_TICKET.`);
  }

  return errorList;
}

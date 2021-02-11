import root from './root';

import { fieldResolvers as productsFields } from './products';
import { fieldResolvers as productFields } from './product';
import { fieldResolvers as ordersFields } from './orders';
import { fieldResolvers as orderFields } from './order';
import { fieldResolvers as meOrderFields } from './meOrders';
import { fieldResolvers as lineItemFields } from './lineItem';
import { fieldResolvers as orderAllocationFields } from './orderAllocation';
import { fieldResolvers as publicOrderAllocationFields } from './publicOrderAllocation';
import { fieldResolvers as mePortalFields } from './mePortal';

export default {
  ...root,
};

export const fieldResolvers = {
  ...productsFields,
  ...productFields,
  ...ordersFields,
  ...orderFields,
  ...meOrderFields,
  ...lineItemFields,
  ...orderAllocationFields,
  ...publicOrderAllocationFields,
  ...mePortalFields,
};

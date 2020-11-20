import rootMutations from './root';

import { fieldResolvers as productsFields } from './products';
import { fieldResolvers as productFields } from './product';
import { fieldResolvers as productCreateFields } from './productCreate';
import { fieldResolvers as productUpdateFields } from './productUpdate';

export default {
  ...rootMutations,
};

export const fieldResolvers = {
  ...productsFields,
  ...productFields,
  ...productCreateFields,
  ...productUpdateFields,
};

import rootMutations from './root';

import { fieldResolvers as notificationFields } from './notification';
import { fieldResolvers as notificationsFields } from './notifications';

export default {
  ...rootMutations,
};

export const fieldResolvers = {
  ...notificationsFields,
  ...notificationFields,
};

import root from './root';

import { fieldResolvers as notificationsFields } from './notifications';
import { refResolvers as notificationRefResolvers } from './notification';

export default {
  ...root,
};

export const fieldResolvers = {
  ...notificationRefResolvers,
  ...notificationsFields,
};

import {
  URLResolver as URL,
  EmailAddressResolver as EmailAddress,
} from 'graphql-scalars';
import { graph } from '@thatconference/api';
import queries, { fieldResolvers as qFieldResolvers } from './queries';
import mutations, { fieldResolvers as mFieldResolvers } from './mutations';

const createServer = {
  URL,
  EmailAddress,
  ...graph.scalars.date,
  Query: {
    ...queries,
  },
  Mutation: {
    ...mutations,
  },
  ...qFieldResolvers,
  ...mFieldResolvers,
};

export default createServer;

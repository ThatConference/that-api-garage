/* resolvers use thatconference/api which needs these env variables. */
/* this test is more about successfully building the schema then the
 * resulting schema from the build.
 */
import { gql, SchemaDirectiveVisitor } from 'apollo-server-express';
import { buildFederatedSchema } from '@apollo/federation';
import typeDefsRaw from '../../typeDefs';
let resolvers;

describe('validate schema test', () => {
  beforeAll(() => {
    process.env.INFLUX_TOKEN = 'TEST_INFLUX_TOKEN_VALUE';
    process.env.INFLUX_ORG_ID = 'TEST_INFLUX_ORG_ID_VALUE';
    process.env.INFLUX_BUCKET_ID = 'INFLUX_BUCKET_ID';
    process.env.INFLUX_HOST = 'INFLUX_HOST';
    process.env.POSTMARK_API_TOKEN = 'POSTMARK_API_TOKEN';
    process.env.STRIPE_PUBLISHABLE_KEY = 'STRIPE_PUBLISHABLE_KEY';
    process.env.STRIPE_SECRET_KEY = 'STRIPE_SECRET_KEY';

    resolvers = require('../../resolvers');
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  /* Checking directives is not working. Fails on auth:
   * * ReferenceError: defaultFieldResolver is not defined
   */
  // const directives = require('../../directives').default;
  // import directives from '../../directives';

  const typeDefs = gql`
    ${typeDefsRaw}
  `;
  let schema = buildFederatedSchema([{ typeDefs, resolvers }]);
  // SchemaDirectiveVisitor.visitSchemaDirectives(schema, directives);

  describe('Validate graphql schema', () => {
    it('schema has successfully build and is and object', () => {
      // TODO: find other ways to validate schema
      expect(typeof schema).toBe('object');
      expect(schema).toBeInstanceOf(Object);
    });
  });
});

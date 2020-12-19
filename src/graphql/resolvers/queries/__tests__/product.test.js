import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeTypeDefs } from '@graphql-tools/merge';
import path from 'path';
import { fieldResolvers } from '../product';
import { productTypeEnum } from '@thatconference/schema';

// Instead of reading the enter schema, we'll only look at enums
// which what we want.
const enumsTypesArray = loadFilesSync(
  path.join(__dirname, '../../../typeDefs/dataTypes/enums/*.graphql'),
);

const enums = mergeTypeDefs([enumsTypesArray, productTypeEnum], { all: true });

const allEnums = enums.definitions.filter(e => e.kind === 'EnumTypeDefinition');
// console.log('all enum types', allEnums);

const types = [
  {
    type: 'TICKET',
    result: 'Ticket',
  },
  {
    type: 'MEMBERSHIP',
    result: 'Membership',
  },
  {
    type: 'PARTNERSHIP',
    result: 'Partnership',
  },
  {
    type: 'FOOD',
    result: 'Food',
  },
];

describe('Product type tests', () => {
  describe('All ProductType enum values will be resolved', () => {
    const productTypeEnums = allEnums
      .filter(a => a.name.kind === 'Name' && a.name.value === 'ProductType')
      .map(r => r.values)[0]
      .map(r => r.name.value);
    // console.log('productTypeEnums', productTypeEnums);
    it('will have more than 0 values', () => {
      expect(productTypeEnums.length).toBeGreaterThan(0);
    });
    productTypeEnums.forEach(pte => {
      it(`${pte} will resolve to typeof string`, () => {
        const result = fieldResolvers.Product.__resolveType({ type: pte });
        expect(typeof result).toBe('string');
      });
    });
  });

  describe('__resolveType will resolve to the correct type', () => {
    types.forEach(type => {
      it(`will resolve for type ${type.type}`, () => {
        const result = fieldResolvers.Product.__resolveType(type);
        expect(result).toBe(type.result);
      });
    });
  });
});

/* gql 
    {
      kind: 'Document',
      definitions: [
        {
          kind: 'EnumTypeDefinition',
          description: undefined,
          name: [Object],
          directives: [],
          values: [Array]
        },
        {
          kind: 'SchemaDefinition',
          description: undefined,
          directives: [],
          operationTypes: [Array]
        }
      ],
      loc: { start: 0, end: 95 }
    }

*/

/* value of definitions 0 values
  [
    {
      kind: 'EnumValueDefinition',
      description: undefined,
      name: { kind: 'Name', value: 'TICKET' },
      directives: []
    },
    {
      kind: 'EnumValueDefinition',
      description: undefined,
      name: { kind: 'Name', value: 'MEMBERSHIP' },
      directives: []
    },
    {
      kind: 'EnumValueDefinition',
      description: undefined,
      name: { kind: 'Name', value: 'PARTNERSHIP' },
      directives: []
    },
    {
      kind: 'EnumValueDefinition',
      description: undefined,
      name: { kind: 'Name', value: 'FOOD' },
      directives: []
    }
  ]
*/

/* allEnums
    [
      {
        kind: 'EnumTypeDefinition',
        description: undefined,
        name: { kind: 'Name', value: 'ProductType' },
        directives: [],
        values: [ [Object], [Object], [Object], [Object] ]
      }
    ]

*/

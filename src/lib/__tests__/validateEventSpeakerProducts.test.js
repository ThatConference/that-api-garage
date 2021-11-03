import validateEventSpeakerProducts from '../validateEventSpeakerProducts';

describe('tests for function validateEventSpeakerProducts', () => {
  describe('valid products', () => {
    it('will return message on unsupported products', () => {
      const r = validateEventSpeakerProducts(['unknown', 'CAMPMATE']);
      expect(r.isValid).toBe(false);
      expect(r.message).toBe(`invalid products provided.`);
    });
    it('well return empty message on all suported prodcuts', () => {
      const r = validateEventSpeakerProducts(['COUNSELOR_AT_THAT', 'CAMPMATE']);
      expect(r.isValid).toBe(true);
      expect(r.message.length).toBe(0);
    });
  });

  describe('validate product counts', () => {
    const productCountTests = [
      {
        isValid: false,
        rmessage: 'At least one product must be provided',
        tvalues: [],
        title: 'At least 1 product is required',
      },
      {
        isValid: false,
        rmessage: 'Do not include more than 1 Counselor ticket',
        tvalues: ['COUNSELOR_AT_THAT', 'COUNSELOR_AT_THAT', 'GEEKLING'],
        title: 'validate counselor count',
      },
      {
        isValid: false,
        rmessage: 'Do not include more than 1 Counselor ticket',
        tvalues: ['COUNSELOR_ON_THAT', 'COUNSELOR_ON_THAT'],
        title: 'validate counselor count',
      },
      {
        isValid: false,
        rmessage: 'Do not include more than 1 Counselor ticket',
        tvalues: ['COUNSELOR_AT_THAT', 'COUNSELOR_ON_THAT'],
        title: 'validate counselor count',
      },
      {
        isValid: false,
        rmessage: 'Ensure 1 counselor ticket is included',
        tvalues: ['GEEKLING'],
        title: 'validate counselor, at least 1',
      },
      {
        isValid: true,
        rmessage: '',
        tvalues: ['COUNSELOR_AT_THAT', 'GEEKLING', 'CAMPMATE'],
        title: 'validate counselor count',
      },
      {
        isValid: false,
        rmessage: `Do not include more that 1 Campmate ticket`,
        tvalues: ['COUNSELOR_AT_THAT', 'CAMPMATE', 'CAMPMATE'],
        title: 'campmate count',
      },
      {
        isValid: false,
        rmessage: 'Do not include more than 2 Geekling tickets',
        tvalues: ['COUNSELOR_AT_THAT', 'GEEKLING', 'GEEKLING', 'GEEKLING'],
        title: 'geekling count',
      },
      {
        isValid: true,
        rmessage: '',
        tvalues: ['COUNSELOR_AT_THAT', 'CAMPMATE', 'GEEKLING', 'GEEKLING'],
        title: 'campmate/geekling count, 1/2 count',
      },
      {
        isValid: true,
        rmessage: '',
        tvalues: ['COUNSELOR_AT_THAT', 'CAMPMATE', 'GEEKLING'],
        title: 'campmate/geekling count, 1 each',
      },
      {
        isValid: false,
        rmessage: `Geekling and/or Campmate tickets are invalid with an ON THAT Counselor ticket`,
        tvalues: ['COUNSELOR_ON_THAT', 'CAMPMATE', 'GEEKLING'],
        title: 'ON THAT, campmate/geekling count',
      },
      {
        isValid: false,
        rmessage: `Geekling and/or Campmate tickets are invalid with an ON THAT Counselor ticket`,
        tvalues: ['COUNSELOR_ON_THAT', 'GEEKLING'],
        title: 'ON THAT, campmate/geekling count',
      },
      {
        isValid: false,
        rmessage: `Geekling and/or Campmate tickets are invalid with an ON THAT Counselor ticket`,
        tvalues: ['COUNSELOR_ON_THAT', 'CAMPMATE'],
        title: 'ON THAT, campmate/geekling count',
      },
      {
        isValid: true,
        rmessage: ``,
        tvalues: ['COUNSELOR_ON_THAT'],
        title: 'ON THAT counselor only',
      },
    ];
    for (let i = 0; i < productCountTests.length; i += 1) {
      const test = productCountTests[i];
      it(`count test ${i}, ${test.title} will validate: ${test.isValid}`, () => {
        const r = validateEventSpeakerProducts(test.tvalues);
        expect(r.isValid).toBe(test.isValid);
        expect(r.message).toBe(test.rmessage);
      });
    }
  });
});

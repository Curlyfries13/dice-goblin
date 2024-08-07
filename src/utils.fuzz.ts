import fc from 'fast-check';
import { binomialCoefficient } from './utils';

describe('binomialCoefficient', () => {
  it('calculates trivial results correctly', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000000 }), (param) => {
        const result = binomialCoefficient(param, param);
        expect(result).toBe(1);
      }),
    );
  });
  it('calculates null result correctly', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000000 }), (param) => {
        const result = binomialCoefficient(param, 0);
        expect(result).toBe(1);
      }),
    );
  });
  it('calculates unit result correctly', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000000 }), (param) => {
        const result = binomialCoefficient(param, 1);
        expect(result).toBe(param);
      }),
    );
  });
  it('is symmetrical', () => {
    fc.assert(
      fc.property(fc.integer({ min: 3, max: 1000000 }), fc.integer({ min: 1, max: 500000 }), (distribution, offset) => {
        const mid = Math.ceil(distribution / 2);
        fc.pre(offset < mid);
        const a = binomialCoefficient(distribution, offset);
        const b = binomialCoefficient(distribution, distribution - offset);
        expect(a).toEqual(b);
      }),
    );
  });
});

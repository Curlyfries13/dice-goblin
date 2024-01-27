import fc from 'fast-check';
import Add from './Add';
import { Constant } from '../Constant';
import { PolyDiceGroup } from '../PolyDiceGroup';

describe('Add modifier test', () => {
  it('generates stat blocks as expected', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (valA, valB) => {
        const termA = new Constant(valA);
        const termB = new Constant(valB);
        const combination = new Add(termA, termB);
        expect(combination.statProps.min).toBe(valA + valB);
        expect(combination.statProps.max).toBe(valA + valB);
      }),
    );
  });
});

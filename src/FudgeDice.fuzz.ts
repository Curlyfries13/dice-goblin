import fc from 'fast-check';
import FudgeDiceGroup from 'FudgeDice';

describe('Fudge Dice Group', () => {
  it('calculates the fudge dice average correctly', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 1000000 }), (count) => {
        const dice = new FudgeDiceGroup(count);
        // interestingly, the average roll on any fudge die is 0
        expect(dice.statProps.average).toBe(0);
      }),
    );
  });
});

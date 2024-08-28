import fc from 'fast-check';
import PolyDiceGroup from './PolyDiceGroup';
import Constant from './Constant';

describe('PolyDice Dice Group statistics', () => {
  it('calculates dice average correctly', () => {
    fc.assert(
      fc.property(
        // sides
        fc.integer({ min: 1, max: 1000000 }),
        // count
        fc.integer({ min: 1, max: 1000000 }),
        (sides, count) => {
          const sidesGen = new Constant(sides);
          const countGen = new Constant(count);
          const dice = new PolyDiceGroup(sidesGen, countGen);

          expect(dice.statProps.average).toBe(
            (countGen.statProps.max * (sidesGen.statProps.max + 1)) / 2,
          );
        },
      ),
    );
  });
  // NOTE: this really feels like an integration test
  it('calculates dice minimum from constant generators correctly', () => {
    fc.assert(
      fc.property(
        // count
        fc.integer({ min: 1, max: 1000000 }),
        // sides
        fc.integer({ min: 1, max: 1000000 }),
        (sides, count) => {
          const sidesGen = new Constant(sides);
          const countGen = new Constant(count);
          const dice = new PolyDiceGroup(sidesGen, countGen);

          expect(dice.statProps.min).toBe(count);
        },
      ),
    );
  });
  it('calculates dice maximum correctly', () => {
    fc.assert(
      fc.property(
        // count
        fc.integer({ min: 1, max: 1000000 }),
        // sides
        fc.integer({ min: 1, max: 1000000 }),
        (sides, count) => {
          const sidesGen = new Constant(sides);
          const countGen = new Constant(count);
          const dice = new PolyDiceGroup(sidesGen, countGen);

          expect(dice.statProps.max).toBe(count * sides);
        },
      ),
    );
  });
});

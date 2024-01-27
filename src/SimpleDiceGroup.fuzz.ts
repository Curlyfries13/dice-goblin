import fc from 'fast-check';
import { SimpleDiceGroup } from './SimpleDiceGroup';

describe('Simple Dice Group statistics', () => {
  it('calculates dice average correctly', () => {
    fc.assert(
      fc.property(
        // sides
        fc.integer({ min: 1, max: 1000000 }),
        // count
        fc.integer({ min: 1, max: 1000000 }),
        (sides, count) => {
          const dice = new SimpleDiceGroup(sides, count);

          expect(dice.statProps.average).toBe((count * (sides + 1)) / 2);
        },
      ),
    );
  });
  it('calculates dice minimum correctly', () => {
    fc.assert(
      fc.property(
        // count
        fc.integer({ min: 1, max: 1000000 }),
        // sides
        fc.integer({ min: 1, max: 1000000 }),
        (sides, count) => {
          const dice = new SimpleDiceGroup(sides, count);

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
          const dice = new SimpleDiceGroup(sides, count);

          expect(dice.statProps.max).toBe(count * sides);
        },
      ),
    );
  });
});

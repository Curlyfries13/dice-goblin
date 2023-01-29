import fc from 'fast-check';

import { PolyDiceGroup } from '../PolyDiceGroup';
import { FudgeDiceGroup } from '../FudgeDice';
import { Constant } from '../Constant';

import Drop from './Drop';
import KeepDropMode from './KeepDropMode';

describe('Drop Modifier Fuzzing', () => {
  it('Modifies the counts of the mod', () => {
    fc.assert(
      fc.property(
        // sides
        fc.integer({ min: 1, max: 1000000 }),
        // count & drop: these are dependent
        // we shouldn't be testing if we can drop more than the count - that should be an error
        fc.integer({ min: 1, max: 1000000 }).chain((count) => fc.tuple(fc.constant(count), fc.nat({ max: count }))),
        // drop mode
        fc.boolean(),
        (sides, countDrop, lowHigh) => {
          const sidesGen = new Constant(sides);
          const countGen = new Constant(countDrop[0]);
          const dropGen = new Constant(countDrop[1]);
          const baseDice = new PolyDiceGroup(sidesGen, countGen);
          const drop = new Drop(baseDice, dropGen, lowHigh ? KeepDropMode.Low : KeepDropMode.High);
          drop.rollGroup();
          expect(drop.count.value()).toBe(countGen.value() - dropGen.value());
        }
      )
    );
  });
  it('Drops fudge dice', () => {
    fc.assert(
      fc.property(
        // count & drop: these are dependent
        // we shouldn't be testing if we can drop more than the count - that should be an error
        fc.integer({ min: 1, max: 1000000 }).chain((count) => fc.tuple(fc.constant(count), fc.nat({ max: count }))),
        // drop mode
        fc.boolean(),
        (countDrop, lowHigh) => {
          const dropGen = new Constant(countDrop[1]);
          const baseDice = new FudgeDiceGroup(countDrop[0]);
          const drop = new Drop(baseDice, dropGen, lowHigh ? KeepDropMode.Low : KeepDropMode.High);
        }
      )
    );
  });
});

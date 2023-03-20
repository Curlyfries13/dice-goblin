import Keep from './Keep';
import seedrandom from 'seedrandom';
import { SimpleDiceGroup } from '../SimpleDiceGroup';
import { ConstantDiceGroup } from '../ConstantDiceGroup';
import { FudgeDiceGroup } from '../FudgeDice';

describe.each([
  [10, 6, 3],
  [9, 4, 1],
  [2, 20, 1],
])('keeps a specified number of dice from a roll', (count, sides, keep) => {
  const dice = new SimpleDiceGroup(sides, count);
  const mod = new Keep(dice, keep);
  const result = mod.rollGroup();
  expect(result.length).toEqual(keep + 1);
});

it('keeps fudge dice', () => {
  const dice = new FudgeDiceGroup(5);
  const mod = new Keep(dice, 2);
  const result = mod.rollGroup();
  expect(result.length).toEqual(3);
});

it('keeps the highest die automatically', () => {
  const dice = new ConstantDiceGroup([1, 2, 3, 4]);
  const mod = new Keep(dice, 1);
  const result = mod.rollGroup();
  expect(result[0]).toBe(4);
});

it('should behave predictably with provided seed', () => {
  const rng = seedrandom('test');
  const dice = new SimpleDiceGroup(6, 4, rng);
  const mod = new Keep(dice, 1);
  expect(mod.roll()).toMatchSnapshot();
});

import Drop from './Drop';
import seedrandom from 'seedrandom';
import { SimpleDiceGroup } from '../SimpleDiceGroup';
import { ConstantDiceGroup } from '../ConstantDiceGroup';
import { FudgeDiceGroup } from '../FudgeDice';
import { Constant } from '../Constant';

describe.each([
  [10, 6, 3],
  [20, 6, 5],
  [9, 4, 1],
  [2, 20, 1],
])('Drops a specified number of dice from a roll', (count, sides, drop) => {
  const dice = new SimpleDiceGroup(sides, count);
  const mod = new Drop(dice, new Constant(drop));
  const result = mod.rollGroup();
  expect(result.length).toEqual(count - drop + 1);
});

// generated values that we've made through brute force
describe.each([
  [4, 2, 1, 3, 1],
  [4, 2, 1, 2, 0],
  [4, 2, 1, 4, 4],
  [4, 2, 1, 5, 6],
  [4, 2, 1, 6, 5],
  [4, 4, 1, 3, 1],
  [4, 4, 1, 2, 0],
  [4, 4, 1, 12, 13],
  [4, 4, 1, 11, 30],
  [4, 4, 2, 8, 67],
  [4, 4, 2, 6, 61],
  [5, 2, 1, 7, 10],
  [5, 2, 1, 8, 6],
])('Calculates the correct counts for expected outcomes', (count, sides, drop, target, expected) => {
  const dice = new SimpleDiceGroup(sides, count);
  const mod = new Drop(dice, new Constant(drop));
  const result = mod.multinomial(target);
  expect(result).toEqual(expected);
});

describe.each([
  [10, 6, 3],
  [9, 4, 1],
  [2, 20, 1],
])('drops fudge dice', () => {
  const dice = new FudgeDiceGroup(5);
  const mod = new Drop(dice, new Constant(2));
  const result = mod.rollGroup();
  expect(result.length).toEqual(4);
});

it('should behave predictably with provided seed', () => {
  const rng = seedrandom('test');
  const dice = new SimpleDiceGroup(6, 4, rng);
  const mod = new Drop(dice, new Constant(1));
  expect(mod.roll()).toMatchSnapshot();
});

it('drops the lowest values automatically', () => {
  const dice = new ConstantDiceGroup([1, 2, 3, 4]);
  const mod = new Drop(dice, new Constant(2));
  const result = mod.rollGroup();
  expect(result[0]).toBe(7);
});

import Drop from './Drop';
import seedrandom from 'seedrandom';
import { SimpleDiceGroup } from '../SimpleDiceGroup';
import { ConstantDiceGroup } from '../ConstantDiceGroup';
import { FudgeDiceGroup } from '../FudgeDice';

describe.each([
  [10, 6, 3],
  [9, 4, 1],
  [2, 20, 1],
])('Drops a specified number of dice from a roll', (count, sides, drop) => {
  const dice = new SimpleDiceGroup(sides, count);
  const mod = new Drop(dice, drop);
  const result = mod.rollGroup();
  expect(result.length).toEqual(count - drop + 1);
});

describe.each([
  [10, 6, 3],
  [9, 4, 1],
  [2, 20, 1],
])('drops fudge dice', () => {
  const dice = new FudgeDiceGroup(5);
  const mod = new Drop(dice, 2);
  const result = mod.rollGroup();
  expect(result.length).toEqual(4);
})

it('should behave predictably with provided seed', () => {
  const rng = seedrandom('test');
  const dice = new SimpleDiceGroup(6, 4, rng);
  const mod = new Drop(dice, 1);
  expect(mod.roll()).toMatchSnapshot();
});

it('drops the lowest values automatically', () => {
  const dice = new ConstantDiceGroup([1, 2, 3, 4]);
  const mod = new Drop(dice, 2);
  const result = mod.rollGroup();
  expect(result[0]).toBe(7);
})

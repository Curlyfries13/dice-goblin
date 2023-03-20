import { SimpleDiceGroup } from './SimpleDiceGroup';
import seedrandom from 'seedrandom';

it('should initialize a six sided dice by default', () => {
  const dice = new SimpleDiceGroup();
  expect(dice.sides).toBe(6);
});

describe.each([
  [6, 3, 3, 18, 10.5],
  [10, 2, 2, 20, 11],
  [4, 10, 10, 40, 25],
  [6, 3, 3, 18, 10.5],
])('should calculate min max and average', (count, sides, min, max, avg) => {
  const dice = new SimpleDiceGroup(count, sides);
  expect(dice.statProps.min).toBe(min);
  expect(dice.statProps.max).toBe(max);
  expect(dice.statProps.average).toBe(avg);
});

it('should behave predictably with a provided seed', () => {
  const rng = seedrandom('test');
  const dice = new SimpleDiceGroup(6, 3, rng);
  expect(dice.roll()).toMatchSnapshot();
});

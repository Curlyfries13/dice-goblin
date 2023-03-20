import { FudgeDiceGroup } from './FudgeDice';
import seedrandom from 'seedrandom';

it('should initialize a single fudge die by default', () => {
  const dice = new FudgeDiceGroup();
  expect(dice.sides).toBe(6);
  expect(dice.statProps.count).toBe(1);
});

it('should behave predictably with provided seed', () => {
  const rng = seedrandom('test');
  const dice = new FudgeDiceGroup(3, rng);
  expect(dice.roll()).toMatchSnapshot();
});

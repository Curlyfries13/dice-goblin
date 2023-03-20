import Exploding from './Exploding';
import seedrandom from 'seedrandom';
import { SimpleDiceGroup } from '../SimpleDiceGroup';
import { ConstantDiceGroup } from '../ConstantDiceGroup';

it('Explodes dice that roll the highest amount', () => {
  // this produces a roll with 2 max rolls
  const rng = seedrandom('testing');
  const dice = new SimpleDiceGroup(4, 10, rng);
  const explodingDice = new Exploding(dice);
  const result = explodingDice.rollGroup();
  expect(explodingDice.statProps.count).toBeGreaterThan(10);
});

it('does not explode rolls with no max rolls', () => {
  const constantDice = new ConstantDiceGroup([1, 1, 1, 1], 4);
  const explodingDice = new Exploding(constantDice);
  const result = explodingDice.rollGroup();
  expect(explodingDice.statProps.count).toBe(4);
  expect(result[0]).toBe(4);
});

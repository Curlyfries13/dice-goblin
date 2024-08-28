import seedrandom from 'seedrandom';
import Exploding from './Exploding';
import SimpleDiceGroup from '../SimpleDiceGroup';
import ConstantDiceGroup from '../ConstantDiceGroup';

it('Explodes dice that roll the highest amount', () => {
  // this produces a roll with 2 max rolls
  // cspell:disable-next-line
  const rng = seedrandom('testrng');
  const dice = new SimpleDiceGroup(4, 10, rng);
  const explodingDice = new Exploding(dice);
  explodingDice.rollGroup();
  expect(explodingDice.count.value()).toBeGreaterThan(10);
});

it('does not explode rolls with no max rolls', () => {
  const constantDice = new ConstantDiceGroup([1, 1, 1, 1], 4);
  const explodingDice = new Exploding(constantDice);
  const result = explodingDice.rollGroup();
  expect(explodingDice.count.value()).toBe(4);
  expect(result[0]).toBe(4);
});

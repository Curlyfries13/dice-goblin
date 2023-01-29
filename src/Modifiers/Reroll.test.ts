import Reroll from './Reroll';
import seedrandom from 'seedrandom';
import { SimpleDiceGroup } from '../SimpleDiceGroup';
import { ConstantDiceGroup } from '../ConstantDiceGroup';

it('Rerolls the lowest roll by default, keeping dice count', () => {
  // this produces a roll with 2 max rolls
  // cspell:disable-next-line
  const rng = seedrandom('testrng');
  const dice = new SimpleDiceGroup(4, 10, rng);
  const rerollDice = new Reroll(dice);
  rerollDice.rollGroup();
  expect(rerollDice.count.value()).toEqual(10);
});

it('Rerolls the lowest values by default', () => {
  const constantDice = new ConstantDiceGroup([1, 1, 1, 1], 4);
  const rerollDice = new Reroll(constantDice);
  const result = rerollDice.rollGroup();
  expect(rerollDice.count.value()).toBe(4);
  expect(result[0]).toBeGreaterThan(4);
});

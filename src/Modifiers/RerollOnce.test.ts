import Reroll from './Reroll';
import { ConstantDiceGroup } from '../ConstantDiceGroup';

it('Rerolls the lowest values by default', () => {
  const constantDice = new ConstantDiceGroup([1, 3, 3, 3], 4);
  const rerollDice = new Reroll(constantDice);
  const result = rerollDice.rollGroup();
  expect(rerollDice.count.value()).toBe(4);
  expect(rerollDice.rerollCount).toBe(1);
});

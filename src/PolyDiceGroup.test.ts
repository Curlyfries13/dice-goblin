import SimpleDiceGroup from './SimpleDiceGroup';
import PolyDiceGroup from './PolyDiceGroup';

it.each([
  [1, 2, 1, 2, 4, 0.25],
  [1, 2, 1, 2, 3, 0.5],
])('calculates pdf correctly with 2 dice', (count1, sides1, count2, sides2, test, expected) => {
  const die1 = new SimpleDiceGroup(count1, sides1);
  const die2 = new SimpleDiceGroup(count2, sides2);
  const testDie = new PolyDiceGroup(die1, die2);
  expect(testDie.pdf(test)).toBeCloseTo(expected);
});

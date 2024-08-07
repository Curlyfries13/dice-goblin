import { diceMultinomial } from './DiceGroupPDF';

it.each([
  [1, 6, 7, 0],
  [1, 4, 1, 1],
  [3, 6, 3, 1],
  [2, 6, 3, 2],
  [2, 6, 4, 3],
  [2, 6, 12, 1],
])('should calculate the correct multinomial quantities: q(%pd%p)(%p) => %p', (count, sides, value, expected) => {
  expect(diceMultinomial(count, sides, value)).toBe(expected);
});

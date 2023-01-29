import { Roll } from './Roll';
import { SimpleDiceGroup } from './SimpleDiceGroup';
import { AddGenerator } from './Combinators/Add';

describe('Collects stats from the roll model', () => {
  it.each([
    [1, 6, 2, 10, 3, 14.5],
    [3, 6, 1, 20, 4, 21]
  ])('%pd%p and %pd%p have %p count and %p average', (a1, a2, b1, b2, count, avg) => {
    const diceGroup1 = new SimpleDiceGroup(a2, a1);
    const diceGroup2 = new SimpleDiceGroup(b2, b1);
    const roll = new Roll([diceGroup1, diceGroup2], [AddGenerator]);
    expect(roll.count).toBe(count);
    expect(roll.average).toBe(avg);
  });
});

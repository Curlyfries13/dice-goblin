import seedrandom from 'seedrandom';
import CompoundingExploding from './CompoundingExploding';
import SimpleDiceGroup from '../SimpleDiceGroup';

it('Compounding Explodes dice that roll the highest amount', () => {
  const rng = seedrandom('testing');
  const dice = new SimpleDiceGroup(4, 10, rng);
  const explodingDice = new CompoundingExploding(dice);
  explodingDice.rollGroup();
  expect(explodingDice.count.value()).toBe(10);
  expect(explodingDice.current.some((element) => element > 4)).toBeTruthy();
});

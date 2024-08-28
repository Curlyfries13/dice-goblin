import seedrandom from 'seedrandom';

import FudgeDiceGroup from 'FudgeDice';

it('should initialize a single fudge die by default', () => {
  const dice = new FudgeDiceGroup();
  expect(dice.sides.value()).toBe(3);
  expect(dice.count.value()).toBe(1);
});

it('should behave predictably with provided seed', () => {
  const rng = seedrandom('test');
  const dice = new FudgeDiceGroup(3, rng);
  expect(dice.roll()).toMatchSnapshot();
});

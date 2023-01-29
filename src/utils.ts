import { CONVOLUTION_EPSILON } from './EngineConfig';
import { StatisticalGenerator } from './StatisticalGenerator';

// TODO: memoize this
export function convolution(
  value: number,
  left: StatisticalGenerator,
  right: StatisticalGenerator,
  inverse: (x: number, y: number) => number
) {
  const rangeLeft = left.statProps.max - left.statProps.min + 1;
  let acc = 0;
  let guard = 0;
  let limit = Math.max(left.statProps.periodicity, right.statProps.periodicity);
  // todo create a maximum depth
  for (let i = 0; i < rangeLeft; i++) {
    let sub = left.statProps.min + i;
    const step = left.pdf(sub) * right.pdf(inverse(value, sub));
    acc += step;
    // checking if we're under epsilon doesn't guarantee we aren't missing some
    // other important values: some PDF's are periodic
    if (step < CONVOLUTION_EPSILON) {
      guard++;
      if (guard >= limit) {
        return acc;
      }
    } else {
      guard = 0;
    }
  }
  return acc;
}

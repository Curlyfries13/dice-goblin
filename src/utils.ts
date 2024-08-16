import memoize from 'fast-memoize';

import { CONVOLUTION_EPSILON } from './EngineConfig';
import { StatisticalGenerator } from './StatisticalGenerator';
import { memo } from 'fast-check';
import KeepDropMode from './Modifiers/KeepDropMode';

type ConvolutableProps = Pick<StatisticalGenerator, 'pdf' | 'multinomial'>;
type Convolutable = keyof ConvolutableProps;

function convolution(
  value: number,
  left: StatisticalGenerator,
  right: StatisticalGenerator,
  inverse: (x: number, y: number) => number,
  property: Convolutable,
) {
  const rangeLeft = left.statProps.max - left.statProps.min + 1;
  let acc = 0;
  let guard = 0;
  let limit = Math.max(left.statProps.periodicity, right.statProps.periodicity);
  // todo create a maximum depth
  for (let i = 0; i < rangeLeft; i++) {
    let sub = left.statProps.min + i;
    const step = left[property](sub) * right[property](inverse(value, sub));
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

const convolutionMemo = memoize(convolution);
export { convolutionMemo as convolution };

function binomialCoefficient(n: number, k: number): number {
  let result = 1;
  // exploit the symmetry of this result
  const limit = k <= n - k ? k : n - k;
  for (let i = 1; i <= limit; i++) {
    const subResult = (n + 1 - i) / i;
    // this feels like a hack
    result = Math.round(result * subResult);
  }
  return result;
}

const binomialCoefficientMemo = memoize(binomialCoefficient);
export { binomialCoefficientMemo as binomialCoefficient };

function multinomialCoefficient(diceCount: number, sides: number, total: number): number {
  if (sides <= 0 || total < diceCount || (sides === 1 && total !== diceCount)) {
    return 0;
  } else if (sides === 1 && total === diceCount) {
    return 1;
  }
  const midpoint = (sides * diceCount - diceCount) / 2 + diceCount;
  if (total > midpoint) {
    const newTotal = midpoint - (total - midpoint);
    return multinomialCoefficient(diceCount, sides, newTotal);
  }
  let result = 0;
  const max = Math.floor((total - diceCount) / sides);
  for (let i = 0; i <= max; i++) {
    const sign = i & 1 ? -1 : 1;
    const a = binomialCoefficient(diceCount, i);
    const b = binomialCoefficient(total - sides * i - 1, diceCount - 1);
    result = result + sign * a * b;
  }

  return result;
}

const multinomialCoefficientMemo = memoize(multinomialCoefficient);
export { multinomialCoefficientMemo as multinomialCoefficient };

function multinomialPDF(diceCount: number, sides: number, total: number): number {
  const power = Math.pow(1.0 / sides, diceCount);
  return multinomialCoefficientMemo(diceCount, sides, total) * power;
}

const multinomialPDFMemo = memoize(multinomialPDF);
export { multinomialPDFMemo as multinomialPDF };

function dropMultinomial(
  min: number,
  max: number,
  step: number,
  count: number,
  dropMode: KeepDropMode,
  keep: number,
  target: number,
): number {
  if (keep === count) {
    return multinomialCoefficient(count, max, target);
  }
  if (dropMode === KeepDropMode.High) {
    // calculate the reciprocal value
    const distrMin = min * keep;
    const distrMax = max * keep;
    // check if we even care
    if (target < distrMin || target > distrMax) {
      return 0;
    }
    const steps = target - distrMin;
    console.log('we decided to not do this, and asked for the reverse');
    return solveDropMultinomial(min, max, step, count, keep, distrMax - steps);
  } else {
    return solveDropMultinomial(min, max, step, count, keep, target);
  }
}

const dropMultinomialMemo = memoize(dropMultinomial);
export { dropMultinomialMemo as dropMultinomial };

function solveDropMultinomial(
  min: number,
  max: number,
  step: number,
  count: number,
  keep: number,
  target: number,
): number {
  // edge cases
  if (keep < 1 || count < 1) {
    return 0;
  }
  if (max === min) {
    // we've reached all 1's
    if (keep === target) {
      return 1;
    }
    return 0;
  }
  if (keep > count) {
    keep = count;
  }

  let result = 0;
  if (target === max * keep) {
    const dropMax = Math.pow(max, count);
    for (let i = 0; i < keep; i++) {
      result += Math.pow(max - 1, count - i) * binomialCoefficientMemo(count, i);
    }
    return dropMax - result;
  }
  for (let k = 0; k <= keep; k += step) {
    const weight = binomialCoefficientMemo(count, k);
    const rest = solveDropMultinomialMemo(min, max - 1, step, count - k, keep - k, target - max * k);
    result = result + weight * rest;
  }
  return result;
}

const solveDropMultinomialMemo = memoize(solveDropMultinomial);
export { solveDropMultinomialMemo as solveDropMultinomial };

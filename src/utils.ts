import { factorial } from 'simple-statistics';
import { CONVOLUTION_EPSILON } from './EngineConfig';
import { StatisticalGenerator } from './StatisticalGenerator';

type ConvolutableProps = Pick<StatisticalGenerator, 'pdf' | 'multinomial'>;
type Convolutable = keyof ConvolutableProps;

export function convolution(
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

// TODO memoize this? This can be a big performance win
export function pdfConvolution(
  value: number,
  left: StatisticalGenerator,
  right: StatisticalGenerator,
  inverse: (x: number, y: number) => number,
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

export function multinomialConvolution(
  value: number,
  left: StatisticalGenerator,
  right: StatisticalGenerator,
  inverse: (x: number, y: number) => number,
) {
  const rangeLeft = left.statProps.max - left.statProps.min + 1;
  let acc = 0;
  let guard = 0;
  let limit = Math.max(left.statProps.periodicity, right.statProps.periodicity);
  // todo create a maximum depth
  for (let i = 0; i < rangeLeft; i++) {
    let sub = left.statProps.min + i;
    const step = left.multinomial(sub) * right.multinomial(inverse(value, sub));
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

export function binomialCoefficient(n: number, k: number): number {
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

export function slowBinomial(n: number, k: number): number {
  const a = factorial(n);
  const ba = factorial(k);
  const bb = factorial(n - k);
  const b = ba * bb;
  return a / b;
}

export function multinomialCoefficient(diceCount: number, sides: number, total: number): number {
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

export function multinomialPDF(diceCount: number, sides: number, total: number): number {
  const power = Math.pow(1.0 / sides, diceCount);
  return multinomialCoefficient(diceCount, sides, total) * power;
}

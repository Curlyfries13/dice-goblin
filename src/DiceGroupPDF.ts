import factorialData from './factorial_data';

export function diceMultinomial(diceCount: number, sides: number, total: number) {
  let maxVal = diceCount * sides;
  if (total > maxVal || total < 1) {
    return 0.0;
  }
  const max = Math.floor((total - diceCount) / sides) + 1;
  // TODO: avoid call stack limit
  return Array(max)
    .fill(0)
    .map((_, i) => subSum(i, diceCount, sides, total))
    .reduce((value, current) => value + current, 0);
}

// assumes no modifiers
// TODO: cheat with memoization
export function dicePDF(diceCount: number, sides: number, total: number) {
  return diceMultinomial(diceCount, sides, total) * Math.pow(1.0 / sides, diceCount);
}

// This shouldn't need BigInt... but if it does this could need more help
// the derivation for this:
// https://towardsdatascience.com/modelling-the-probability-distributions-of-dice-b6ecf87b24ea
function subSum(index: number, diceCount: number, sides: number, total: number): number {
  // unfortunately this requires a BigInt to just hold + / - 1
  const sign = BigInt(index & 1 ? -1 : 1);
  const b = factorial(diceCount) / (factorial(diceCount - index) * factorial(index));
  const ca = factorial(total - sides * index - 1);
  const cb = factorial(total - sides * index - diceCount);
  const cc = factorial(diceCount - 1);
  const c = ca / (cb * cc);
  return Number(sign * b * c);
}

let f = factorialData;
function factorial(n: number) {
  if (f[n] !== undefined) {
    // TODO: cheat with memoization
    return f[n];
  }
  let result = f.slice(-1)[0];
  // pesky indexes
  for (let i = f.length; i <= n; i++) {
    result = result * BigInt(i);
    f.push(result);
  }
  return result;
}

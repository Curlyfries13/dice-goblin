import factorialData from './factorial_data';

// assumes no modifiers
// TODO cheat with memoization
export function dicePDF(diceCount: number, sides: number, total: number) {
  // check how bad it'll get
  let maxVal = diceCount * sides;
  if (total > maxVal || total < 1) {
    return 0.0;
  }
  const max = Math.floor((total - diceCount) / sides) + 1;
  // TODO: avoid call stack limit
  console.log(`calculate up to ${max}`);
  const value = Array(max)
    .fill(0)
    .map((_, i) => subSum(i, diceCount, sides, total))
    .reduce((value, current) => value + current, 0);
  return value * Math.pow(1.0 / sides, diceCount);
}

// This shouldn't need BigInt... but if it does this could need more help
function subSum(index: number, diceCount: number, sides: number, total: number): number {
  // unfortunately this requires a BigInt to just hold + / - 1
  const sign = BigInt(index & 1 ? -1 : 1);
  const b = factorial(diceCount) / (factorial(diceCount - index) * factorial(index));
  const ca = factorial(total - sides * index - 1);
  const cb = factorial(total - sides * index - diceCount);
  const cc = factorial(diceCount - 1);
  console.log(`${sign}, ${b}, ${ca}, ${cb}, ${cc}`);
  return Number(sign * b * (ca / (cb * cc)));
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

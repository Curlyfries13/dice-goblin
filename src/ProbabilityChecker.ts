import stats from 'simple-statistics';
import { BATCH_SIZE } from './EngineConfig';
import interpreter from './Interpreter';
import { parse } from './Parser/Parser';

// This File should be used to run checks on various statistical models
function testStats(roll: () => number, repeats = 10000, name = '') {
  let results: number[] = [];
  let resultCount = 0;

  for (let i = 0; i < repeats; i += BATCH_SIZE) {
    if (resultCount + BATCH_SIZE < repeats) {
      results = results.concat(
        Array.apply(0, Array(BATCH_SIZE)).map(() => {
          return roll();
        })
      );
      resultCount += BATCH_SIZE;
    } else {
      const subBatchSize = repeats - resultCount;
      results = results.concat(
        Array.apply(0, Array(subBatchSize)).map(() => {
          return roll();
        })
      );
    }
  }
  const avg = stats.mean(results);
  const variance = stats.variance(results);
  const stdDev = stats.standardDeviation(results);

  console.log(`${name}, over ${repeats} iterations`);
  console.log(`mean: ${avg}`);
  console.log(`variance: ${variance}`);
  console.log(`standard deviation: ${stdDev}`);
  console.log('------');
}

// set up your tests here
const resolver = new interpreter();
const dice1 = resolver.visit(parse('3d6').cst);
const dice2 = resolver.visit(parse('2d10').cst);
const dice3 = resolver.visit(parse('8d4').cst);
const dice4 = resolver.visit(parse('3d6!').cst);
const dropBase = resolver.visit(parse('6d6').cst);
const drop1 = resolver.visit(parse('6d6d1').cst);
const drop2 = resolver.visit(parse('6d6d2').cst);
const drop3 = resolver.visit(parse('6d6d3').cst);
let rolls = [
  {
    name: '6d6',
    roll: () => {
      return dropBase.roll();
    },
  },
  {
    name: '6d6d1',
    roll: () => {
      return drop1.roll();
    },
  },
  {
    name: '6d6d2',
    roll: () => {
      return drop2.roll();
    },
  },
  {
    name: '6d6d3',
    roll: () => {
      return drop3.roll();
    },
  },
  {
    name: '3d6 * 2d10',
    roll: () => {
      return dice1.roll() * dice2.roll();
    },
  },
  {
    name: '1 / 2d10',
    roll: () => {
      return 1.0 / dice2.roll();
    },
  },
  {
    name: '2d10 ^ 8d4',
    roll: () => {
      return Math.pow(dice2.roll(), dice3.roll());
    },
  },
  {
    name: '3d6!',
    roll: () => {
      return dice4.roll();
    },
  },
];

rolls.map((test) => {
  testStats(test.roll, 10000000, test.name);
});

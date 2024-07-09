import * as stats from 'simple-statistics';
import cliProgress, { Presets } from 'cli-progress';

import { BATCH_SIZE } from './EngineConfig';
import interpreter from './Interpreter';
import { parse } from './Parser/Parser';

// This File should be used to run checks on various statistical models
function testStats(roll: () => number, repeats = 10000, name = '') {
  let results: number[] = [];
  let resultCount = 0;

  let progress = 0;
  const percent = repeats / 100;
  console.log(`Running ${name} over ${repeats} iterations`);
  const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
  bar.start(100, 0);
  for (let i = 0; i < repeats; i += BATCH_SIZE) {
    if (resultCount + BATCH_SIZE < repeats) {
      results = results.concat(
        Array.apply(0, Array(BATCH_SIZE)).map(() => {
          return roll();
        }),
      );
      resultCount += BATCH_SIZE;
    } else {
      const subBatchSize = repeats - resultCount;
      results = results.concat(
        Array.apply(0, Array(subBatchSize)).map(() => {
          return roll();
        }),
      );
    }
    if (progress >= percent) {
      progress = 0;
      bar.increment(1);
    } else {
      progress += BATCH_SIZE;
    }
  }
  bar.update(100);
  bar.stop();
  const avg = stats.mean(results);
  const variance = stats.variance(results);
  const stdDev = stats.standardDeviation(results);

  console.log(`mean: ${avg}`);
  console.log(`variance: ${variance}`);
  console.log(`standard deviation: ${stdDev}`);
  console.log('------');
}

console.log('Parsing patterns');
// set up your tests here
const resolver = new interpreter();
const drop1Base = resolver.visit(parse('6d6').cst);
const drop1_1 = resolver.visit(parse('6d6d1').cst);
const drop1_2 = resolver.visit(parse('6d6d2').cst);
const drop1_3 = resolver.visit(parse('6d6d3').cst);
const drop1_4 = resolver.visit(parse('6d6d4').cst);
const drop1_5 = resolver.visit(parse('6d6d5').cst);
const drop2Base = resolver.visit(parse('6d4').cst);
const drop2_1 = resolver.visit(parse('6d4d1').cst);
const drop2_2 = resolver.visit(parse('6d4d2').cst);
const drop2_3 = resolver.visit(parse('6d4d3').cst);
const drop2_4 = resolver.visit(parse('6d4d4').cst);
const drop2_5 = resolver.visit(parse('6d4d5').cst);
console.log('Parsing done');

let rolls = [
  {
    name: '6d6',
    roll: () => {
      return drop1Base.roll();
    },
  },
  {
    name: '6d6d1',
    roll: () => {
      return drop1_1.roll();
    },
  },
  {
    name: '6d6d2',
    roll: () => {
      return drop1_2.roll();
    },
  },
  {
    name: '6d6d3',
    roll: () => {
      return drop1_3.roll();
    },
  },
  {
    name: '6d6d4',
    roll: () => {
      return drop1_4.roll();
    },
  },
  {
    name: '6d6d5',
    roll: () => {
      return drop1_5.roll();
    },
  },
  {
    name: '6d4',
    roll: () => {
      return drop2Base.roll();
    },
  },
  {
    name: '6d4d1',
    roll: () => {
      return drop2_1.roll();
    },
  },
  {
    name: '6d4d2',
    roll: () => {
      return drop2_2.roll();
    },
  },
  {
    name: '6d4d3',
    roll: () => {
      return drop2_3.roll();
    },
  },
  {
    name: '6d4d4',
    roll: () => {
      return drop2_4.roll();
    },
  },
  {
    name: '6d4d5',
    roll: () => {
      return drop2_5.roll();
    },
  },
];

rolls.map((test) => {
  testStats(test.roll, 100000000, test.name);
});

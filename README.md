# Dice Goblin

Dice rolling for the hordes!

This engine is a flexible dice parser, rolling engine, and statistical model for
rolling dice.

```javascript
import parseDice from 'dice-goblin';

// get a 20 sided dice
const dice = parseDice('1d20');

// roll the dice!
let value = dice.value();
```

## Installation

dice-goblin is available from the npm registry:

```shell
$ npm install dice-goblin
```

This provides a parser and dice engine, and can be used to both analyze dice rolls, and simulate them

## Features

- Robust Dice parser
- Statistical modeling for most dice

## Testing & Dev scripts

Unit tests and fuzz tests can be run with the `test` and `test:fuzz` scripts respectively

```shell
pnpm test

pnpm test:fuzz
```

This repository works well with tsx to run ad-hoc Typescript files

```shell
# Run a bunch of tests to validate the statistical correctness of the system
pnpm tsx src/ProbabilityChecker.ts
```

## Contributing

Dice Goblin is under active development; collaboration guidelines and more details on how to help out are on the way!

### Bugs / Feature Requests

Bugs and feature requests should be reported to the main repository, but this package is currently under development - I may not get to feature requests.

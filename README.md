# Dice Goblin

Dice rolling for the hordes!

## What is Dice-Goblin?

This engine is a flexible dice parser, rolling engine, and statistical model for
rolling dice.

## How to Use

The parser and interpreting engine are accessible

```javascript
import parseDice from 'dice-goblin';

// get a 20 sided dice
const dice = parseDice('1d20');

// roll the dice!
let value = dice.value();
```

## Developing

Dice Goblin is under active development; collaboration guidelines and more details on how to help out are on the way!

### Bugs / Feature Requests

Bugs and feature requests should be reported to the main repository, but this package is currently under development - I may not get to feature requests.

### Tests

Run the tests for this project like so:

```shell
pnpm test
```

This not only runs the unit test suite, but the test fuzzing suite!
Fuzzing randomizes the inputs of the test suite looking for breakdowns in the models.

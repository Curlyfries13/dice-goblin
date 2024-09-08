# Testing & Dev scripts

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

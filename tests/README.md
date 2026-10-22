# Backend tests

Latest individual, serial and parallel execution evidence: [FT-001 verification](VERIFICATION.md). This records remaining failures and does not claim the story is complete.

## Layout

- `integration/`: HTTP tests using the Express app, real models and disposable MongoDB.
- `helpers/`: reusable test infrastructure; these files are imported, not discovered as suites.

All test suites use `*.integration.test.js`. Add unit or end-to-end folders when those distinct types of tests exist; avoid empty placeholder folders. Keep existing overlapping smoke suites until their unique coverage has been reviewed before consolidation.

## Commands

```sh
npm test -- --listTests --runInBand
npm test -- --runTestsByPath tests/integration/signup.integration.test.js --runInBand
npm test -- --runInBand
npm test -- --maxWorkers=2
```

Test dependencies are installed by `npm ci`. Disposable MongoDB may download its binary on the first run. Email must remain mocked and database cleanup must target only the helper-owned instance. FT-001 tracks remaining fixture independence and suite failures; folder organization alone does not complete that story.

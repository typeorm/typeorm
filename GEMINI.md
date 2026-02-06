TESTS Rules

- You MUST run tests with: pnpm run test -- --grep "<name of the test>"
- And files must be with .test.ts extension.
- DO NOT Import things from "typeorm" but from "src" folder
- Issue fixes stay in the functional test suite. Add or update tests in test/functional, with an issue reference in the test comment when applicable.

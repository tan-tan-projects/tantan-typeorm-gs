## Development Guide

This guide describes the development workflow for contributing to `tantan-typeorm-gs`.

### Requirements

The project uses:

- Bun
- TypeScript
- TypeORM
- Google Sheets API

Install the project dependencies:

```bash id="7m2x4p"
bun install
```

### Project Structure

The project is organized around several main layers:

```text id="5q8n1v"
src/
├── client/
│   └── index.ts
│
└── core/
    ├── driver.ts
    ├── memory.ts
    ├── data-source.ts
    ├── schema-builder.ts
    ├── types.ts
    ├── utils.ts
    └── query/
       ├── interpreter.ts
       ├── runner.ts
       └── types.ts


```

The main execution flow is:

```text id="3v7k9c"
TypeORM Repository
        ↓
QueryBuilder
        ↓
GoogleSheetsQueryRunner
        ↓
GoogleSheetsQueryInterpreter
        ↓
GoogleSheetsClient
        ↓
Google Sheets API
```

### Development Principles

Changes should be made at the layer responsible for the behavior.

For example:

| Concern                  | Main layer                     |
| ------------------------ | ------------------------------ |
| Google API communication | `GoogleSheetsApiClient`        |
| Driver behavior          | `GoogleSheetsDriver`           |
| SQL/query interpretation | `GoogleSheetsQueryInterpreter` |
| Query execution          | `GoogleSheetsQueryRunner`      |
| Data source registration | `GoogleSheetsDataSource`       |
| Driver errors            | `error.ts`                     |

Avoid implementing the same behavior in multiple layers.

### Running Tests

Run the complete test suite:

```bash id="8c4m2x"
bun test
```

Run TypeScript type checking:

```bash id="1v7n5q"
bun run typecheck
```

Individual test files can also be executed directly:

```bash id="6m3k9p"
bun test test/google-sheets/0001-client.test.ts
```

Performance tests are kept separate:

```bash id="4q8x1c"
bun test test/google-sheets/0007-performance.test.ts
```

### Test Strategy

The project separates driver tests from Google API integration tests.

Driver and repository behavior should generally use `Memory`.

```ts id="9p2v6m"
const client = new Memory({
	users: []
});
```

This keeps tests fast and deterministic.

The real `GoogleSheetsApiClient` is used for API integration tests.

### Adding a New Feature

When implementing a new feature:

1. Identify the responsible layer.
2. Add or update the relevant test.
3. Implement the smallest required production change.
4. Run the focused test.
5. Run type checking.
6. Run the complete test suite.
7. Update the documentation when the supported behavior changes.

A typical workflow is:

```bash id="2x6m8q"
bun test <focused-test>
bun run typecheck
bun test
```

### Avoid Unnecessary Changes

The driver has multiple compatibility layers with TypeORM.

A seemingly small change can affect existing repository behavior.

When a test already covers stable behavior, avoid changing its implementation unless a concrete regression or missing requirement has been identified.

Prefer targeted changes over broad refactoring.

### Adding Tests

Tests should verify behavior rather than implementation details whenever possible.

For example, repository behavior should preferably be tested through:

```ts id="5n9q3v"
const repository = dataSource.getRepository(User);

const users = await repository.find();
```

Direct `QueryRunner` tests are appropriate when behavior cannot be reliably exercised through the repository API.

This is particularly useful for low-level driver validation such as explicit primary-key handling.

### Performance Tests

Performance tests should remain separate from functional tests.

The existing performance baseline uses `Memory` and measures operations over 1,000 rows.

Performance measurements should be treated as regression indicators rather than absolute guarantees.

### Integration Tests

Changes to the Google Sheets API client should also be validated against the real Google Sheets API where appropriate.

Use a dedicated test spreadsheet and test credentials.

Never use production spreadsheet data for automated integration tests.

### TypeScript

The project is written in TypeScript and should remain type-safe.

Before submitting changes, run:

```bash id="7c4m1x"
bun run typecheck
```

Avoid using `any` unless the TypeORM or Google API boundary genuinely requires it.

### Debugging

When debugging driver behavior, trace the execution path from the repository toward the client:

```text id="0v8n2q"
Repository
   ↓
QueryBuilder
   ↓
QueryRunner
   ↓
Interpreter
   ↓
Client
```

This helps determine whether a problem originates from:

- TypeORM query generation
- query interpretation
- driver execution
- Google Sheets client behavior
- Google Sheets API behavior

### Pull Request Checklist

Before submitting a change:

```text id="3k7m1x"
[ ] Focused tests pass
[ ] TypeScript typecheck passes
[ ] Full test suite passes
[ ] Integration tests updated if necessary
[ ] Performance tests considered if relevant
[ ] Documentation updated if behavior changed
[ ] No credentials or sensitive data committed
[ ] No unrelated refactoring included
```

### Summary

The development process should prioritize:

- small, targeted changes
- behavior-driven tests
- clear separation between driver and API tests
- TypeScript type safety
- preserving existing compatibility
- documentation that reflects tested capabilities

The complete test suite should remain green before a change is considered complete.

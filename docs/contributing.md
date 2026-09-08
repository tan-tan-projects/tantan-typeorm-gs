## Contribution Guide

Contributions to `tantan-typeorm-gs` should preserve compatibility with TypeORM while keeping the Google Sheets-specific implementation predictable and testable.

### Before Contributing

Before making changes:

1. Understand the existing architecture.
2. Check whether the requested behavior is already supported.
3. Identify the layer responsible for the change.
4. Review existing tests related to that behavior.
5. Avoid modifying unrelated code.

The project favors small, focused changes over broad refactoring.

### Development Workflow

A typical contribution workflow is:

```text
Understand
    ↓
Identify affected layer
    ↓
Add or update focused test
    ↓
Implement change
    ↓
Run focused test
    ↓
Run typecheck
    ↓
Run full test suite
    ↓
Update documentation
```

### Tests First

New behavior should have an appropriate test.

Use the existing test layer that matches the behavior being changed.

| Change                         | Preferred test         |
| ------------------------------ | ---------------------- |
| Repository behavior            | Repository test        |
| QueryRunner behavior           | QueryRunner test       |
| Query interpretation           | Query/interpreter test |
| Google Sheets API behavior     | API integration test   |
| Performance-sensitive behavior | Performance test       |

Do not add duplicate tests when an existing test already covers the same behavior.

### Preserve Existing Behavior

The existing test suite represents supported behavior and compatibility expectations.

A contribution should not modify an existing base test merely to make a new implementation pass.

If a new feature causes an existing test to fail:

1. Determine whether the existing behavior is actually incorrect.
2. Determine whether the new implementation introduced a regression.
3. Fix the implementation when the regression is real.
4. Change an existing test only when the intended public behavior has genuinely changed.

### Google API Tests

Tests that communicate with the real Google Sheets API should remain separate from normal driver tests.

Real API tests require appropriate Google credentials and a dedicated test spreadsheet.

Do not commit:

- service-account private keys
- credential JSON files
- spreadsheet secrets
- environment files containing credentials
- production spreadsheet identifiers when they are sensitive

### Pull Requests

A pull request should clearly describe:

- what changed
- why the change is required
- which layer was modified
- which tests were added or changed
- how the change was verified
- whether documentation was updated

Keep pull requests focused.

Unrelated formatting changes, refactoring, or dependency changes should not be mixed into a feature or bug-fix contribution unless they are necessary.

### Verification

Before submitting a contribution, run:

```bash id="8k4m2p"
bun run typecheck
bun test
```

When relevant, also run the specific integration or performance test:

```bash id="5v9n1x"
bun test test/google-sheets/0001-client.test.ts
bun test test/google-sheets/0007-performance.test.ts
```

All relevant tests should pass before the contribution is submitted.

### Documentation

If a contribution changes supported behavior, update the appropriate documentation.

Examples include:

- adding a new supported TypeORM feature
- changing configuration behavior
- adding a new limitation
- changing authentication requirements
- changing performance characteristics
- adding or removing Google Sheets API capabilities

Documentation should describe behavior that is actually implemented and tested.

### Unsupported Features

Do not silently emulate unsupported relational-database behavior.

For example, Google Sheets does not provide database transactions or database-level foreign-key enforcement.

If a TypeORM feature cannot be meaningfully supported by Google Sheets, it should either remain unsupported or be explicitly documented as a driver limitation.

### Code Quality

Contributions should:

- use TypeScript consistently
- preserve the existing ESM module structure
- follow the existing naming conventions
- avoid unnecessary abstractions
- keep error handling explicit
- avoid unnecessary production changes
- maintain the separation between the driver and Google Sheets API client

### Contribution Checklist

```text
[ ] The affected layer has been identified
[ ] Existing behavior and tests have been reviewed
[ ] Focused tests cover the change
[ ] No unrelated tests were modified
[ ] TypeScript typecheck passes
[ ] Full test suite passes
[ ] Integration tests pass when applicable
[ ] Performance impact has been considered when applicable
[ ] Documentation has been updated when necessary
[ ] No credentials or sensitive data are included
[ ] The contribution is focused and minimal
```

### Summary

The goal of contributions is not simply to make a feature work, but to maintain a stable TypeORM-compatible driver with predictable Google Sheets behavior.

Contributors should prioritize:

- compatibility
- tested behavior
- minimal changes
- clear separation of concerns
- explicit limitations
- maintainable documentation

## Integration Testing

The project includes integration tests for validating the Google Sheets API client against the real Google Sheets API.

Integration tests are different from the unit and driver-level tests that use `Memory`.

### Test Layers

The test suite can be viewed in several layers:

```text
Unit / Driver Tests
        ↓
Memory
        ↓
GoogleSheetsDriver
        ↓
Repository / QueryRunner

Integration Tests
        ↓
GoogleSheetsApiClient
        ↓
Google Sheets API
        ↓
Real Spreadsheet
```

The fake client is used for fast and deterministic tests.

The integration tests validate the behavior of the actual Google Sheets API client.

### Fake Client Tests

Most driver behavior can be tested without network access:

```ts id="8r3m1v"
const client = new Memory({
	users: []
});

const dataSource = createGoogleSheetsDataSource({
	type: "google-sheets",

	client,

	entities: [User]
});
```

This approach is useful for testing:

- repository operations
- query execution
- metadata handling
- lifecycle hooks
- subscribers
- generated primary keys
- error handling
- pagination and sorting
- driver behavior

These tests should remain fast and deterministic.

### Google Sheets API Integration Tests

The Google Sheets API client has dedicated integration coverage.

The integration tests exercise operations against the actual Google Sheets API, including:

- reading rows
- inserting rows
- updating rows
- deleting rows
- batch-compatible operations
- handling Google API responses

The test file is:

```text id="3q7m9x"
test/google-sheets/0001-client.test.ts
```

### Required Configuration

Integration tests require valid Google Cloud credentials and access to a test spreadsheet.

The test environment should provide the required configuration without committing credentials to the repository.

For example:

```env id="6v2k4p"
GOOGLE_SHEETS_SPREADSHEET_ID=...
GOOGLE_SHEETS_CLIENT_EMAIL=...
GOOGLE_SHEETS_PRIVATE_KEY=...
```

The service account must have access to the spreadsheet used by the integration tests.

### Keep Integration Data Isolated

A dedicated spreadsheet should be used for integration testing whenever possible.

The test spreadsheet should not contain production data.

Integration tests may modify worksheet contents, so the test environment should be isolated from important spreadsheets.

### Running Integration Tests

Run the API client integration test directly:

```bash id="1m8x5c"
bun test test/google-sheets/0001-client.test.ts
```

The integration test suite currently contains coverage for the Google Sheets API client and batch operations.

### Unit Tests vs Integration Tests

Use the fake client when the behavior being tested belongs to the driver:

```text id="7q3n8v"
Driver behavior
    ↓
Memory
```

Use the real API integration test when validating the Google API client itself:

```text id="5c1m7x"
GoogleSheetsApiClient
    ↓
Google Sheets API
```

This separation prevents network availability or Google API latency from affecting the majority of the test suite.

### Recommended Development Workflow

During normal development:

```bash id="9v4k2m"
bun test
```

should be used for the regular test suite.

When changing the Google Sheets API client, run the dedicated integration tests as well:

```bash id="2x7p5n"
bun test test/google-sheets/0001-client.test.ts
```

Performance tests can be run separately:

```bash id="6k3m8q"
bun test test/google-sheets/0007-performance.test.ts
```

### Security

Never commit integration-test credentials to source control.

Use environment variables or the project's secure CI/CD secret mechanism.

Integration-test spreadsheets should also be treated as test infrastructure and should not contain sensitive production information.

### Summary

The project intentionally separates testing responsibilities:

| Test type               | Client                  | Purpose                           |
| ----------------------- | ----------------------- | --------------------------------- |
| Driver/repository tests | `Memory`                | Fast driver behavior testing      |
| API integration tests   | `GoogleSheetsApiClient` | Real Google Sheets API validation |
| Performance tests       | `Memory`                | Driver regression baseline        |

This separation keeps the normal test suite fast while still providing coverage against the real Google Sheets API.

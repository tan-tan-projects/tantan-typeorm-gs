## Custom Client

The Google Sheets driver allows applications to provide a custom `GoogleSheetsClient`.

This is useful when the application needs to control how Google Sheets data is accessed, for example for testing, mocking, caching, or implementing a custom integration.

### Default Client

If no custom client is provided, the data source creates its own `GoogleSheetsApiClient` using the configured spreadsheet ID and credentials.

```ts
const dataSource = createGoogleSheetsDataSource({
	type: "google-sheets",

	spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,

	credentials: {
		clientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL!,

		privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY!
	},

	entities: [User]
});
```

The default flow is:

```text
createGoogleSheetsDataSource()
        ↓
client not provided
        ↓
GoogleSheetsApiClient
        ↓
Google Sheets API
```

### Providing a Custom Client

A custom client can be supplied through the `client` option:

```ts
const client = new MyGoogleSheetsClient();

const dataSource = createGoogleSheetsDataSource({
	type: "google-sheets",

	spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,

	credentials: {
		clientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL!,

		privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY!
	},

	client,

	entities: [User]
});
```

When `client` is provided, the driver uses that client instead of creating a default `GoogleSheetsApiClient`.

```text
createGoogleSheetsDataSource()
        ↓
client provided?
   ┌────┴────┐
  yes       no
   ↓         ↓
custom    GoogleSheetsApiClient
client
   ↓         ↓
   └────┬────┘
        ↓
GoogleSheetsDriver
```

### Custom Client Interface

A custom client must implement the `GoogleSheetsClient` interface expected by the driver.

For example:

```ts
import type { GoogleSheetsClient } from "tantan-typeorm-gs";

class MyGoogleSheetsClient implements GoogleSheetsClient {
	// Implement the required client methods.
}
```

The exact methods depend on the operations used by the driver.

A custom client therefore allows the driver layer to remain independent from the actual Google Sheets transport implementation.

### Testing with a Fake Client

A custom client is particularly useful for tests.

For example:

```ts
const client = new Memory({
	users: [
		{
			id: 1,
			name: "Budi"
		}
	]
});

const dataSource = createGoogleSheetsDataSource({
	type: "google-sheets",

	client,

	entities: [User]
});

await dataSource.initialize();

const repository = dataSource.getRepository(User);

const users = await repository.find();
```

This allows repository and driver behavior to be tested without making requests to the Google Sheets API.

### Custom Client Precedence

When `client` is supplied:

```ts
client;
```

takes precedence over the default API client.

The credentials and spreadsheet ID are still part of the data source configuration, but the custom client is the client instance used by the driver.

### When to Use a Custom Client

A custom client is useful for:

- unit and integration tests
- fake or in-memory spreadsheet data
- custom authentication handling
- request logging
- caching
- retry policies
- alternative Google Sheets transport implementations

For normal production usage, the default `GoogleSheetsApiClient` is sufficient when direct Google Sheets API access is required.

### Summary

| Configuration                    | Client used                                    |
| -------------------------------- | ---------------------------------------------- |
| `client` omitted                 | `GoogleSheetsApiClient`                        |
| `client` provided                | Provided `GoogleSheetsClient`                  |
| `client` provided with fake data | Useful for testing without Google API requests |

The custom client is injected at data source creation time and is used by the `GoogleSheetsDriver`.

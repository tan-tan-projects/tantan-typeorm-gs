## Authentication

`tantan-typeorm-gs` authenticates with Google Sheets using a Google Cloud **service account**.

The driver requires two credential values:

- `clientEmail`
- `privateKey`

These credentials are passed to `createGoogleSheetsDataSource()`.

### Service Account Credentials

A service account provides an identity for the application when accessing Google APIs.

After creating the service account in Google Cloud, obtain its credentials and configure the application with:

```ts
credentials: {
    clientEmail: 'service-account@project-id.iam.gserviceaccount.com',
    privateKey: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n',
}
```

The service account must also have access to the target Google Spreadsheet.

### Environment Variables

Credentials should not be hard-coded in application source code.

For example:

```env
GOOGLE_SHEETS_CLIENT_EMAIL=service-account@project-id.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Then configure the data source:

```ts
import { createGoogleSheetsDataSource } from "tantan-typeorm-gs";

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

### Private Key Formatting

When a private key is stored in an environment variable, escaped newline characters may need to be converted back to actual newline characters depending on how the environment variable is provided.

For example:

```ts
const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY!.replace(/\\n/g, "\n");
```

The resulting value should retain the PEM format:

```text
-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----
```

### Required Access

Authentication and authorization are separate concerns.

The service account credentials authenticate the application, while access to the spreadsheet determines whether the authenticated service account can read or modify that spreadsheet.

Make sure the target spreadsheet has been shared with the service account email.

### Security

Service-account private keys are sensitive credentials.

Do not:

- commit private keys to Git
- include private keys in source control
- expose private keys in frontend applications
- log private keys
- include private keys in error messages

Use environment variables or an appropriate secret-management system for production deployments.

Google recommends choosing authentication credentials appropriate for the application's environment rather than treating a development credential file as a production authentication strategy.

### Authentication Flow

The authentication flow is:

```text
Application
    ↓
createGoogleSheetsDataSource()
    ↓
Google Sheets client
    ↓
Service Account credentials
    ↓
Google Sheets API
    ↓
Target Spreadsheet
```

The driver uses the Google API client library to communicate with the Google Sheets API. Google recommends its client libraries for applications consuming the Sheets API.

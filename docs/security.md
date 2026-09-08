## Security

The Google Sheets driver requires access to a Google Cloud service account and a target spreadsheet.

Security therefore depends on protecting both the authentication credentials and the spreadsheet itself.

### Protect Service Account Credentials

The default Google Sheets client requires:

```ts
credentials: {
    clientEmail: '...',
    privateKey: '...',
}
```

The `privateKey` is sensitive and must be protected.

Do not:

- commit service account credentials to source control
- expose the private key in client-side code
- include credentials in public repositories
- log the private key
- send credentials to untrusted services

Environment variables are recommended for local and server deployments:

```env id="7k2p4m"
GOOGLE_SHEETS_CLIENT_EMAIL=...
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

The application can then load these values when creating the data source.

### Spreadsheet Access

The service account must have access to the target spreadsheet.

Access should follow the principle of least privilege:

- grant access only to the spreadsheets required by the application
- avoid sharing unrelated spreadsheets
- remove access when the service account is no longer needed
- review spreadsheet sharing permissions periodically

The driver does not bypass Google Sheets permissions. Access is ultimately controlled by Google.

### Spreadsheet ID

The spreadsheet ID identifies the target spreadsheet:

```ts id="3q8v1n"
const dataSource = createGoogleSheetsDataSource({
	type: "google-sheets",

	spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID!

	// ...
});
```

The spreadsheet ID is generally not considered a secret by itself.

However, it should still be treated as application configuration because it identifies the resource the application intends to access.

### Private Key Formatting

When the private key is stored in an environment variable, escaped newline characters may need to be converted to actual newline characters:

```ts id="6m4x9p"
const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY!.replace(/\\n/g, "\n");
```

This should be done before passing the key to the Google authentication client when the deployment environment stores the key with escaped newlines.

### Do Not Log Credentials

Application logging should never include:

```text id="1v7c5q"
clientEmail
privateKey
access tokens
authorization headers
```

If query or API logging is enabled for debugging, ensure that sensitive authentication information is not included in the logged output.

### Custom Client Security

A custom `GoogleSheetsClient` becomes part of the application's security boundary.

For example, a custom client may implement:

- authentication
- caching
- request logging
- retry handling
- alternative transports

These implementations must follow the same security requirements as the default client.

In particular, custom logging should not expose credentials or authorization data.

### Production Credentials

For production deployments:

- store credentials in a secure secret-management system when available
- restrict service-account permissions
- rotate credentials according to the organization's security policy
- avoid storing private keys directly in source code
- restrict access to deployment configuration

The exact secret-management mechanism depends on the deployment environment.

### Synchronization Security

`Synchronize` and `dropSchema` can modify worksheet structure.

They should therefore be treated as privileged configuration in production.

Do not enable destructive schema operations in production unless the application intentionally requires them and the consequences are understood.

### Data Sensitivity

The driver does not encrypt spreadsheet data at the application layer.

If sensitive information is stored in Google Sheets, the application should consider:

- who can access the spreadsheet
- which service accounts have access
- whether the data should be stored in a spreadsheet at all
- whether additional application-level encryption is required

Google Sheets should not automatically be considered an appropriate storage location for highly sensitive data.

### Security Summary

The main security responsibilities are:

1. Protect the service account private key.
2. Keep credentials out of source control.
3. Restrict spreadsheet permissions.
4. Avoid logging authentication information.
5. Treat custom clients as part of the security boundary.
6. Use secure secret storage in production.
7. Be careful with `synchronize` and `dropSchema`.
8. Evaluate whether sensitive data belongs in Google Sheets.

The driver provides the integration layer, while authentication, authorization, credential management, and data classification remain application and infrastructure responsibilities.

## Synchronization

Synchronization allows the data source to synchronize entity metadata with the corresponding Google Sheets worksheets.

It is controlled through the `synchronize` data source option.

### Enable Synchronization

Set `synchronize` to `true` when creating the data source:

```ts id="5n7q2m"
const dataSource = createGoogleSheetsDataSource({
	type: "google-sheets",

	spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,

	credentials: {
		clientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL!,

		privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY!
	},

	entities: [User],

	synchronize: true
});

await dataSource.initialize();
```

Synchronization is performed as part of the data source initialization process.

### Entity and Worksheet

For an entity:

```ts id="8c4p1v"
@Entity("users")
class User {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	name!: string;

	@Column()
	email!: string;
}
```

the driver uses the entity metadata to determine the worksheet and its columns.

The worksheet corresponds to:

```text id="3h8x5k"
users
```

and the entity columns determine the expected worksheet structure.

### When to Use Synchronization

Synchronization is useful when the application owns the structure of the target spreadsheet and wants the worksheet structure to follow the entity metadata.

A typical development configuration is:

```ts id="1q6m9s"
const dataSource = createGoogleSheetsDataSource({
	// ...

	entities: [User],

	synchronize: true
});
```

The application then initializes the data source:

```ts id="6v2k8p"
await dataSource.initialize();
```

### Synchronization vs CRUD

Synchronization is different from inserting or updating data.

CRUD operations modify records:

```text
insert
   ↓
rows

update
   ↓
rows

delete
   ↓
rows
```

Synchronization deals with the schema represented by entity metadata:

```text
Entity metadata
       ↓
Synchronization
       ↓
Worksheet structure
```

Therefore, `synchronize` should not be enabled simply because the application needs to perform CRUD operations.

### `dropSchema`

The data source also exposes the `dropSchema` option:

```ts id="4m7r2x"
const dataSource = createGoogleSheetsDataSource({
	// ...

	entities: [User],

	synchronize: true,
	dropSchema: true
});
```

This option should be used with caution because schema-dropping operations can remove existing worksheet structures or data depending on the synchronization operation.

It is generally more appropriate for controlled development or testing environments than for production data.

### Initialization Lifecycle

Synchronization is associated with data source initialization:

```ts id="0q8c4n"
await dataSource.initialize();
```

Once initialization has completed, repositories can be obtained normally:

```ts id="2m5v7x"
const repository = dataSource.getRepository(User);
```

The data source should be destroyed when the application no longer needs the connection:

```ts id="9p4k1w"
await dataSource.destroy();
```

### Production Considerations

Synchronization should be used carefully when the spreadsheet contains production data.

Before enabling synchronization in production, consider:

- whether the application should be allowed to modify worksheet structure
- whether existing spreadsheet data must be preserved
- whether schema changes should be controlled explicitly
- whether the spreadsheet is shared with other applications or users

Google Sheets is not a relational database, so schema synchronization should be treated as worksheet-structure management rather than a database migration system.

### Recommended Development Pattern

For development or controlled environments:

```ts id="7x3n5q"
const dataSource = createGoogleSheetsDataSource({
	type: "google-sheets",

	spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,

	credentials: {
		clientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL!,

		privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY!
	},

	entities: [User],

	synchronize: true
});

await dataSource.initialize();
```

For production, synchronization should be enabled only when the application intentionally owns the worksheet structure.

### Summary

The main options related to synchronization are:

| Option        | Purpose                                                       |
| ------------- | ------------------------------------------------------------- |
| `synchronize` | Synchronize entity metadata with worksheet structure          |
| `dropSchema`  | Drop schema/worksheet structures as part of schema management |
| `entities`    | Define the entity metadata used during synchronization        |

Synchronization happens during data source initialization and is separate from normal CRUD operations.

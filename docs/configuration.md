## Configuration

`tantan-typeorm-gs` is configured through `createGoogleSheetsDataSource()`.

### Basic Configuration

A minimal configuration requires:

- `type`
- `spreadsheetId`
- `credentials`

Example:

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

Initialize the data source before using repositories:

```ts
await dataSource.initialize();

const repository = dataSource.getRepository(User);
```

### Configuration Options

#### `type`

Identifies the database driver.

```ts
type: "google-sheets";
```

This value is required.

---

#### `spreadsheetId`

The ID of the Google Spreadsheet used by the driver.

```ts
spreadsheetId: "1AbCdEfGhIjKlMnOpQrStUvWxYz";
```

This value is required.

---

#### `credentials`

Google service-account credentials.

```ts
credentials: {
    clientEmail:
        'service-account@project-id.iam.gserviceaccount.com',

    privateKey:
        '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n',
}
```

Both `clientEmail` and `privateKey` are required.

For security reasons, credentials should normally come from environment variables or a secret-management system.

---

#### `client`

A custom `GoogleSheetsClient` implementation can be supplied instead of creating the default Google API client.

```ts
client: customClient;
```

When `client` is provided, the driver uses that client for Google Sheets operations.

This is useful for:

- testing
- mocking
- custom Google Sheets implementations
- applications that already manage Google Sheets access themselves

The default client is created automatically when `client` is omitted.

---

#### `entities`

TypeORM entities used by the data source.

```ts
entities: [User, Product];
```

Entities define the worksheet metadata used by the driver.

Example:

```ts
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

---

#### `subscribers`

TypeORM subscribers can be registered through the data source configuration.

```ts
subscribers: [UserSubscriber];
```

Subscribers can participate in supported TypeORM entity lifecycle events.

---

#### `migrations`

Migration classes can be supplied through the TypeORM data source configuration.

```ts
migrations: [
	// migration classes
];
```

Migration support should be considered separately from Google Sheets' own data model because Google Sheets does not provide relational database schema semantics.

---

#### `synchronize`

Controls TypeORM schema synchronization.

```ts
synchronize: true;
```

When enabled, TypeORM synchronization is used to create or update the worksheet structure represented by the entity metadata.

For production environments, review synchronization behavior carefully before enabling it.

---

#### `migrationsRun`

Controls whether configured migrations are automatically executed during data-source initialization.

```ts
migrationsRun: true;
```

Use this only when migrations have been configured and the application's migration strategy requires automatic execution.

---

#### `dropSchema`

Controls whether the configured schema is dropped during initialization.

```ts
dropSchema: true;
```

This option is destructive and should generally not be enabled against a production spreadsheet.

---

#### `logging`

TypeORM logging configuration can be passed through to the data source.

For example:

```ts
logging: true;
```

Or:

```ts
logging: ["query", "error"];
```

Use logging carefully when credentials or sensitive spreadsheet data may appear in application logs.

---

#### `logger`

A custom TypeORM logger can be supplied.

```ts
logger: customLogger;
```

This allows applications to integrate driver logging with their existing logging infrastructure.

---

#### `name`

An optional data-source name.

```ts
name: "google-sheets";
```

This can be useful when an application manages multiple data sources.

### Full Example

A configuration can combine the available options:

```ts
const dataSource = createGoogleSheetsDataSource({
	type: "google-sheets",

	spreadsheetId: process.env.GOOGLE_SHEETS_SPREADSHEET_ID!,

	credentials: {
		clientEmail: process.env.GOOGLE_SHEETS_CLIENT_EMAIL!,

		privateKey: process.env.GOOGLE_SHEETS_PRIVATE_KEY!
	},

	entities: [User, Product],

	subscribers: [UserSubscriber],

	synchronize: true,

	logging: ["query", "error"],

	name: "google-sheets"
});
```

### Custom Client

The `client` option takes precedence over the automatically created Google Sheets API client.

```text
client provided
      │
      ▼
use supplied GoogleSheetsClient
      │
      ▼
GoogleSheetsDriver

client omitted
      │
      ▼
create GoogleSheetsApiClient
      │
      ▼
GoogleSheetsDriver
```

See the **Custom Client** section for more details.

### Lifecycle

The typical application lifecycle is:

```ts
const dataSource = createGoogleSheetsDataSource({
	// configuration
});

await dataSource.initialize();

const repository = dataSource.getRepository(User);

// use repository

await dataSource.destroy();
```

The data source should be destroyed when the application no longer needs it, especially in scripts, tests, and short-lived processes.

## Entity Definition

`tantan-typeorm-gs` uses standard TypeORM entity definitions to describe the structure of Google Sheets data.

An entity represents a worksheet, while entity columns represent worksheet columns.

### Basic Entity

A basic entity can be defined using TypeORM decorators:

```ts
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

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

In this example:

```text
Entity
  User
    ↓
Worksheet
  users

Columns
  id
  name
  email
```

The worksheet should contain a header row corresponding to the entity columns.

For example:

```text
| id | name | email |
|----|------|-------|
| 1  | Budi | budi@example.com |
| 2  | Siti | siti@example.com |
```

### Worksheet Name

The worksheet name can be specified with `@Entity()`:

```ts
@Entity("users")
class User {
	// ...
}
```

The value passed to `@Entity()` is used as the entity's custom table name and therefore determines the worksheet name used by the driver.

If no explicit name is supplied:

```ts
@Entity()
class User {
	// ...
}
```

TypeORM metadata determines the resulting table name.

### Columns

Entity properties are mapped to worksheet columns using `@Column()`:

```ts
@Column()
name!: string;

@Column()
email!: string;
```

The property name is used as the column name unless TypeORM metadata specifies another database column name.

A custom column name can be defined:

```ts
@Column({
    name: 'full_name',
})
name!: string;
```

The worksheet header then uses:

```text
full_name
```

instead of:

```text
name
```

### Primary Column

A manually assigned primary key can be defined with `@PrimaryColumn()`:

```ts
@Entity("users")
class User {
	@PrimaryColumn()
	id!: number;

	@Column()
	name!: string;
}
```

When inserting a row, the primary key must be provided.

For example:

```ts
await repository.insert({
	id: 1,
	name: "Budi"
});
```

An insert without the required primary key is rejected by the driver.

### Generated Primary Column

Auto-generated primary keys can be defined with `@PrimaryGeneratedColumn()`:

```ts
@Entity("users")
class User {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	name!: string;
}
```

The default generated strategy is supported by the driver.

When inserting multiple rows:

```ts
await repository.insert([
	{
		name: "Budi"
	},
	{
		name: "Siti"
	}
]);
```

The driver assigns generated IDs to rows that do not provide an explicit generated primary key.

### Explicit Generated Primary Keys

An explicitly supplied generated primary key is preserved:

```ts
await repository.insert({
	id: 100,
	name: "Budi"
});
```

The driver does not replace the supplied ID with another generated value.

If the explicit primary key already exists in the worksheet, the insert is rejected as a duplicate primary-key operation.

### UUID Primary Keys

UUID generation is supported through TypeORM's generated primary-column metadata:

```ts
@Entity("users")
class User {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column()
	name!: string;
}
```

When the ID is omitted during insertion, the driver generates a UUID.

```ts
await repository.insert({
	name: "Budi"
});
```

### Unsupported Generated Strategies

Not every relational database generation strategy has an equivalent in Google Sheets.

The driver does not support generated primary-key strategies that depend on database-specific row identity mechanisms, such as:

```ts
@PrimaryGeneratedColumn('identity')
```

and:

```ts
@PrimaryGeneratedColumn('rowid')
```

These strategies are rejected by the driver rather than being emulated.

### Dates

TypeORM date metadata can be used for supported entity date columns.

Lifecycle-managed date columns such as create-date and update-date columns are populated by the driver during insert operations when the corresponding TypeORM metadata is present.

Example:

```ts
@Entity("users")
class User {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	name!: string;

	@CreateDateColumn()
	createdAt!: Date;

	@UpdateDateColumn()
	updatedAt!: Date;
}
```

### Relations

Relations can be defined using normal TypeORM relation decorators:

```ts
@Entity("posts")
class Post {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	title!: string;

	@Column()
	authorId!: number;

	@ManyToOne(() => User, {
		nullable: false
	})
	author!: User;
}
```

The driver supports relation metadata resolution and supported relation loading.

However, Google Sheets does not provide database-level foreign-key constraints or referential-integrity enforcement.

Therefore, defining a TypeORM relation does not create a foreign-key constraint inside Google Sheets.

### Naming Strategy

TypeORM naming strategies can affect the names generated from entity metadata.

For example, a naming strategy may transform a column name:

```text
displayName
    ↓
col_displayname
```

The driver uses the resulting TypeORM metadata when resolving worksheet and column names.

This allows applications to continue using their existing TypeORM naming strategy where supported.

### Entity Metadata

The driver relies on TypeORM metadata rather than requiring a separate Google Sheets schema definition.

The resulting metadata determines information such as:

- worksheet name
- column names
- primary columns
- generated columns
- create-date columns
- update-date columns
- relations
- naming-strategy transformations

This keeps entity definitions compatible with the normal TypeORM programming model.

### Example

A complete entity can look like:

```ts
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity("users")
class User {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	name!: string;

	@Column()
	email!: string;

	@CreateDateColumn()
	createdAt!: Date;

	@UpdateDateColumn()
	updatedAt!: Date;
}
```

Register the entity with the data source:

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

After initialization, the repository can be obtained normally:

```ts
await dataSource.initialize();

const repository = dataSource.getRepository(User);
```

The repository can then be used for CRUD operations against the corresponding worksheet.

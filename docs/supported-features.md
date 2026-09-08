## Supported Features

The Google Sheets driver supports a subset of TypeORM features that are applicable to Google Sheets.

The following table summarizes the currently supported functionality.

### Data Source

| Feature                     | Status    |
| --------------------------- | --------- |
| Google Sheets data source   | Supported |
| Custom Google Sheets client | Supported |
| Multiple entities           | Supported |
| Entity subscribers          | Supported |
| Entity lifecycle hooks      | Supported |
| Synchronization             | Supported |
| Logging configuration       | Supported |

### CRUD

| Operation           | Status    |
| ------------------- | --------- |
| `insert()`          | Supported |
| `save()`            | Supported |
| `find()`            | Supported |
| `findOne()`         | Supported |
| `update()`          | Supported |
| `delete()`          | Supported |
| `remove()`          | Supported |
| `softDelete()`      | Supported |
| `restore()`         | Supported |
| `softRemove()`      | Supported |
| Multiple-row insert | Supported |
| Multiple-row update | Supported |
| Multiple-row delete | Supported |

`save()` supports normal entity persistence and column-based foreign-key values.

Nested relation persistence and cascade persistence are not fully supported. See [Limitations](#limitations) for details.

### Find Options

| Feature                         | Status    |
| ------------------------------- | --------- |
| `where`                         | Supported |
| OR conditions using `where: []` | Supported |
| `order`                         | Supported |
| Multiple-field ordering         | Supported |
| `skip`                          | Supported |
| `take`                          | Supported |
| `findAndCount()`                | Supported |
| `count()`                       | Supported |
| `findOne()` with `where`        | Supported |
| `findOne()` with `order`        | Supported |
| `withDeleted`                   | Supported |

### Primary Keys

| Feature                         | Status        |
| ------------------------------- | ------------- |
| `@PrimaryColumn()`              | Supported     |
| `@PrimaryGeneratedColumn()`     | Supported     |
| Increment generated IDs         | Supported     |
| UUID generated IDs              | Supported     |
| Explicit generated primary key  | Supported     |
| Duplicate primary key detection | Supported     |
| Missing primary key detection   | Supported     |
| `identity` generation strategy  | Not supported |
| `rowid` generation strategy     | Not supported |

When an explicit generated primary key is supplied, the driver preserves the supplied value and checks for duplicates.

### Data Types

The driver uses TypeORM entity metadata to interpret worksheet values and hydrate them into the expected entity types.

| Type      | Status    |
| --------- | --------- |
| `string`  | Supported |
| `number`  | Supported |
| `boolean` | Supported |
| `Date`    | Supported |
| `uuid`    | Supported |
| `int`     | Supported |
| `null`    | Supported |

Google Sheets commonly returns cell values as strings. The driver performs type conversion based on the corresponding TypeORM column metadata.

For example:

```ts
id: 1
age: 30
active: true
createdAt: new Date(...)
```

are hydrated as their corresponding TypeScript runtime values rather than being returned as raw worksheet strings.

### Entity Metadata

| Feature                    | Status                                       |
| -------------------------- | -------------------------------------------- |
| Entity metadata resolution | Supported                                    |
| Custom worksheet names     | Supported                                    |
| Custom column names        | Supported                                    |
| Naming strategies          | Supported through TypeORM-generated metadata |
| Create date columns        | Supported                                    |
| Update date columns        | Supported                                    |
| Delete date columns        | Supported                                    |
| Relation metadata          | Supported                                    |
| Relation loading           | Supported                                    |

### Relations

Basic relation metadata, relation loading, and supported JOIN operations are supported.

For example:

```ts
id: 1
```

```ts
const post = await repository.findOne({
	where: {
		id: 1
	},

	relations: {
		author: true
	}
});
```

Relations can also be represented through explicit foreign-key columns:

```ts
post.userId = user.id;

await postRepository.save(post);
```

However, Google Sheets does not provide database-level relational features such as foreign-key constraints or referential integrity.

Nested relation persistence and cascade operations are not fully supported.

### Soft Delete

Soft-delete operations using TypeORM delete-date metadata are supported.

For example:

```ts
@DeleteDateColumn({
    nullable: true,
})
deletedAt!: Date | null;
```

The driver supports:

* `softDelete()`
* `softRemove()`
* `restore()`
* filtering soft-deleted rows from normal queries
* `withDeleted`
* soft-delete filtering when loading supported relations

Soft deletion remains an application-level operation because Google Sheets does not provide database-level soft-delete semantics.

### Lifecycle Hooks

The driver supports relevant TypeORM entity lifecycle hooks, including:

```text
@BeforeInsert
@AfterInsert

@BeforeUpdate
@AfterUpdate

@BeforeRemove
@AfterRemove

@AfterLoad
```

Entity subscribers are also supported.

### Query Runner

The driver provides a `QueryRunner` implementation for supported Google Sheets operations.

Supported query operations include the operations implemented by the Google Sheets query interpreter and query runner.

Unsupported operations are rejected by the driver rather than silently executed with potentially incorrect semantics.

### Batch Operations

The Google Sheets API client supports batching compatible operations to reduce the number of API requests.

This includes:

* multiple-row reads
* multiple-row inserts
* multiple-row updates
* multiple-row deletes

Non-contiguous updates may require separate API requests when the underlying ranges cannot be combined safely.

### Transactions

Database transactions are **not supported**.

Google Sheets does not provide transactional semantics equivalent to a relational database.

Applications should not rely on:

```ts
dataSource.transaction(...)
```

for atomic multi-operation behavior.

See [Limitations](#limitations) for details.

### Migrations

Migration-related configuration is exposed through the data source options, but traditional relational database migrations are not supported as a full database migration mechanism.

Schema changes should instead be handled through worksheet synchronization and the schema-management capabilities provided by the driver.

### Synchronization

Schema synchronization is supported for worksheet structures.

The driver can:

* create missing worksheets
* create worksheet headers
* add missing columns to existing worksheets

Synchronization operates on worksheet structure rather than relational database schema objects.

### Logging

TypeORM logging configuration is supported.

For example:

```ts
const dataSource = new DataSource({
    type: 'google-sheets',

    logging: [
        'query',
        'error',
        'schema',
    ],
});
```

The driver integrates with TypeORM's logger for supported query, error, and schema operations.

### Custom Client

Applications can provide a custom `GoogleSheetsClient` implementation instead of using the default Google Sheets API client.

This can be useful for:

* testing
* custom transport implementations
* alternative data sources
* controlling API behavior

### Feature Compatibility Principle

TypeORM exposes a large API surface because it supports many relational database systems.

The presence of a TypeORM option does not automatically mean that the Google Sheets driver supports that option.

Applications should rely on the capabilities documented by this driver and its tests rather than assuming full relational-database compatibility.

### Summary

The driver currently provides:

```text
TypeORM Repository
        │
        ├── CRUD
        ├── Find Options
        ├── Sorting
        ├── Pagination
        ├── Type Conversion
        ├── Generated IDs
        ├── Soft Delete
        ├── Lifecycle Hooks
        ├── Subscribers
        ├── Relations / Relation Loading
        ├── Synchronization
        ├── Logging
        └── Custom Client
                │
                ▼
        Google Sheets
```

Features that depend on relational-database guarantees, such as transactions, foreign-key enforcement, database-level cascades, and full relational persistence semantics, are outside the capabilities of Google Sheets.

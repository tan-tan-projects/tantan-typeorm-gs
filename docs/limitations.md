## Limitations

The Google Sheets driver provides a TypeORM-compatible interface, but Google Sheets is not a relational database.

As a result, some TypeORM features cannot provide the same guarantees as a traditional database such as PostgreSQL or MySQL.

### No Transactional Guarantees

Transactions are not supported.

Operations involving multiple writes cannot be treated as one atomic database transaction.

For example:

```ts
await repository.save(user);
await repository.save(profile);
```

If the second operation fails, the first operation is not automatically rolled back.

Applications that require atomic multi-step updates should use a transactional database instead.

### No Foreign Key Enforcement

Relations can be defined and loaded:

```ts
@ManyToOne(
    () => User,
    {
        nullable: false,
    },
)
author!: User;
```

However, Google Sheets does not enforce foreign-key constraints.

The driver therefore cannot guarantee that a relation always points to an existing row.

For example, a row may contain:

```text
authorId = 999
```

even when no corresponding user exists.

Applications are responsible for maintaining referential integrity.

### No Database-Level Cascades

Database-level cascading behavior is not available.

Operations such as deleting a parent row do not automatically provide the same cascading guarantees as a relational database.

If related rows must also be modified or deleted, the application must explicitly perform those operations.

### Limited Relation Persistence

Relation metadata and relation loading are supported, but relation persistence does not provide the full behavior of a relational database or TypeORM cascade system.

For example, explicitly assigning a foreign-key column is supported:

```ts
post.userId = user.id;

await postRepository.save(post);
```

However, nested relation persistence and cascade operations are not fully supported.

For example, applications should not rely on behavior such as:

```ts
await userRepository.save({
    name: 'Budi',
    posts: [
        {
            title: 'Post 1',
        },
    ],
});
```

when this requires TypeORM to automatically persist related entities.

Applications should explicitly persist related entities when necessary.

### Spreadsheet-Based Performance

Google Sheets is designed as a spreadsheet and API-based data store, not as a high-performance database engine.

Operations over large datasets can become increasingly expensive because rows must be retrieved and processed through the driver.

For example, operations such as:

```ts
await repository.find();
```

may require processing a large number of worksheet rows.

Applications should therefore avoid treating a large spreadsheet as a replacement for a database.

### Offset-Based Pagination

Pagination uses `skip` and `take`.

```ts
await repository.find({
    skip: 100,
    take: 20
});
```

This provides offset-based pagination rather than database-style indexed or cursor-based pagination.

For large worksheets, deep offsets may require processing a substantial amount of data before the requested page can be returned.

### Limited Query Semantics

The driver supports the query operations implemented by its query interpreter and query runner.

It does not provide every SQL feature available in a relational database.

Applications should not assume that arbitrary SQL syntax supported by PostgreSQL, MySQL, or another database will work with Google Sheets.

Unsupported operations are rejected rather than silently interpreted as equivalent operations.

### Concurrent Updates

Google Sheets does not provide the same concurrency guarantees as a transactional database.

When multiple applications or users modify the same worksheet concurrently, applications should consider the possibility of conflicting updates.

The driver should therefore not be used for workloads that require strong database-level concurrency control.

### Primary Key Limitations

Generated primary keys are supported for the strategies implemented by the driver.

Currently:

| Generation strategy | Status        |
| ------------------- | ------------- |
| `increment`         | Supported     |
| `uuid`              | Supported     |
| `identity`          | Not supported |
| `rowid`             | Not supported |

For manually defined primary keys using `@PrimaryColumn()`, the application must provide a value.

Duplicate generated primary keys are rejected by the driver.

### Schema Management Limitations

Synchronization operates on worksheet structures rather than a relational database schema.

There are no traditional database objects such as:

* indexes with database query-planning semantics
* foreign-key constraints
* transactional schema changes
* database-enforced unique constraints

`dropSchema` and `synchronize` should therefore be used carefully, particularly when the spreadsheet contains data that must be preserved.

### Relations Are Not Relational Database Guarantees

Relation metadata and relation loading are supported, but this should not be interpreted as full relational-database support.

The following remain application-level responsibilities:

* referential integrity
* cascade behavior
* transactional relation updates
* consistency across related worksheets

### API Dependency

The default client communicates with Google Sheets through the Google Sheets API.

Therefore, applications using the default client depend on:

* Google Cloud configuration
* valid authentication credentials
* spreadsheet permissions
* Google API availability
* API quotas and limits

A custom client can be used when the application needs different transport or testing behavior.

### When Not to Use This Driver

A relational database is generally more appropriate when the application requires:

* transactions
* strong consistency guarantees
* foreign-key enforcement
* complex relational queries
* large-scale datasets
* high-frequency concurrent writes
* database-level indexing and query optimization

The Google Sheets driver is better suited to workloads where spreadsheet accessibility and TypeORM integration are more important than full relational-database capabilities.

### Summary

The main limitation is architectural:

```text
TypeORM API
     ↓
Google Sheets Driver
     ↓
Spreadsheet
```

The TypeORM API provides a familiar programming model, but it cannot add database capabilities that Google Sheets itself does not provide.

The driver should therefore be considered a **TypeORM interface for Google Sheets**, not a replacement for a relational database.

## Performance Considerations

Google Sheets is an API-based spreadsheet service rather than a database engine.

The performance of the driver therefore depends on several factors, including worksheet size, number of API requests, operation type, and network latency.

### Avoid Treating Google Sheets as a Large Database

The driver is intended for workloads where Google Sheets is an appropriate data store.

For large datasets or high-frequency database workloads, a relational database is generally more appropriate.

Operations such as:

```ts id="8m2q5v"
const users = await repository.find();
```

may require processing a significant number of worksheet rows.

Applications should avoid loading an entire large worksheet when only a small subset of data is required.

### Use Filtering

When only specific records are required, use `where` conditions:

```ts id="4x7n1c"
const users = await repository.find({
	where: {
		status: "active"
	}
});
```

This avoids unnecessarily returning unrelated records to the application.

### Use Pagination

For user-facing lists, combine filtering, sorting, and pagination:

```ts id="9p3k6w"
const page = 1;
const pageSize = 20;

const users = await repository.find({
	where: {
		status: "active"
	},

	order: {
		id: "ASC"
	},

	skip: (page - 1) * pageSize,

	take: pageSize
});
```

Pagination limits the number of records returned to the application at once.

However, `skip` and `take` should not be considered equivalent to indexed database pagination.

### Prefer Batch Operations

When multiple records need to be modified, use repository operations that allow the driver to process multiple rows together.

For example:

```ts id="6v4m8q"
await repository.insert([
	{
		name: "Budi"
	},
	{
		name: "Andi"
	},
	{
		name: "Citra"
	}
]);
```

The Google Sheets API client supports batching compatible operations to reduce unnecessary API requests.

### Minimize API Requests

The default `GoogleSheetsApiClient` communicates with Google Sheets through the Google Sheets API.

Network requests generally have significantly higher overhead than in-memory operations.

Applications should therefore avoid unnecessarily repeating operations such as:

```ts id="1c5x7m"
await repository.find();
await repository.find();
await repository.find();
```

when the same result can safely be reused by the application.

### Custom Client for Specialized Workloads

Applications with specialized performance requirements can provide a custom `GoogleSheetsClient`.

A custom client can implement application-specific strategies such as:

- caching
- request batching
- retry handling
- request deduplication
- custom transport behavior

The driver remains independent of those implementation details.

### Performance Baseline

The project's automated performance tests include a basic baseline using `Memory`.

The current baseline tested:

| Operation |    Dataset |    Result |
| --------- | ---------: | --------: |
| Insert    | 1,000 rows | ~25.64 ms |
| Read      | 1,000 rows | ~10.96 ms |

These measurements are useful as regression indicators for the driver implementation.

They **must not** be interpreted as Google Sheets API production performance benchmarks.

The test uses an in-memory fake client and therefore does not include network latency, Google API processing time, authentication, quotas, or real spreadsheet behavior.

### Performance Testing

Performance tests can be run independently from the normal test suite:

```bash id="2q8n4x"
bun test test/google-sheets/0007-performance.test.ts
```

The tests currently use a relatively loose regression threshold rather than guaranteeing a specific execution time.

This is intentional because execution time can vary between development machines and CI environments.

### When to Consider a Database

Consider using a relational database instead when the workload requires:

- large datasets
- high-frequency reads and writes
- complex queries
- low-latency database operations
- transactions
- concurrent write-heavy workloads
- database indexes and query planning

Google Sheets is better suited when human spreadsheet access, simplicity, and integration with Google Workspace are important requirements.

### Summary

For better performance:

1. Query only the data that is needed.
2. Use filtering with `where`.
3. Use deterministic sorting with pagination.
4. Prefer batch operations for multiple records.
5. Minimize unnecessary API requests.
6. Use a custom client when application-specific caching or transport behavior is required.
7. Use a relational database when the workload exceeds the practical characteristics of a spreadsheet.

Performance should be evaluated using the application's actual workload rather than relying solely on the driver's local baseline tests.

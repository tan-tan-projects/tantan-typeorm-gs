## Find Options

`tantan-typeorm-gs` supports TypeORM find options for filtering, ordering, and limiting query results.

The options are passed directly to repository methods such as `find()`, `findOne()`, `findAndCount()`, and `count()`.

### Where

Use `where` to filter rows.

```ts
const users = await repository.find({
	where: {
		name: "Budi"
	}
});
```

Multiple properties can be specified:

```ts
const users = await repository.find({
	where: {
		name: "Budi",
		email: "budi@example.com"
	}
});
```

The conditions are evaluated against the corresponding worksheet columns.

### OR Conditions

Multiple `where` objects can be supplied to express OR conditions:

```ts
const users = await repository.find({
	where: [
		{
			name: "Budi"
		},
		{
			name: "Siti"
		}
	]
});
```

This returns rows matching either condition.

Conceptually:

```text
name = 'Budi'
OR
name = 'Siti'
```

### Order

Use `order` to sort the result.

```ts
const users = await repository.find({
	order: {
		name: "ASC"
	}
});
```

Descending order:

```ts
const users = await repository.find({
	order: {
		name: "DESC"
	}
});
```

Multiple fields can be specified:

```ts
const users = await repository.find({
	order: {
		name: "ASC",
		email: "DESC"
	}
});
```

The ordering is applied to the returned result rather than changing the underlying worksheet.

### Skip

Use `skip` to ignore a number of matching rows from the beginning of the result.

```ts
const users = await repository.find({
	skip: 10
});
```

For example, with:

```text
skip: 10
```

the first 10 matching rows are omitted from the returned result.

### Take

Use `take` to limit the number of returned rows.

```ts
const users = await repository.find({
	take: 10
});
```

This returns at most 10 rows.

### Pagination

`skip` and `take` can be combined to implement offset-based pagination:

```ts
const page = 2;
const pageSize = 10;

const users = await repository.find({
	skip: (page - 1) * pageSize,
	take: pageSize
});
```

For page 2 with a page size of 10:

```text
skip = 10
take = 10
```

The dedicated **Pagination** section provides a more complete example.

### Combining Options

Find options can be combined:

```ts
const users = await repository.find({
	where: {
		name: "Budi"
	},

	order: {
		email: "ASC"
	},

	skip: 10,

	take: 10
});
```

The operation can therefore:

1. filter matching rows
2. order the result
3. skip rows
4. limit the returned rows

### Find One

`findOne()` accepts the same style of find options:

```ts
const user = await repository.findOne({
	where: {
		id: 1
	}
});
```

Ordering can also be supplied when selecting a single result:

```ts
const user = await repository.findOne({
	where: {
		name: "Budi"
	},

	order: {
		id: "ASC"
	}
});
```

If no matching entity exists, `findOne()` returns `null`.

### Find and Count

Use `findAndCount()` when both the result set and the total number of matching rows are required.

```ts
const [users, total] = await repository.findAndCount({
	where: {
		name: "Budi"
	}
});
```

The result contains:

```text
users
total
```

`skip` and `take` can be used to limit the returned entities while the count represents the total matching entities.

For example:

```ts
const [users, total] = await repository.findAndCount({
	where: {
		name: "Budi"
	},

	skip: 10,

	take: 10
});
```

This allows the application to implement pagination while still knowing the total number of matching rows.

### Count

Use `count()` to count matching entities:

```ts
const total = await repository.count({
	where: {
		name: "Budi"
	}
});
```

The count is based on the matching rows.

`skip` and `take` should not be used when the intention is to obtain the total number of matching entities.

### Example

A typical paginated search can be written as:

```ts
const page = 1;
const pageSize = 20;

const [users, total] = await repository.findAndCount({
	where: {
		name: "Budi"
	},

	order: {
		name: "ASC"
	},

	skip: (page - 1) * pageSize,

	take: pageSize
});

console.log("Total:", total);
console.log("Rows:", users);
```

### Supported Find Options

The currently supported and tested find-option behavior includes:

| Option           | Purpose                           |
| ---------------- | --------------------------------- |
| `where`          | Filter rows                       |
| `where: []`      | OR conditions                     |
| `order`          | Sort results                      |
| `skip`           | Offset results                    |
| `take`           | Limit results                     |
| `findOne()`      | Retrieve one matching entity      |
| `findAndCount()` | Retrieve entities and total count |
| `count()`        | Count matching entities           |

More advanced TypeORM find operators should only be considered supported when explicitly implemented and tested by the driver.

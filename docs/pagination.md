## Pagination

Pagination can be implemented using TypeORM's `skip` and `take` find options.

The Google Sheets driver supports this offset-based pagination pattern.

### Basic Pagination

Define the page number and page size:

```ts id="8j3p7k"
const page = 1;
const pageSize = 20;

const users = await repository.find({
	skip: (page - 1) * pageSize,
	take: pageSize
});
```

For example:

| Page | Page size | Skip | Take |
| ---: | --------: | ---: | ---: |
|    1 |        20 |    0 |   20 |
|    2 |        20 |   20 |   20 |
|    3 |        20 |   40 |   20 |

The formula is:

```text id="wqk5j1"
skip = (page - 1) * pageSize
```

### Pagination with Sorting

Pagination should generally be combined with a deterministic ordering:

```ts id="6xj2pz"
const page = 2;
const pageSize = 20;

const users = await repository.find({
	order: {
		id: "ASC"
	},

	skip: (page - 1) * pageSize,

	take: pageSize
});
```

Using `order` makes the result ordering explicit before applying the offset and limit.

### Pagination with Filtering

Pagination can also be combined with `where`:

```ts id="h9k4s2"
const page = 1;
const pageSize = 20;

const users = await repository.find({
	where: {
		name: "Budi"
	},

	order: {
		id: "ASC"
	},

	skip: (page - 1) * pageSize,

	take: pageSize
});
```

The filtering is applied before the pagination window is returned.

### Pagination with Total Count

When the application needs both the current page and the total number of matching records, use `findAndCount()`:

```ts id="4w8m1r"
const page = 1;
const pageSize = 20;

const [users, total] = await repository.findAndCount({
	where: {
		name: "Budi"
	},

	order: {
		id: "ASC"
	},

	skip: (page - 1) * pageSize,

	take: pageSize
});
```

`users` contains the entities for the requested page, while `total` contains the total number of matching entities.

For example:

```ts id="5h2d8q"
const totalPages = Math.ceil(total / pageSize);
```

The application can then expose pagination information:

```ts id="p6c1vx"
{
    data: users,
    page,
    pageSize,
    total,
    totalPages,
}
```

### Reusable Pagination Helper

A helper function can be used to keep pagination logic consistent:

```ts id="9m4z7a"
async function findPage(page: number, pageSize: number) {
	const [data, total] = await repository.findAndCount({
		order: {
			id: "ASC"
		},

		skip: (page - 1) * pageSize,

		take: pageSize
	});

	return {
		data,
		page,
		pageSize,
		total,
		totalPages: Math.ceil(total / pageSize)
	};
}
```

Usage:

```ts id="2c8v1n"
const result = await findPage(2, 20);

console.log(result.data);
console.log(result.total);
console.log(result.totalPages);
```

### Pagination Considerations

Pagination through `skip` and `take` is offset-based.

For large worksheets, increasing the offset means the driver still needs to process the preceding rows before returning the requested page. Therefore, pagination is convenient for normal application-level data sets but should not be treated as equivalent to database indexing or cursor-based pagination.

For large-scale data, consider whether Google Sheets is appropriate as the primary data store and evaluate the performance characteristics of the target spreadsheet.

### Summary

The basic pagination pattern is:

```text id="6v3yqk"
page
  ↓
(page - 1) × pageSize
  ↓
skip
  ↓
take pageSize
  ↓
current page
```

For applications that need the total number of records, prefer:

```ts id="8n2w6c"
repository.findAndCount({
	skip,
	take
});
```

This provides both the current page and the total matching record count.

## Sorting

Sorting is performed using TypeORM's `order` find option.

The Google Sheets driver supports sorting by one or more entity properties.

### Sort Ascending

To sort a result in ascending order:

```ts id="6p2r8m"
const users = await repository.find({
	order: {
		name: "ASC"
	}
});
```

For example, names are returned alphabetically:

```text id="5k1d9v"
Andi
Budi
Citra
Siti
```

### Sort Descending

Use `DESC` for descending order:

```ts id="1x7m4q"
const users = await repository.find({
	order: {
		name: "DESC"
	}
});
```

The result is returned in reverse ordering.

### Multiple Sort Fields

Multiple properties can be specified:

```ts id="8q4n2s"
const users = await repository.find({
	order: {
		name: "ASC",
		email: "DESC"
	}
});
```

The first field is used as the primary sort key.

The next field is used when rows have the same value for the preceding field.

Conceptually:

```text
name ASC
    ↓
email DESC
```

### Sorting with Filtering

Sorting can be combined with `where`:

```ts id="3c7w9k"
const users = await repository.find({
	where: {
		name: "Budi"
	},

	order: {
		email: "ASC"
	}
});
```

Only matching rows are returned, ordered by `email`.

### Sorting with Pagination

For pagination, sorting should normally be specified explicitly:

```ts id="0v5m2x"
const page = 2;
const pageSize = 20;

const users = await repository.find({
	order: {
		id: "ASC"
	},

	skip: (page - 1) * pageSize,

	take: pageSize
});
```

Using a deterministic sort order makes the pagination result predictable.

### Sorting with Find One

`findOne()` can also use `order`:

```ts id="7r1k6p"
const user = await repository.findOne({
	order: {
		id: "ASC"
	}
});
```

This is useful when a condition may match multiple rows but the application needs a deterministic first result.

### Entity Property Names

The `order` option uses entity property names:

```ts id="2d8x5m"
@Entity("users")
class User {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	displayName!: string;
}
```

The repository query uses:

```ts id="9q3h7v"
await repository.find({
	order: {
		displayName: "ASC"
	}
});
```

If a custom database/worksheet column name is configured, the application still works with the entity property:

```ts id="4m6z1c"
@Column({
    name: 'display_name',
})
displayName!: string;
```

Query:

```ts id="1s8k4w"
await repository.find({
	order: {
		displayName: "ASC"
	}
});
```

TypeORM metadata resolves the entity property to the corresponding worksheet column.

### Summary

The basic sorting syntax is:

```ts id="5n2q8b"
await repository.find({
	order: {
		propertyName: "ASC"
	}
});
```

or:

```ts id="7c4m1x"
await repository.find({
	order: {
		propertyName: "DESC"
	}
});
```

Multiple fields can be combined when a secondary ordering is required.

Sorting is especially useful together with `skip` and `take` for predictable pagination.

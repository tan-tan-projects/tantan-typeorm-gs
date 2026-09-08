## CRUD Examples

`tantan-typeorm-gs` exposes the standard TypeORM repository API for supported CRUD operations.

The examples below assume the following entity:

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

After initializing the data source:

```ts
await dataSource.initialize();

const repository = dataSource.getRepository(User);
```

### Create

#### Insert One Row

Use `repository.insert()` to insert a new row:

```ts
const result = await repository.insert({
	name: "Budi",
	email: "budi@example.com"
});
```

For an entity with an auto-generated primary key, the driver generates the ID automatically.

#### Insert Multiple Rows

Multiple rows can be inserted in a single repository operation:

```ts
await repository.insert([
	{
		name: "Budi",
		email: "budi@example.com"
	},
	{
		name: "Siti",
		email: "siti@example.com"
	},
	{
		name: "Andi",
		email: "andi@example.com"
	}
]);
```

The driver processes the rows as a batch operation.

#### Save

`repository.save()` can also be used:

```ts
const user = repository.create({
	name: "Budi",
	email: "budi@example.com"
});

await repository.save(user);
```

`save()` follows TypeORM's repository semantics for determining whether the entity should be inserted or updated.

### Read

#### Find All Rows

Use `repository.find()` to retrieve all rows:

```ts
const users = await repository.find();
```

The result is an array of entity instances:

```ts
for (const user of users) {
	console.log(user.id, user.name, user.email);
}
```

#### Find One Row

A specific row can be retrieved using `findOne()`:

```ts
const user = await repository.findOne({
	where: {
		id: 1
	}
});
```

If no matching row exists, the result is `null`.

```ts
if (!user) {
	console.log("User not found.");
}
```

#### Find by Conditions

Multiple conditions can be supplied:

```ts
const users = await repository.find({
	where: {
		name: "Budi"
	}
});
```

The available filtering capabilities are covered in the **Find Options** section.

### Update

Use `repository.update()` to update rows matching a condition:

```ts
await repository.update(
	{
		id: 1
	},
	{
		name: "Budi Updated"
	}
);
```

The first argument specifies which rows should be updated.

The second argument contains the values to update.

Multiple rows can be affected when the condition matches multiple records.

### Delete

Use `repository.delete()` to delete rows matching a condition:

```ts
await repository.delete({
	id: 1
});
```

The operation removes the matching row from the worksheet.

A condition should be supplied when deleting data to avoid unintentionally deleting more rows than intended.

### Remove Entity

An entity instance can also be removed using `repository.remove()`:

```ts
const user = await repository.findOne({
	where: {
		id: 1
	}
});

if (user) {
	await repository.remove(user);
}
```

`remove()` operates on an entity instance, while `delete()` operates directly from a deletion condition.

### Update Using an Entity

An existing entity can be modified and persisted using `save()`:

```ts
const user = await repository.findOne({
	where: {
		id: 1
	}
});

if (user) {
	user.name = "Budi Updated";

	await repository.save(user);
}
```

This is useful when the application already has the entity instance and wants TypeORM to persist its changes.

### Generated IDs

For an entity using:

```ts
@PrimaryGeneratedColumn()
id!: number;
```

the ID does not need to be supplied when creating a new row:

```ts
await repository.insert({
	name: "Budi",
	email: "budi@example.com"
});
```

The driver assigns the generated primary key.

An explicitly supplied generated ID is also preserved:

```ts
await repository.insert({
	id: 100,
	name: "Budi",
	email: "budi@example.com"
});
```

If the supplied primary key already exists, the driver rejects the operation as a duplicate primary-key insert.

### Manually Assigned Primary Keys

For an entity using:

```ts
@PrimaryColumn()
id!: number;
```

the primary key must be supplied:

```ts
await repository.insert({
	id: 1,
	name: "Budi",
	email: "budi@example.com"
});
```

An insert without the required primary key is rejected.

### Lifecycle Hooks

CRUD operations participate in supported TypeORM entity lifecycle events.

For example:

```ts
@BeforeInsert()
beforeInsert()
{
    this.name =
        this.name.toUpperCase();
}
```

When the entity is inserted, the lifecycle hook is executed as part of the TypeORM operation.

Subscribers are also supported for the corresponding lifecycle events.

See the **Supported Features** section for the supported lifecycle behavior.

### Complete Example

A simple application can perform a complete CRUD flow:

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

await dataSource.initialize();

const repository = dataSource.getRepository(User);

// Create
const user = await repository.save({
	name: "Budi",
	email: "budi@example.com"
});

// Read
const found = await repository.findOne({
	where: {
		id: user.id
	}
});

// Update
await repository.update(
	{
		id: user.id
	},
	{
		name: "Budi Updated"
	}
);

// Delete
await repository.delete({
	id: user.id
});

await dataSource.destroy();
```

### CRUD Mapping

The common repository operations can be summarized as:

| Operation           | Repository API        |
| ------------------- | --------------------- |
| Create one          | `insert()` / `save()` |
| Create multiple     | `insert()`            |
| Read multiple       | `find()`              |
| Read one            | `findOne()`           |
| Update              | `update()` / `save()` |
| Delete by condition | `delete()`            |
| Delete entity       | `remove()`            |

These APIs operate through the Google Sheets driver and are subject to the driver's supported TypeORM behavior and Google Sheets limitations.

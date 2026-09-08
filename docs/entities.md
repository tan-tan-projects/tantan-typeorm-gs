# Entity Definition

`tantan-typeorm-gs` uses TypeORM entities to define the structure of data stored in Google Sheets.

Each entity represents a worksheet, and each entity property represents a column in that worksheet.

## Basic Entity

A simple entity can be defined using TypeORM decorators:

```ts
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity("Users")
export class User {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	name!: string;

	@Column()
	age!: number;

	@Column()
	active!: boolean;
}
```

The entity above is mapped to a worksheet named `Users`.

The corresponding worksheet structure is:

| id  | name | age | active |
| --- | ---- | --- | ------ |
| 1   | Budi | 30  | TRUE   |
| 2   | Siti | 25  | FALSE  |

The worksheet name comes from the value passed to `@Entity()`.

---

## Entity Name

Use `@Entity()` to define the worksheet name:

```ts
@Entity("Users")
export class User {
	// ...
}
```

The name passed to `@Entity()` is used as the worksheet name.

If the worksheet does not exist and synchronization is enabled, the driver can create it automatically.

See [Synchronization](synchronization.md) for more information.

---

## Columns

Use `@Column()` to define entity properties that are stored as worksheet columns:

```ts
@Entity("Users")
export class User {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	name!: string;

	@Column()
	age!: number;

	@Column()
	active!: boolean;
}
```

The property names are mapped to worksheet columns by TypeORM metadata.

The driver supports the following commonly used types:

| Type      | Status    |
| --------- | --------- |
| `string`  | Supported |
| `number`  | Supported |
| `boolean` | Supported |
| `Date`    | Supported |
| `uuid`    | Supported |
| `int`     | Supported |

Google Sheets commonly returns cell values as strings. The driver uses TypeORM column metadata to hydrate values into their expected application types.

For example, a sheet value such as:

```text
30
```

can be hydrated as:

```ts
30; // number
```

when the entity property is declared as a numeric column.

---

## Primary Columns

Entities should define a primary column.

### Generated Primary Key

Use `@PrimaryGeneratedColumn()` for automatically generated numeric IDs:

```ts
@Entity("Users")
export class User {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	name!: string;
}
```

The driver supports generated numeric IDs and UUIDs.

### UUID Primary Key

A UUID can be used as a generated primary key:

```ts
@Entity("Users")
export class User {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column()
	name!: string;
}
```

### Explicit Primary Key

Use `@PrimaryColumn()` when the application provides the primary key:

```ts
@Entity("Users")
export class User {
	@PrimaryColumn()
	id!: string;

	@Column()
	name!: string;
}
```

Primary key values must be unique within the worksheet.

The driver does not provide database-level primary key enforcement like a relational database. Primary key validation is performed by the driver during supported operations.

---

## Column Options

Standard TypeORM column options can be used where supported by the driver.

For example:

```ts
@Column({
    nullable: true,
})
description!: string | null;
```

Default values are also supported:

```ts
@Column({
    default: true,
})
active!: boolean;
```

The driver applies the configured default when inserting entities where the value is not explicitly provided.

---

## Custom Column Names

TypeORM column names can be customized using the `name` option:

```ts
@Entity("Users")
export class User {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({
		name: "full_name"
	})
	name!: string;
}
```

The worksheet will use:

| id  | full_name |
| --- | --------- |
| 1   | Budi      |

The entity property remains `name`:

```ts
user.name;
```

while the worksheet column is:

```text
full_name
```

Column names are resolved through TypeORM's entity metadata.

---

## Date Columns

`Date` columns are supported:

```ts
@Entity("Users")
export class User {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	name!: string;

	@Column()
	createdAt!: Date;
}
```

When reading data, the driver hydrates the worksheet value into a JavaScript `Date` according to the column metadata.

---

## Soft Delete

Soft-delete entities can use TypeORM's `@DeleteDateColumn()`:

```ts
import { Entity, PrimaryGeneratedColumn, Column, DeleteDateColumn } from "typeorm";

@Entity("Users")
export class User {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	name!: string;

	@DeleteDateColumn({
		nullable: true
	})
	deletedAt!: Date | null;
}
```

The driver supports:

- `@DeleteDateColumn()`
- `softDelete()`
- `softRemove()`
- `restore()`
- Excluding soft-deleted rows from normal queries
- Including soft-deleted rows with `withDeleted`

For example:

```ts
await userRepository.softDelete(user.id);
```

Normal queries will exclude the soft-deleted entity:

```ts
const users = await userRepository.find();
```

To include soft-deleted entities:

```ts
const users = await userRepository.find({
	withDeleted: true
});
```

See [CRUD Operations](crud.md) for more information.

---

## Relations

TypeORM relation metadata can be used with Google Sheets.

For example:

```ts
@Entity("Users")
export class User {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	name!: string;

	@OneToMany(() => Post, (post) => post.user)
	posts!: Post[];
}

@Entity("Posts")
export class Post {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	title!: string;

	@Column()
	userId!: number;

	@ManyToOne(() => User, (user) => user.posts)
	@JoinColumn({
		name: "userId"
	})
	user!: User;
}
```

The `Posts` worksheet stores the foreign-key value in the `userId` column.

An explicit foreign-key value can be persisted normally:

```ts
post.userId = user.id;

await postRepository.save(post);
```

Relations can also be loaded explicitly:

```ts
const users = await userRepository.find({
	relations: {
		posts: true
	}
});
```

Supported relation features include:

- `@ManyToOne`
- `@OneToMany`
- `@JoinColumn`
- Explicit foreign-key column persistence
- Explicit relation loading
- Relation queries through supported joins
- Soft-delete filtering for relations
- `withDeleted` relation loading

Nested relation persistence and cascade persistence are not fully supported.

For example, applications should not rely on automatically persisting a nested relation through:

```ts
await userRepository.save({
	name: "Budi",
	posts: [
		{
			title: "Post 1"
		}
	]
});
```

Applications should explicitly persist related entities when necessary.

---

## Naming Strategies

Entity and column names are resolved through TypeORM metadata.

The driver does not implement a separate naming-strategy system. TypeORM-generated metadata is used to determine the worksheet and column names.

---

## Entity Metadata

Entity definitions are processed by TypeORM before the Google Sheets driver handles them.

The driver consumes TypeORM's `EntityMetadata`, including information such as:

- Entity name
- Worksheet name
- Column names
- Column types
- Primary columns
- Generated columns
- Delete-date columns
- Relations
- Join columns
- Nullable columns
- Default values

This means entity definitions remain standard TypeORM entity definitions rather than using a Google Sheets-specific schema format.

---

## Example

A complete entity setup might look like:

```ts
import { Column, DeleteDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";

@Entity("Users")
export class User {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	name!: string;

	@Column()
	active!: boolean;

	@DeleteDateColumn({
		nullable: true
	})
	deletedAt!: Date | null;

	@OneToMany(() => Post, (post) => post.user)
	posts!: Post[];
}

@Entity("Posts")
export class Post {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	title!: string;

	@Column()
	userId!: number;

	@DeleteDateColumn({
		nullable: true
	})
	deletedAt!: Date | null;

	@ManyToOne(() => User, (user) => user.posts)
	@JoinColumn({
		name: "userId"
	})
	user!: User;
}
```

This definition can be used directly with a TypeORM `DataSource` configured for the Google Sheets driver.

## Limitations

Entity definitions use TypeORM metadata, but not every TypeORM feature can be represented by Google Sheets.

In particular:

- Transactions are not supported.
- Foreign-key constraints are not enforced by Google Sheets.
- Database-level cascade operations are not available.
- Nested relation persistence and full cascade persistence are not fully supported.
- Lazy relation loading is not supported.
- Relational database guarantees such as referential integrity are not provided.

See [Supported Features](supported-features.md) and [Limitations](limitations.md) for the complete compatibility details.

```

Ini sudah saya buat sebagai **`docs/entities.md`** dan sengaja tidak memasukkan detail CRUD terlalu jauh supaya dokumentasinya tidak tumpang tindih dengan `crud.md`.
```

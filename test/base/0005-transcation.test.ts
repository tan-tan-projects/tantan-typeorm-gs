import { describe, expect, test } from 'bun:test';
import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Memory } from '../../src/core/memory';
import { createGoogleSheetsDataSource } from '../../src/core/data-source';

describe('GoogleSheetsDataSource', () =>
{
    @Entity()
    class User
    {
        @PrimaryGeneratedColumn()
        id!: number;

        @Column()
        name!: string;

        @ManyToMany(
            () => Role,
            (role) => role.users,
        )
        @JoinTable({
            name: 'user_role',
            joinColumn: {
                name: 'userId',
                referencedColumnName: 'id',
            },
            inverseJoinColumn: {
                name: 'roleId',
                referencedColumnName: 'id',
            },
        })
        roles?: Role[];
    }

    @Entity()
    class Category
    {
        @PrimaryGeneratedColumn()
        id!: number;

        @Column()
        name!: string;
    }

    @Entity()
    class Post
    {
        @PrimaryGeneratedColumn()
        id!: number;

        @Column()
        title!: string;

        @Column()
        userId!: number;

        @Column({ nullable: true })
        categoryId!: number;

        @ManyToOne(
            () => User,
        )
        @JoinColumn({
            name: 'userId',
        })
        user!: User;

        @ManyToOne(
            () => Category,
        )
        @JoinColumn({
            name: 'categoryId',
        })
        category!: Category;
    }

    @Entity()
    class Role
    {
        @PrimaryGeneratedColumn()
        id!: number;

        @Column()
        name!: string;

        @ManyToMany(
            () => User,
            (user) => user.roles,
        )
        users!: User[];
    }

    @Entity()
    class UuidUser
    {
        @PrimaryGeneratedColumn('uuid')
        id!: string;

        @Column()
        name!: string;
    }

    @Entity()
    class IdentityUser
    {
        @PrimaryGeneratedColumn('identity')
        id!: number;

        @Column()
        name!: string;
    }

    @Entity()
    class RowidUser
    {
        @PrimaryGeneratedColumn('rowid')
        id!: string;

        @Column()
        name!: string;
    }

    const entities = [User, Post, Category, Role, UuidUser, IdentityUser, RowidUser]

    test('inserts a new entity', async () =>
    {
        const client = new Memory({
            user: [
                { id: 1, name: 'Basuni' },
                { id: 2, name: 'Tan Tan' },
            ],
        });

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client,
            entities
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const user = repository.create({
            id: 3,
            name: 'Budi',
        });

        await repository.save(user);

        expect(user.id).toBe(3);

        const users = await repository.find();

        expect(users).toHaveLength(3);
        expect(users[2]).toMatchObject({
            id: 3,
            name: 'Budi',
        });

        await dataSource.destroy();
    });

    test('updates an existing entity', async () =>
    {
        const client = new Memory({
            user: [
                { id: 1, name: 'Basuni' },
                { id: 2, name: 'Tan Tan' },
            ],
        });

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client,
            entities
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const user = await repository.findOne({
            where: {
                id: 1,
            },
        });

        expect(user).not.toBeNull();

        if (!user)
        {
            throw new Error('User not found.');
        }

        user.name = 'Basuni Updated';

        await repository.save(user);

        const updatedUser = await repository.findOne({
            where: {
                id: 1,
            },
        });

        expect(updatedUser).toMatchObject({
            id: 1,
            name: 'Basuni Updated',
        });

        await dataSource.destroy();
    });

    test('deletes an existing entity', async () =>
    {
        const client = new Memory({
            user: [
                { id: 1, name: 'Basuni' },
                { id: 2, name: 'Tan Tan' },
            ],
        });

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client,
            entities
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const user = await repository.findOne({
            where: {
                id: 1,
            },
        });

        expect(user).not.toBeNull();

        if (!user)
        {
            throw new Error('User not found.');
        }

        await repository.remove(user);

        const deletedUser = await repository.findOne({
            where: {
                id: 1,
            },
        });

        expect(deletedUser).toBeNull();

        const users = await repository.find();

        expect(users).toHaveLength(1);
        expect(users[0]).toMatchObject({
            id: 2,
            name: 'Tan Tan',
        });

        await dataSource.destroy();
    });

    test('bulk inserts multiple entities', async () =>
    {
        const client = new Memory({
            user: [
                { id: 1, name: 'Basuni' },
            ],
        });

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client,
            entities
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        await repository.insert([
            { name: 'Budi' },
            { name: 'Andi' },
        ]);

        const users = await repository.find();

        expect(users).toHaveLength(3);

        expect(users).toMatchObject([
            { id: 1, name: 'Basuni' },
            { id: 2, name: 'Budi' },
            { id: 3, name: 'Andi' },
        ]);

        await dataSource.destroy();
    });

    test('updates multiple entities', async () =>
    {
        const client = new Memory({
            user: [
                { id: 1, name: 'Basuni' },
                { id: 2, name: 'Basuni' },
                { id: 3, name: 'Tan Tan' },
            ],
        });

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client,
            entities
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        await repository.update(
            { name: 'Basuni' },
            { name: 'Basuni Updated' },
        );

        const users = await repository.find();

        expect(users).toMatchObject([
            { id: 1, name: 'Basuni Updated' },
            { id: 2, name: 'Basuni Updated' },
            { id: 3, name: 'Tan Tan' },
        ]);

        await dataSource.destroy();
    });

    test('deletes multiple entities', async () =>
    {
        const client = new Memory({
            user: [
                { id: 1, name: 'Basuni' },
                { id: 2, name: 'Basuni' },
                { id: 3, name: 'Tan Tan' },
            ],
        });

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client,
            entities
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        await repository.delete({
            name: 'Basuni',
        });

        const users = await repository.find();

        expect(users).toMatchObject([
            { id: 3, name: 'Tan Tan' },
        ]);

        await dataSource.destroy();
    });

    test('saves an existing entity', async () =>
    {
        const client = new Memory({
            user: [
                { id: 1, name: 'Tan Tan' },
                { id: 2, name: 'Basuni' },
            ],
        });

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client,
            entities
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const user = await repository.findOneBy({
            id: 1,
        });

        if (!user)
        {
            throw new Error('User not found.');
        }

        user.name = 'Tan Tan Updated';

        await repository.save(user);

        const updated = await repository.findOneBy({
            id: 1,
        });

        expect(updated).toEqual({
            id: 1,
            name: 'Tan Tan Updated',
        });

        await dataSource.destroy();
    });

    test('removes an existing entity', async () =>
    {
        const client = new Memory({
            user: [
                { id: 1, name: 'Tan Tan' },
                { id: 2, name: 'Basuni' },
            ],
        });

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client,
            entities
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const user = await repository.findOneBy({
            id: 1,
        });

        if (!user)
        {
            throw new Error('User not found.');
        }

        await repository.remove(user);

        const removed = await repository.findOneBy({
            id: 1,
        });

        expect(removed).toBeNull();

        const remaining = await repository.find();

        expect(remaining).toEqual([
            {
                id: 2,
                name: 'Basuni',
            },
        ]);

        await dataSource.destroy();
    });

    test('preloads an existing entity', async () =>
    {
        const client = new Memory({
            user: [
                { id: 1, name: 'Tan Tan' },
                { id: 2, name: 'Basuni' },
            ],
        });

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client,
            entities
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const user = await repository.preload({
            id: 1,
            name: 'Tan Tan Updated',
        });

        expect(user).toEqual({
            id: 1,
            name: 'Tan Tan Updated',
        });

        await dataSource.destroy();
    });

    test('returns undefined when preloading a non-existing entity', async () =>
    {
        const client = new Memory({
            user: [
                { id: 1, name: 'Tan Tan' },
                { id: 2, name: 'Basuni' },
            ],
        });

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client,
            entities
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const user = await repository.preload({
            id: 999,
            name: 'Budi',
        });

        expect(user).toBeUndefined();

        await dataSource.destroy();
    });

    test('assigns generated id when saving a new entity', async () =>
    {
        const client = new Memory({
            user: [
                { id: 1, name: 'Tan Tan' },
                { id: 2, name: 'Basuni' },
            ],
        });

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client,
            entities
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const user = repository.create({
            name: 'Andi',
        });

        await repository.save(user);

        expect(user.id).toBe(3);

        const saved = await repository.findOneBy({
            id: 3,
        });

        expect(saved).toEqual({
            id: 3,
            name: 'Andi',
        });

        await dataSource.destroy();
    });

    test('assigns generated ids when saving multiple new entities', async () =>
    {
        const client = new Memory({
            user: [
                { id: 1, name: 'Tan Tan' },
                { id: 2, name: 'Basuni' },
            ],
        });

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client,
            entities
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const users = repository.create([
            {
                name: 'Andi',
            },
            {
                name: 'Budi',
            },
            {
                name: 'Citra',
            },
        ]);

        await repository.save(users);

        expect(users[0]!.id).toBe(3);
        expect(users[1]!.id).toBe(4);
        expect(users[2]!.id).toBe(5);

        const saved = await repository.find({
            order: {
                id: 'ASC',
            },
        });

        expect(saved).toEqual([
            {
                id: 1,
                name: 'Tan Tan',
            },
            {
                id: 2,
                name: 'Basuni',
            },
            {
                id: 3,
                name: 'Andi',
            },
            {
                id: 4,
                name: 'Budi',
            },
            {
                id: 5,
                name: 'Citra',
            },
        ]);

        await dataSource.destroy();
    });

    test('assigns generated ids when saving multiple new entities to an empty sheet', async () =>
    {
        const client = new Memory({
            user: [],
        });

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client,
            entities
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const users = repository.create([
            {
                name: 'Andi',
            },
            {
                name: 'Budi',
            },
            {
                name: 'Citra',
            },
        ]);

        await repository.save(users);

        expect(users[0]!.id).toBe(1);
        expect(users[1]!.id).toBe(2);
        expect(users[2]!.id).toBe(3);

        const saved = await repository.find({
            order: {
                id: 'ASC',
            },
        });

        expect(saved).toEqual([
            {
                id: 1,
                name: 'Andi',
            },
            {
                id: 2,
                name: 'Budi',
            },
            {
                id: 3,
                name: 'Citra',
            },
        ]);

        await dataSource.destroy();
    });

    test('assigns generated id based on the maximum existing id', async () =>
    {
        const client = new Memory({
            user: [
                { id: 1, name: 'Tan Tan' },
                { id: 10, name: 'Basuni' },
                { id: 5, name: 'Citra' },
            ],
        });

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client,
            entities
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const user = repository.create({
            name: 'Andi',
        });

        await repository.save(user);

        expect(user.id).toBe(11);

        const saved = await repository.findOneBy({
            id: 11,
        });

        expect(saved).toEqual({
            id: 11,
            name: 'Andi',
        });

        await dataSource.destroy();
    });

    test('returns affected rows when updating entities with query builder', async () =>
    {
        const client = new Memory({
            user: [
                { id: 1, name: 'Tan Tan' },
                { id: 2, name: 'Basuni' },
                { id: 3, name: 'Tan Tan' },
            ],
        });

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client,
            entities
        });

        await dataSource.initialize();

        const result = await dataSource
            .createQueryBuilder()
            .update(User)
            .set({
                name: 'Updated',
            })
            .where('id = :id', {
                id: 1,
            })
            .execute();

        expect(result.affected).toBe(1);

        await dataSource.destroy();
    });

    test('returns zero affected rows when updating a non-existing entity', async () =>
    {
        const client = new Memory({
            user: [
                { id: 1, name: 'Tan Tan' },
            ],
        });

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client,
            entities
        });

        await dataSource.initialize();

        const result = await dataSource
            .createQueryBuilder()
            .update(User)
            .set({
                name: 'Updated',
            })
            .where('id = :id', {
                id: 999,
            })
            .execute();

        expect(result.affected).toBe(0);

        await dataSource.destroy();
    });

    test('returns affected rows when deleting entities with query builder', async () =>
    {
        const client = new Memory({
            user: [
                { id: 1, name: 'Tan Tan' },
                { id: 2, name: 'Basuni' },
                { id: 3, name: 'Citra' },
            ],
        });

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client,
            entities
        });

        await dataSource.initialize();

        const result = await dataSource
            .createQueryBuilder()
            .delete()
            .from(User)
            .where('id = :id', {
                id: 2,
            })
            .execute();

        expect(result.affected).toBe(1);

        await dataSource.destroy();
    });

    test('returns zero affected rows when deleting a non-existing entity', async () =>
    {
        const client = new Memory({
            user: [
                { id: 1, name: 'Tan Tan' },
            ],
        });

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client,
            entities
        });

        await dataSource.initialize();

        const result = await dataSource
            .createQueryBuilder()
            .delete()
            .from(User)
            .where('id = :id', {
                id: 999,
            })
            .execute();

        expect(result.affected).toBe(0);

        await dataSource.destroy();
    });

    test('assigns generated uuid when saving a new entity', async () =>
    {
        const client =
            new Memory();

        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',
                client,
                entities
            });

        await dataSource.initialize();

        const user =
            dataSource
                .getRepository(UuidUser)
                .create({
                    name: 'John',
                });

        await dataSource
            .getRepository(UuidUser)
            .save(user);

        expect(user.id)
            .toBeString();

        expect(user.id.length)
            .toBe(36);

        expect(
            user.id,
        ).toMatch(
            /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
        );
    });

    test('rejects generated identity when saving a new entity', async () =>
    {
        const client =
            new Memory();

        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',
                client,
                entities
            });

        await dataSource.initialize();

        const user =
            dataSource
                .getRepository(IdentityUser)
                .create({
                    name: 'John',
                });

        await expect(
            dataSource
                .getRepository(IdentityUser)
                .save(user),
        ).rejects.toThrow(
            'PrimaryGeneratedColumn("identity") is not supported by Google Sheets driver.',
        );
    });

    test('rejects generated rowid when saving a new entity', async () =>
    {
        const client =
            new Memory();

        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',
                client,
                entities
            });

        await dataSource.initialize();

        const user =
            dataSource
                .getRepository(RowidUser)
                .create({
                    name: 'John',
                });

        await expect(
            dataSource
                .getRepository(RowidUser)
                .save(user),
        ).rejects.toThrow(
            'PrimaryGeneratedColumn("rowid") is not supported by Google Sheets driver.',
        );
    });

    test('saves ManyToOne relation', async () =>
    {
        const client =
            new Memory({
                user: [
                    {
                        id: 1,
                        name: 'Basuni',
                    },
                ],
                post: [],
            });

        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',
                client,
                entities
            });

        await dataSource.initialize();

        const userRepository =
            dataSource.getRepository(User);

        const postRepository =
            dataSource.getRepository(Post);

        const user =
            await userRepository.findOneBy({
                id: 1,
            });

        expect(user).not.toBeNull();

        if (!user)
        {
            throw new Error(
                'User not found.',
            );
        }

        const post =
            postRepository.create({
                title: 'New Post',
                user,
            });

        await postRepository.save(post);

        expect(post.id).toBeDefined();
        expect(post.title).toBe('New Post');
        expect(post.userId).toBe(1);

        const saved =
            await postRepository.findOneBy({
                id: post.id,
            });

        expect(saved).toMatchObject({
            id: post.id,
            title: 'New Post',
            userId: 1,
        });

        await dataSource.destroy();
    });

    test('saves multiple ManyToOne relations', async () =>
    {
        const client =
            new Memory({
                user: [
                    {
                        id: 1,
                        name: 'Basuni',
                    },
                ],
                category: [
                    {
                        id: 1,
                        name: 'Technology',
                    },
                ],
                post: [],
            });

        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',
                client,
                entities,
            });

        await dataSource.initialize();

        const userRepository =
            dataSource.getRepository(User);

        const categoryRepository =
            dataSource.getRepository(Category);

        const postRepository =
            dataSource.getRepository(Post);

        const user =
            await userRepository.findOneBy({
                id: 1,
            });

        const category =
            await categoryRepository.findOneBy({
                id: 1,
            });

        expect(user).not.toBeNull();
        expect(category).not.toBeNull();

        if (!user || !category)
        {
            throw new Error(
                'Relation entity not found.',
            );
        }

        const post =
            postRepository.create({
                title: 'New Post',
                user,
                category,
            });

        await postRepository.save(post);

        expect(post.id).toBeDefined();
        expect(post.title).toBe('New Post');
        expect(post.userId).toBe(1);
        expect(post.categoryId).toBe(1);

        const saved =
            await postRepository.findOneBy({
                id: post.id,
            });

        expect(saved).toMatchObject({
            id: post.id,
            title: 'New Post',
            userId: 1,
            categoryId: 1,
        });

        await dataSource.destroy();
    });

    test('saves ManyToMany relation', async () =>
    {
        const client =
            new Memory({
                user: [],
                role: [
                    {
                        id: 1,
                        name: 'Admin',
                    },
                    {
                        id: 2,
                        name: 'Developer',
                    },
                ],
                user_role: [],
            });

        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',
                client,
                entities: [
                    User,
                    Role,
                ],
            });

        await dataSource.initialize();

        const userRepository =
            dataSource.getRepository(User);

        const roleRepository =
            dataSource.getRepository(Role);

        const admin =
            await roleRepository.findOneBy({
                id: 1,
            });

        const developer =
            await roleRepository.findOneBy({
                id: 2,
            });

        expect(admin).not.toBeNull();
        expect(developer).not.toBeNull();

        if (!admin || !developer)
        {
            throw new Error(
                'Role not found.',
            );
        }

        const user =
            userRepository.create({
                name: 'Basuni',
                roles: [
                    admin,
                    developer,
                ],
            });

        await userRepository.save(user);

        expect(user.id).toBeDefined();
        expect(user.name).toBe('Basuni');

        const saved =
            await userRepository
                .createQueryBuilder('user')
                .leftJoinAndSelect(
                    'user.roles',
                    'role',
                )
                .where(
                    'user.id = :id',
                    {
                        id: user.id,
                    },
                )
                .getOne();

        expect(saved).toMatchObject({
            id: user.id,
            name: 'Basuni',
            roles: [
                {
                    id: 1,
                    name: 'Admin',
                },
                {
                    id: 2,
                    name: 'Developer',
                },
            ],
        });

        await dataSource.destroy();
    });

    test('updates ManyToMany relation', async () =>
    {
        const client =
            new Memory({
                user: [
                    {
                        id: 1,
                        name: 'Basuni',
                    },
                ],
                role: [
                    {
                        id: 1,
                        name: 'Admin',
                    },
                    {
                        id: 2,
                        name: 'Developer',
                    },
                ],
                user_role: [
                    {
                        userId: 1,
                        roleId: 1,
                    },
                    {
                        userId: 1,
                        roleId: 2,
                    },
                ],
            });

        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',
                client,
                entities: [
                    User,
                    Role,
                ],
            });

        await dataSource.initialize();

        const userRepository =
            dataSource.getRepository(User);

        const roleRepository =
            dataSource.getRepository(Role);

        const user =
            await userRepository.findOne({
                where: {
                    id: 1,
                },
                relations: {
                    roles: true,
                },
            });

        const developer =
            await roleRepository.findOneBy({
                id: 2,
            });

        expect(user).not.toBeNull();
        expect(developer).not.toBeNull();

        if (!user || !developer)
        {
            throw new Error(
                'User or role not found.',
            );
        }

        user.roles = [
            developer,
        ];

        await userRepository.save(user);

        const saved =
            await userRepository.findOne({
                where: {
                    id: 1,
                },
                relations: {
                    roles: true,
                },
            });

        expect(saved).toMatchObject({
            id: 1,
            name: 'Basuni',
            roles: [
                {
                    id: 2,
                    name: 'Developer',
                },
            ],
        });

        const junctionRows =
            await client.getRows(
                'user_role',
            );

        expect(junctionRows).toEqual([
            {
                userId: 1,
                roleId: 2,
            },
        ]);

        await dataSource.destroy();
    });

    test('removes ManyToMany relations', async () =>
    {
        const client =
            new Memory({
                user: [
                    {
                        id: 1,
                        name: 'Basuni',
                    },
                ],
                role: [
                    {
                        id: 1,
                        name: 'Admin',
                    },
                    {
                        id: 2,
                        name: 'Developer',
                    },
                ],
                user_role: [
                    {
                        userId: 1,
                        roleId: 1,
                    },
                    {
                        userId: 1,
                        roleId: 2,
                    },
                ],
            });

        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',
                client,
                entities: [
                    User,
                    Role,
                ],
            });

        await dataSource.initialize();

        const userRepository =
            dataSource.getRepository(User);

        const user =
            await userRepository.findOne({
                where: {
                    id: 1,
                },
                relations: {
                    roles: true,
                },
            });

        expect(user).not.toBeNull();

        if (!user)
        {
            throw new Error(
                'User not found.',
            );
        }

        expect(user.roles).toHaveLength(2);

        user.roles = [];

        await userRepository.save(user);

        const saved =
            await userRepository.findOne({
                where: {
                    id: 1,
                },
                relations: {
                    roles: true,
                },
            });

        expect(saved).toMatchObject({
            id: 1,
            name: 'Basuni',
            roles: [],
        });

        const junctionRows =
            await client.getRows(
                'user_role',
            );

        expect(junctionRows).toEqual([]);

        await dataSource.destroy();
    });

    test('replaces ManyToMany relations', async () =>
    {
        const client =
            new Memory({
                user: [
                    {
                        id: 1,
                        name: 'Basuni',
                    },
                ],
                role: [
                    {
                        id: 1,
                        name: 'Admin',
                    },
                    {
                        id: 2,
                        name: 'Developer',
                    },
                    {
                        id: 3,
                        name: 'Manager',
                    },
                ],
                user_role: [
                    {
                        userId: 1,
                        roleId: 1,
                    },
                    {
                        userId: 1,
                        roleId: 2,
                    },
                ],
            });

        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',
                client,
                entities: [
                    User,
                    Role,
                ],
            });

        await dataSource.initialize();

        const userRepository =
            dataSource.getRepository(User);

        const roleRepository =
            dataSource.getRepository(Role);

        const user =
            await userRepository.findOne({
                where: {
                    id: 1,
                },
                relations: {
                    roles: true,
                },
            });

        const developer =
            await roleRepository.findOneBy({
                id: 2,
            });

        const manager =
            await roleRepository.findOneBy({
                id: 3,
            });

        expect(user).not.toBeNull();
        expect(developer).not.toBeNull();
        expect(manager).not.toBeNull();

        if (!user || !developer || !manager)
        {
            throw new Error(
                'User or role not found.',
            );
        }

        expect(user.roles).toHaveLength(2);

        user.roles = [
            developer,
            manager,
        ];

        await userRepository.save(user);

        const saved =
            await userRepository.findOne({
                where: {
                    id: 1,
                },
                relations: {
                    roles: true,
                },
            });

        expect(saved).toMatchObject({
            id: 1,
            name: 'Basuni',
            roles: [
                {
                    id: 2,
                    name: 'Developer',
                },
                {
                    id: 3,
                    name: 'Manager',
                },
            ],
        });

        const junctionRows =
            await client.getRows(
                'user_role',
            );

        expect(junctionRows).toEqual([
            {
                userId: 1,
                roleId: 2,
            },
            {
                userId: 1,
                roleId: 3,
            },
        ]);

        await dataSource.destroy();
    });
});
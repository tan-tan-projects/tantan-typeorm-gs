import { describe, expect, test } from 'bun:test';
import
{
    Column,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Memory } from '../../src/core/memory';
import { createGoogleSheetsDataSource } from '../../src/core/data-source';

describe('GoogleSheetsDataSource - Relation', () =>
{
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
    class User
    {
        @PrimaryGeneratedColumn()
        id!: number;

        @Column()
        name!: string;

        @OneToMany(
            () => Post,
            (post) => post.user,
        )
        posts!: Post[];

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
        roles!: Role[];
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

        @Column()
        categoryId!: number;

        @ManyToOne(
            () => User,
            (user) => user.posts,
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

    const entities = [User, Post, Category, Role]

    test('loads ManyToOne relation', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                user: [
                    { id: 1, name: 'Basuni' },
                    { id: 2, name: 'Budi' },
                ],
                post: [
                    {
                        id: 1,
                        title: 'Post A',
                        userId: 1,
                    },
                    {
                        id: 2,
                        title: 'Post B',
                        userId: 1,
                    },
                    {
                        id: 3,
                        title: 'Post C',
                        userId: 2,
                    },
                ],
            }),
            entities
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(Post);

        const posts = await repository
            .createQueryBuilder('post')
            .leftJoinAndSelect(
                'post.user',
                'user',
            )
            .orderBy(
                'post.id',
                'ASC',
            )
            .getMany();

        expect(posts).toHaveLength(3);

        expect(posts[0]).toMatchObject({
            id: 1,
            title: 'Post A',
            userId: 1,
            user: {
                id: 1,
                name: 'Basuni',
            },
        });

        expect(posts[1]).toMatchObject({
            id: 2,
            title: 'Post B',
            userId: 1,
            user: {
                id: 1,
                name: 'Basuni',
            },
        });

        expect(posts[2]).toMatchObject({
            id: 3,
            title: 'Post C',
            userId: 2,
            user: {
                id: 2,
                name: 'Budi',
            },
        });

        await dataSource.destroy();
    });

    test('loads OneToMany relation', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                user: [
                    { id: 1, name: 'Basuni' },
                    { id: 2, name: 'Budi' },
                ],
                post: [
                    {
                        id: 1,
                        title: 'Post A',
                        userId: 1,
                    },
                    {
                        id: 2,
                        title: 'Post B',
                        userId: 1,
                    },
                    {
                        id: 3,
                        title: 'Post C',
                        userId: 2,
                    },
                ],
            }),
            entities
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const users = await repository
            .createQueryBuilder('user')
            .leftJoinAndSelect(
                'user.posts',
                'post',
            )
            .orderBy(
                'user.id',
                'ASC',
            )
            .addOrderBy(
                'post.id',
                'ASC',
            )
            .getMany();

        expect(users).toHaveLength(2);

        expect(users[0]).toMatchObject({
            id: 1,
            name: 'Basuni',
            posts: [
                {
                    id: 1,
                    title: 'Post A',
                    userId: 1,
                },
                {
                    id: 2,
                    title: 'Post B',
                    userId: 1,
                },
            ],
        });

        expect(users[1]).toMatchObject({
            id: 2,
            name: 'Budi',
            posts: [
                {
                    id: 3,
                    title: 'Post C',
                    userId: 2,
                },
            ],
        });

        await dataSource.destroy();
    });

    test('filters entities by ManyToOne relation', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                user: [
                    { id: 1, name: 'Basuni' },
                    { id: 2, name: 'Budi' },
                ],
                post: [
                    {
                        id: 1,
                        title: 'Post A',
                        userId: 1,
                    },
                    {
                        id: 2,
                        title: 'Post B',
                        userId: 1,
                    },
                    {
                        id: 3,
                        title: 'Post C',
                        userId: 2,
                    },
                ],
            }),
            entities
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(Post);

        const posts = await repository
            .createQueryBuilder('post')
            .leftJoinAndSelect(
                'post.user',
                'user',
            )
            .where(
                'user.name = :name',
                {
                    name: 'Basuni',
                },
            )
            .orderBy(
                'post.id',
                'ASC',
            )
            .getMany();

        expect(posts).toHaveLength(2);

        expect(posts.map((post) => post.id)).toEqual([
            1,
            2,
        ]);

        expect(posts.every(
            (post) => post.user?.name === 'Basuni',
        )).toBe(true);

        await dataSource.destroy();
    });


    test('selects columns from relation', async () =>
    {
        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',
                client:
                    new Memory({
                        user: [
                            {
                                id: 1,
                                name: 'Basuni',
                            },
                            {
                                id: 2,
                                name: 'Budi',
                            },
                        ],
                        post: [
                            {
                                id: 1,
                                title: 'Post A',
                                userId: 1,
                            },
                            {
                                id: 2,
                                title: 'Post B',
                                userId: 1,
                            },
                            {
                                id: 3,
                                title: 'Post C',
                                userId: 2,
                            },
                        ],
                    }),
                entities
            });

        await dataSource.initialize();

        const repository =
            dataSource.getRepository(Post);

        const posts =
            await repository
                .createQueryBuilder('post')
                .leftJoin(
                    'post.user',
                    'user',
                )
                .select([
                    'post.id',
                    'post.title',
                    'user.name',
                ])
                .orderBy(
                    'post.id',
                    'ASC',
                )
                .getRawMany();

        expect(posts).toEqual([
            {
                post_id: 1,
                post_title: 'Post A',
                user_name: 'Basuni',
            },
            {
                post_id: 2,
                post_title: 'Post B',
                user_name: 'Basuni',
            },
            {
                post_id: 3,
                post_title: 'Post C',
                user_name: 'Budi',
            },
        ]);

        await dataSource.destroy();
    });

    test('selects columns from filtered relation', async () =>
    {
        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',
                client:
                    new Memory({
                        user: [
                            {
                                id: 1,
                                name: 'Basuni',
                            },
                            {
                                id: 2,
                                name: 'Budi',
                            },
                        ],
                        post: [
                            {
                                id: 1,
                                title: 'Post A',
                                userId: 1,
                            },
                            {
                                id: 2,
                                title: 'Post B',
                                userId: 1,
                            },
                            {
                                id: 3,
                                title: 'Post C',
                                userId: 2,
                            },
                        ],
                    }),
                entities
            });

        await dataSource.initialize();

        const repository =
            dataSource.getRepository(Post);

        const posts =
            await repository
                .createQueryBuilder('post')
                .leftJoin(
                    'post.user',
                    'user',
                )
                .where(
                    'user.name = :name',
                    {
                        name: 'Basuni',
                    },
                )
                .select([
                    'post.id',
                    'post.title',
                    'user.name',
                ])
                .orderBy(
                    'post.id',
                    'ASC',
                )
                .getRawMany();

        expect(posts).toEqual([
            {
                post_id: 1,
                post_title: 'Post A',
                user_name: 'Basuni',
            },
            {
                post_id: 2,
                post_title: 'Post B',
                user_name: 'Basuni',
            },
        ]);

        await dataSource.destroy();
    });

    test('loads nested ManyToOne relations', async () =>
    {
        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',
                client:
                    new Memory({
                        user: [
                            { id: 1, name: 'Basuni' },
                            { id: 2, name: 'Budi' },
                        ],
                        category: [
                            { id: 1, name: 'Technology' },
                            { id: 2, name: 'Business' },
                        ],
                        post: [
                            {
                                id: 1,
                                title: 'Post A',
                                userId: 1,
                                categoryId: 1,
                            },
                            {
                                id: 2,
                                title: 'Post B',
                                userId: 1,
                                categoryId: 2,
                            },
                            {
                                id: 3,
                                title: 'Post C',
                                userId: 2,
                                categoryId: 1,
                            },
                        ],
                    }),
                entities
            });

        await dataSource.initialize();

        const repository =
            dataSource.getRepository(Post);

        const posts =
            await repository
                .createQueryBuilder('post')
                .leftJoinAndSelect(
                    'post.user',
                    'user',
                )
                .leftJoinAndSelect(
                    'post.category',
                    'category',
                )
                .orderBy(
                    'post.id',
                    'ASC',
                )
                .getMany();

        expect(posts).toHaveLength(3);

        expect(posts[0]).toMatchObject({
            id: 1,
            title: 'Post A',
            user: {
                id: 1,
                name: 'Basuni',
            },
            category: {
                id: 1,
                name: 'Technology',
            },
        });

        expect(posts[1]).toMatchObject({
            id: 2,
            title: 'Post B',
            user: {
                id: 1,
                name: 'Basuni',
            },
            category: {
                id: 2,
                name: 'Business',
            },
        });

        expect(posts[2]).toMatchObject({
            id: 3,
            title: 'Post C',
            user: {
                id: 2,
                name: 'Budi',
            },
            category: {
                id: 1,
                name: 'Technology',
            },
        });

        await dataSource.destroy();
    });

    test('loads nested OneToMany relations', async () =>
    {
        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',
                client:
                    new Memory({
                        user: [
                            { id: 1, name: 'Basuni' },
                            { id: 2, name: 'Budi' },
                        ],
                        category: [
                            { id: 1, name: 'Technology' },
                            { id: 2, name: 'Business' },
                        ],
                        post: [
                            {
                                id: 1,
                                title: 'Post A',
                                userId: 1,
                                categoryId: 1,
                            },
                            {
                                id: 2,
                                title: 'Post B',
                                userId: 1,
                                categoryId: 2,
                            },
                            {
                                id: 3,
                                title: 'Post C',
                                userId: 2,
                                categoryId: 1,
                            },
                        ],
                    }),
                entities
            });

        await dataSource.initialize();

        const repository =
            dataSource.getRepository(User);

        const users =
            await repository
                .createQueryBuilder('user')
                .leftJoinAndSelect(
                    'user.posts',
                    'post',
                )
                .leftJoinAndSelect(
                    'post.category',
                    'category',
                )
                .orderBy(
                    'user.id',
                    'ASC',
                )
                .addOrderBy(
                    'post.id',
                    'ASC',
                )
                .getMany();

        expect(users).toHaveLength(2);

        expect(users[0]).toMatchObject({
            id: 1,
            name: 'Basuni',
            posts: [
                {
                    id: 1,
                    title: 'Post A',
                    category: {
                        id: 1,
                        name: 'Technology',
                    },
                },
                {
                    id: 2,
                    title: 'Post B',
                    category: {
                        id: 2,
                        name: 'Business',
                    },
                },
            ],
        });

        expect(users[1]).toMatchObject({
            id: 2,
            name: 'Budi',
            posts: [
                {
                    id: 3,
                    title: 'Post C',
                    category: {
                        id: 1,
                        name: 'Technology',
                    },
                },
            ],
        });

        await dataSource.destroy();
    });

    test('keeps entity when OneToMany relation is empty', async () =>
    {
        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',
                client:
                    new Memory({
                        user: [
                            { id: 1, name: 'Basuni' },
                            { id: 2, name: 'Budi' },
                            { id: 3, name: 'Caca' },
                        ],
                        post: [
                            {
                                id: 1,
                                title: 'Post A',
                                userId: 1,
                            },
                            {
                                id: 2,
                                title: 'Post B',
                                userId: 1,
                            },
                            {
                                id: 3,
                                title: 'Post C',
                                userId: 2,
                            },
                        ],
                    }),
                entities
            });

        await dataSource.initialize();

        const repository =
            dataSource.getRepository(User);

        const users =
            await repository
                .createQueryBuilder('user')
                .leftJoinAndSelect(
                    'user.posts',
                    'post',
                )
                .orderBy(
                    'user.id',
                    'ASC',
                )
                .addOrderBy(
                    'post.id',
                    'ASC',
                )
                .getMany();

        expect(users).toHaveLength(3);

        expect(users[0]).toMatchObject({
            id: 1,
            name: 'Basuni',
            posts: [
                {
                    id: 1,
                    title: 'Post A',
                },
                {
                    id: 2,
                    title: 'Post B',
                },
            ],
        });

        expect(users[1]).toMatchObject({
            id: 2,
            name: 'Budi',
            posts: [
                {
                    id: 3,
                    title: 'Post C',
                },
            ],
        });

        expect(users[2]).toMatchObject({
            id: 3,
            name: 'Caca',
            posts: [],
        });

        await dataSource.destroy();
    });

    test('loads OneToMany relations with pagination', async () =>
    {
        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',
                client:
                    new Memory({
                        user: [
                            { id: 1, name: 'Basuni' },
                            { id: 2, name: 'Budi' },
                        ],
                        post: [
                            {
                                id: 1,
                                title: 'Post A',
                                userId: 1,
                            },
                            {
                                id: 2,
                                title: 'Post B',
                                userId: 1,
                            },
                            {
                                id: 3,
                                title: 'Post C',
                                userId: 2,
                            },
                        ],
                    }),
                entities
            });

        await dataSource.initialize();

        const repository =
            dataSource.getRepository(User);

        const users =
            await repository
                .createQueryBuilder('user')
                .leftJoinAndSelect(
                    'user.posts',
                    'post',
                )
                .orderBy(
                    'user.id',
                    'ASC',
                )
                .addOrderBy(
                    'post.id',
                    'ASC',
                )
                .take(1)
                .getMany();

        expect(users).toHaveLength(1);

        expect(users[0]).toMatchObject({
            id: 1,
            name: 'Basuni',
            posts: [
                {
                    id: 1,
                    title: 'Post A',
                },
                {
                    id: 2,
                    title: 'Post B',
                },
            ],
        });

        await dataSource.destroy();
    });

    test('loads multiple OneToMany relations with pagination', async () =>
    {
        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',
                client:
                    new Memory({
                        user: [
                            { id: 1, name: 'Basuni' },
                            { id: 2, name: 'Budi' },
                            { id: 3, name: 'Citra' },
                        ],
                        post: [
                            {
                                id: 1,
                                title: 'Post A',
                                userId: 1,
                            },
                            {
                                id: 2,
                                title: 'Post B',
                                userId: 1,
                            },
                            {
                                id: 3,
                                title: 'Post C',
                                userId: 2,
                            },
                            {
                                id: 4,
                                title: 'Post D',
                                userId: 3,
                            },
                        ],
                    }),
                entities
            });

        await dataSource.initialize();

        const repository =
            dataSource.getRepository(User);

        const users =
            await repository
                .createQueryBuilder('user')
                .leftJoinAndSelect(
                    'user.posts',
                    'post',
                )
                .orderBy(
                    'user.id',
                    'ASC',
                )
                .addOrderBy(
                    'post.id',
                    'ASC',
                )
                .take(2)
                .getMany();

        expect(users).toHaveLength(2);

        expect(users[0]).toMatchObject({
            id: 1,
            name: 'Basuni',
            posts: [
                {
                    id: 1,
                    title: 'Post A',
                },
                {
                    id: 2,
                    title: 'Post B',
                },
            ],
        });

        expect(users[1]).toMatchObject({
            id: 2,
            name: 'Budi',
            posts: [
                {
                    id: 3,
                    title: 'Post C',
                },
            ],
        });

        await dataSource.destroy();
    });

    test('loads OneToMany relations with offset pagination', async () =>
    {
        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',
                client:
                    new Memory({
                        user: [
                            { id: 1, name: 'Basuni' },
                            { id: 2, name: 'Budi' },
                            { id: 3, name: 'Citra' },
                        ],
                        post: [
                            {
                                id: 1,
                                title: 'Post A',
                                userId: 1,
                            },
                            {
                                id: 2,
                                title: 'Post B',
                                userId: 1,
                            },
                            {
                                id: 3,
                                title: 'Post C',
                                userId: 2,
                            },
                            {
                                id: 4,
                                title: 'Post D',
                                userId: 3,
                            },
                        ],
                    }),
                entities
            });

        await dataSource.initialize();

        const repository =
            dataSource.getRepository(User);

        const users =
            await repository
                .createQueryBuilder('user')
                .leftJoinAndSelect(
                    'user.posts',
                    'post',
                )
                .orderBy(
                    'user.id',
                    'ASC',
                )
                .addOrderBy(
                    'post.id',
                    'ASC',
                )
                .skip(1)
                .take(2)
                .getMany();

        expect(users).toHaveLength(2);

        expect(users[0]).toMatchObject({
            id: 2,
            name: 'Budi',
            posts: [
                {
                    id: 3,
                    title: 'Post C',
                },
            ],
        });

        expect(users[1]).toMatchObject({
            id: 3,
            name: 'Citra',
            posts: [
                {
                    id: 4,
                    title: 'Post D',
                },
            ],
        });

        await dataSource.destroy();
    });

    test('loads OneToMany relations with uneven children and pagination', async () =>
    {
        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',
                client:
                    new Memory({
                        user: [
                            { id: 1, name: 'Basuni' },
                            { id: 2, name: 'Budi' },
                            { id: 3, name: 'Citra' },
                            { id: 4, name: 'Doni' },
                        ],
                        post: [
                            {
                                id: 1,
                                title: 'Post A',
                                userId: 1,
                            },
                            {
                                id: 2,
                                title: 'Post B',
                                userId: 1,
                            },
                            {
                                id: 3,
                                title: 'Post C',
                                userId: 1,
                            },
                            {
                                id: 4,
                                title: 'Post D',
                                userId: 3,
                            },
                            {
                                id: 5,
                                title: 'Post E',
                                userId: 4,
                            },
                            {
                                id: 6,
                                title: 'Post F',
                                userId: 4,
                            },
                        ],
                    }),
                entities
            });

        await dataSource.initialize();

        const repository =
            dataSource.getRepository(User);

        const users =
            await repository
                .createQueryBuilder('user')
                .leftJoinAndSelect(
                    'user.posts',
                    'post',
                )
                .orderBy(
                    'user.id',
                    'ASC',
                )
                .addOrderBy(
                    'post.id',
                    'ASC',
                )
                .skip(1)
                .take(2)
                .getMany();

        expect(users).toHaveLength(2);

        expect(users[0]).toMatchObject({
            id: 2,
            name: 'Budi',
            posts: [],
        });

        expect(users[1]).toMatchObject({
            id: 3,
            name: 'Citra',
            posts: [
                {
                    id: 4,
                    title: 'Post D',
                },
            ],
        });

        await dataSource.destroy();
    });

    test('loads ManyToMany relation', async () =>
    {
        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',
                client:
                    new Memory({
                        user: [
                            {
                                id: 1,
                                name: 'Basuni',
                            },
                            {
                                id: 2,
                                name: 'Budi',
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
                            {
                                userId: 2,
                                roleId: 2,
                            },
                        ],
                        post: [],
                        category: [],
                    }),
                entities
            });

        await dataSource.initialize();

        const repository =
            dataSource.getRepository(User);

        const users =
            await repository
                .createQueryBuilder('user')
                .leftJoinAndSelect(
                    'user.roles',
                    'role',
                )
                .orderBy(
                    'user.id',
                    'ASC',
                )
                .addOrderBy(
                    'role.id',
                    'ASC',
                )
                .getMany();

        expect(users).toHaveLength(2);

        expect(users[0]).toMatchObject({
            id: 1,
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

        expect(users[1]).toMatchObject({
            id: 2,
            name: 'Budi',
            roles: [
                {
                    id: 2,
                    name: 'Developer',
                },
            ],
        });

        await dataSource.destroy();
    });

    test('loads ManyToMany relation with pagination', async () =>
    {
        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',
                client:
                    new Memory({
                        user: [
                            {
                                id: 1,
                                name: 'Basuni',
                            },
                            {
                                id: 2,
                                name: 'Budi',
                            },
                            {
                                id: 3,
                                name: 'Citra',
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
                            {
                                userId: 2,
                                roleId: 2,
                            },
                            {
                                userId: 2,
                                roleId: 3,
                            },
                            {
                                userId: 3,
                                roleId: 3,
                            },
                        ],
                        post: [],
                        category: [],
                    }),
                entities: [
                    User,
                    Post,
                    Category,
                    Role,
                ],
            });

        await dataSource.initialize();

        const repository =
            dataSource.getRepository(User);

        const users =
            await repository
                .createQueryBuilder('user')
                .leftJoinAndSelect(
                    'user.roles',
                    'role',
                )
                .orderBy(
                    'user.id',
                    'ASC',
                )
                .addOrderBy(
                    'role.id',
                    'ASC',
                )
                .skip(1)
                .take(1)
                .getMany();

        expect(users).toHaveLength(1);

        expect(users[0]).toMatchObject({
            id: 2,
            name: 'Budi',
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

        await dataSource.destroy();
    });

    test('keeps entity when ManyToMany relation is empty', async () =>
    {
        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',
                client:
                    new Memory({
                        user: [
                            { id: 1, name: 'Basuni' },
                            { id: 2, name: 'Budi' },
                        ],
                        role: [
                            { id: 1, name: 'Admin' },
                        ],
                        user_role: [
                            { userId: 1, roleId: 1 },
                        ],
                        post: [],
                        category: [],
                    }),
                entities
            });

        await dataSource.initialize();

        const repository =
            dataSource.getRepository(User);

        const users =
            await repository
                .createQueryBuilder('user')
                .leftJoinAndSelect(
                    'user.roles',
                    'role',
                )
                .orderBy(
                    'user.id',
                    'ASC',
                )
                .getMany();

        expect(users).toHaveLength(2);

        expect(users[0]).toMatchObject({
            id: 1,
            name: 'Basuni',
            roles: [
                {
                    id: 1,
                    name: 'Admin',
                },
            ],
        });

        expect(users[1]).toMatchObject({
            id: 2,
            name: 'Budi',
            roles: [],
        });

        await dataSource.destroy();
    });

    test('filters entities by ManyToMany relation', async () =>
    {
        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',
                client:
                    new Memory({
                        user: [
                            { id: 1, name: 'Basuni' },
                            { id: 2, name: 'Budi' },
                            { id: 3, name: 'Citra' },
                        ],
                        role: [
                            { id: 1, name: 'Admin' },
                            { id: 2, name: 'Developer' },
                            { id: 3, name: 'Manager' },
                        ],
                        user_role: [
                            { userId: 1, roleId: 1 },
                            { userId: 1, roleId: 2 },
                            { userId: 2, roleId: 2 },
                            { userId: 3, roleId: 3 },
                        ],
                        post: [],
                        category: [],
                    }),
                entities
            });

        await dataSource.initialize();

        const repository =
            dataSource.getRepository(User);

        const users =
            await repository
                .createQueryBuilder('user')
                .leftJoinAndSelect(
                    'user.roles',
                    'role',
                )
                .where(
                    'role.name = :name',
                    {
                        name: 'Developer',
                    },
                )
                .orderBy(
                    'user.id',
                    'ASC',
                )
                .getMany();

        expect(users).toHaveLength(2);

        expect(users[0]).toMatchObject({
            id: 1,
            name: 'Basuni',
            roles: [
                {
                    id: 2,
                    name: 'Developer',
                },
            ],
        });

        expect(users[1]).toMatchObject({
            id: 2,
            name: 'Budi',
            roles: [
                {
                    id: 2,
                    name: 'Developer',
                },
            ],
        });

        await dataSource.destroy();
    });

    test('filters ManyToMany relation without unrelated relations', async () =>
    {
        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',
                client:
                    new Memory({
                        user: [
                            { id: 1, name: 'Basuni' },
                            { id: 2, name: 'Budi' },
                            { id: 3, name: 'Citra' },
                        ],
                        role: [
                            { id: 1, name: 'Admin' },
                            { id: 2, name: 'Developer' },
                            { id: 3, name: 'Manager' },
                        ],
                        user_role: [
                            { userId: 1, roleId: 1 },
                            { userId: 1, roleId: 2 },
                            { userId: 2, roleId: 2 },
                            { userId: 3, roleId: 3 },
                        ],
                        post: [],
                        category: [],
                    }),
                entities: [
                    User,
                    Post,
                    Category,
                    Role,
                ],
            });

        await dataSource.initialize();

        const repository =
            dataSource.getRepository(User);

        const users =
            await repository
                .createQueryBuilder('user')
                .leftJoinAndSelect(
                    'user.roles',
                    'role',
                )
                .where(
                    'role.name = :name',
                    {
                        name: 'Developer',
                    },
                )
                .orderBy(
                    'user.id',
                    'ASC',
                )
                .getMany();

        expect(users).toHaveLength(2);

        expect(users[0]).toMatchObject({
            id: 1,
            name: 'Basuni',
            roles: [
                {
                    id: 2,
                    name: 'Developer',
                },
            ],
        });

        expect(users[1]).toMatchObject({
            id: 2,
            name: 'Budi',
            roles: [
                {
                    id: 2,
                    name: 'Developer',
                },
            ],
        });

        expect(
            users[0]!.roles,
        ).not.toContainEqual({
            id: 1,
            name: 'Admin',
        });

        await dataSource.destroy();
    });
});
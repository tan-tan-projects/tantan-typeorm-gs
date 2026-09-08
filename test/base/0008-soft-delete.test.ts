import { describe, expect, test } from 'bun:test';
import
{
    Entity,
    PrimaryGeneratedColumn,
    Column,
    DeleteDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import
{
    createGoogleSheetsDataSource,
    type GoogleSheetsRow,
} from '../../src';
import { Memory } from '../../src/core/memory';

describe('GoogleSheetsDeleteOprations', () =>
{
    @Entity('soft_delete_users')
    class SoftDeleteUser
    {
        @PrimaryGeneratedColumn()
        id!: number;

        @Column()
        name!: string;

        @DeleteDateColumn({
            nullable: true,
        })
        deletedAt!: Date | null;

        @OneToMany(
            () => SoftDeletePost,
            (post) => post.user,
        )
        posts!: SoftDeletePost[];
    }

    @Entity('soft_delete_posts')
    class SoftDeletePost
    {
        @PrimaryGeneratedColumn()
        id!: number;

        @Column()
        title!: string;

        @Column()
        userId!: number;

        @DeleteDateColumn({
            nullable: true,
        })
        deletedAt!: Date | null;

        @ManyToOne(
            () => SoftDeleteUser,
            (user) => user.posts,
        )
        @JoinColumn({
            name: 'userId',
        })
        user!: SoftDeleteUser;
    }

    async function createDataSource(
        rows: GoogleSheetsRow[] = [],
        postRows: GoogleSheetsRow[] = [],
    )
    {
        const client =
            new Memory({
                soft_delete_users: rows,
                soft_delete_posts: postRows,
            });

        await client.insertHeaders(
            'soft_delete_users',
            [
                'id',
                'name',
                'deletedAt',
            ],
        );

        await client.insertHeaders(
            'soft_delete_posts',
            [
                'id',
                'title',
                'userId',
                'deletedAt',
            ],
        );

        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',

                client,

                entities: [
                    SoftDeleteUser,
                    SoftDeletePost,
                ],
            });

        await dataSource.initialize();

        return {
            client,
            dataSource,
        };
    }

    test(
        'should support DeleteDateColumn',
        async () =>
        {
            const {
                client,
                dataSource,
            } =
                await createDataSource([
                    {
                        id: 1,
                        name: 'John',
                        deletedAt: null,
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        SoftDeleteUser,
                    );

                const user =
                    await repository.findOneBy({
                        id: 1,
                    });

                expect(user)
                    .toBeDefined();

                expect(user!.deletedAt)
                    .toBeNull();

                const rows =
                    await client.getRows(
                        'soft_delete_users',
                    );

                expect(rows)
                    .toEqual([
                        {
                            id: 1,
                            name: 'John',
                            deletedAt: null,
                        },
                    ]);
            }
            finally
            {
                if (dataSource.isInitialized)
                {
                    await dataSource.destroy();
                }
            }
        },
    );

    test(
        'should soft delete entity',
        async () =>
        {
            const {
                client,
                dataSource,
            } =
                await createDataSource([
                    {
                        id: 1,
                        name: 'John',
                        deletedAt: null,
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        SoftDeleteUser,
                    );

                const result =
                    await repository.softDelete(
                        1,
                    );

                expect(result.affected)
                    .toBe(1);

                const rows =
                    await client.getRows(
                        'soft_delete_users',
                    );

                expect(rows[0]!.deletedAt)
                    .toBeInstanceOf(Date);
            }
            finally
            {
                if (dataSource.isInitialized)
                {
                    await dataSource.destroy();
                }
            }
        },
    );

    test(
        'should restore soft deleted entity',
        async () =>
        {
            const {
                client,
                dataSource,
            } =
                await createDataSource([
                    {
                        id: 1,
                        name: 'John',
                        deletedAt: new Date(),
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        SoftDeleteUser,
                    );

                const result =
                    await repository.restore(
                        1,
                    );

                expect(result.affected)
                    .toBe(1);

                const rows =
                    await client.getRows(
                        'soft_delete_users',
                    );

                expect(rows[0]!.deletedAt)
                    .toBeNull();
            }
            finally
            {
                if (dataSource.isInitialized)
                {
                    await dataSource.destroy();
                }
            }
        },
    );

    test(
        'should exclude soft deleted entity from normal find',
        async () =>
        {
            const {
                dataSource,
            } =
                await createDataSource([
                    {
                        id: 1,
                        name: 'Deleted User',
                        deletedAt: new Date(),
                    },
                    {
                        id: 2,
                        name: 'Active User',
                        deletedAt: null,
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        SoftDeleteUser,
                    );

                const users =
                    await repository.find();

                expect(users)
                    .toHaveLength(1);

                expect(users[0]!.id)
                    .toBe(2);

                expect(users[0]!.name)
                    .toBe('Active User');
            }
            finally
            {
                if (dataSource.isInitialized)
                {
                    await dataSource.destroy();
                }
            }
        },
    );

    test(
        'should include soft deleted entity with withDeleted',
        async () =>
        {
            const {
                dataSource,
            } =
                await createDataSource([
                    {
                        id: 1,
                        name: 'Deleted User',
                        deletedAt: new Date(),
                    },
                    {
                        id: 2,
                        name: 'Active User',
                        deletedAt: null,
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        SoftDeleteUser,
                    );

                const users =
                    await repository.find({
                        withDeleted: true,
                    });

                expect(users)
                    .toHaveLength(2);

                expect(
                    users.some(
                        (item) => item.id === 1,
                    ),
                )
                    .toBe(true);

                expect(
                    users.some(
                        (item) => item.id === 2,
                    ),
                )
                    .toBe(true);
            }
            finally
            {
                if (dataSource.isInitialized)
                {
                    await dataSource.destroy();
                }
            }
        },
    );

    test(
        'should soft remove entity',
        async () =>
        {
            const {
                dataSource,
            } =
                await createDataSource([
                    {
                        id: 1,
                        name: 'John',
                        deletedAt: null,
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        SoftDeleteUser,
                    );

                const user =
                    await repository.findOneBy({
                        id: 1,
                    });

                expect(user)
                    .toBeDefined();

                await repository.softRemove(
                    user!,
                );

                const found =
                    await repository.findOne({
                        where: {
                            id: 1,
                        },
                    });

                expect(found)
                    .toBeNull();

                const deleted =
                    await repository.findOne({
                        where: {
                            id: 1,
                        },
                        withDeleted: true,
                    });

                expect(deleted)
                    .not
                    .toBeNull();

                expect(deleted!.deletedAt)
                    .toBeInstanceOf(Date);
            }
            finally
            {
                if (dataSource.isInitialized)
                {
                    await dataSource.destroy();
                }
            }
        },
    );

    test(
        'should exclude soft deleted relations',
        async () =>
        {
            const {
                dataSource,
            } =
                await createDataSource(
                    [
                        {
                            id: 1,
                            name: 'John',
                            deletedAt: null,
                        },
                    ],
                    [
                        {
                            id: 1,
                            title: 'Active Post',
                            userId: 1,
                            deletedAt: null,
                        },
                        {
                            id: 2,
                            title: 'Deleted Post',
                            userId: 1,
                            deletedAt: new Date(),
                        },
                    ],
                );

            try
            {
                const repository =
                    dataSource.getRepository(
                        SoftDeleteUser,
                    );

                const user =
                    await repository.findOne({
                        where: {
                            id: 1,
                        },
                        relations: {
                            posts: true,
                        },
                    });

                expect(user)
                    .toBeDefined();

                expect(user!.posts)
                    .toHaveLength(1);

                expect(user!.posts[0]!.id)
                    .toBe(1);

                expect(user!.posts[0]!.title)
                    .toBe('Active Post');
            }
            finally
            {
                if (dataSource.isInitialized)
                {
                    await dataSource.destroy();
                }
            }
        },
    );

    test(
        'should include soft deleted relations with withDeleted',
        async () =>
        {
            const {
                dataSource,
            } =
                await createDataSource(
                    [
                        {
                            id: 1,
                            name: 'John',
                            deletedAt: null,
                        },
                    ],
                    [
                        {
                            id: 1,
                            title: 'Active Post',
                            userId: 1,
                            deletedAt: null,
                        },
                        {
                            id: 2,
                            title: 'Deleted Post',
                            userId: 1,
                            deletedAt: new Date(),
                        },
                    ],
                );

            try
            {
                const repository =
                    dataSource.getRepository(
                        SoftDeleteUser,
                    );

                const user =
                    await repository.findOne({
                        where: {
                            id: 1,
                        },
                        relations: {
                            posts: true,
                        },
                        withDeleted: true,
                    });

                expect(user)
                    .toBeDefined();

                expect(user!.posts)
                    .toHaveLength(2);

                expect(
                    user!.posts.some(
                        (post) => post.id === 1,
                    ),
                )
                    .toBe(true);

                expect(
                    user!.posts.some(
                        (post) => post.id === 2,
                    ),
                )
                    .toBe(true);
            }
            finally
            {
                if (dataSource.isInitialized)
                {
                    await dataSource.destroy();
                }
            }
        },
    );

    test(
        'should hard delete entity',
        async () =>
        {
            const {
                client,
                dataSource,
            } =
                await createDataSource([
                    {
                        id: 1,
                        name: 'John',
                        deletedAt: new Date(),
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        SoftDeleteUser,
                    );

                const result =
                    await repository.delete(
                        1,
                    );

                expect(result.affected)
                    .toBe(1);

                const rows =
                    await client.getRows(
                        'soft_delete_users',
                    );

                expect(rows)
                    .toEqual([]);
            }
            finally
            {
                if (dataSource.isInitialized)
                {
                    await dataSource.destroy();
                }
            }
        },
    );
});
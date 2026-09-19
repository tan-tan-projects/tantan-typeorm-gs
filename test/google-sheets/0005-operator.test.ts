import { describe, expect, test } from 'bun:test';
import
{
    Between,
    Column,
    Entity,
    In,
    IsNull,
    LessThan,
    LessThanOrEqual,
    Like,
    MoreThan,
    MoreThanOrEqual,
    Not,
    PrimaryGeneratedColumn,
    Raw,
} from 'typeorm';
import { Memory } from '../../src/core/memory';
import { createGoogleSheetsDataSource, type GoogleSheetsRow } from '../../src';

describe('Query Operator', () =>
{
    @Entity('query_features_users')
    class QueryFeaturesUser
    {
        @PrimaryGeneratedColumn()
        id!: number;

        @Column()
        name!: string | null;

        @Column()
        email!: string;

        @Column()
        age!: number;
    }

    @Entity('query_features_events')
    class QueryFeaturesEvent
    {
        @PrimaryGeneratedColumn()
        id!: number;

        @Column({ type: 'date', nullable: true })
        expires_at!: Date | null;

        @Column()
        name!: string;
    }

    async function createDataSource(rows: GoogleSheetsRow[] = [])
    {
        const client = new Memory({ query_features_users: rows });

        await client.insertHeaders(
            'query_features_users',
            [
                'id',
                'name',
                'email',
                'age',
            ],
        );

        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',

                client,

                entities: [
                    QueryFeaturesUser,
                ],
            });

        await dataSource.initialize();

        return {
            client,
            dataSource,
        };
    }

    async function createEventDataSource(rows: GoogleSheetsRow[] = [])
    {
        const client =
            new Memory({
                query_features_events: rows,
            });

        await client.insertHeaders(
            'query_features_events',
            [
                'id',
                'expires_at',
                'name',
            ],
        );

        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',
                client,
                entities: [
                    QueryFeaturesEvent,
                ],
            });

        await dataSource.initialize();

        return {
            client,
            dataSource,
        };
    }

    test(
        'should support object criteria',
        async () =>
        {
            const {
                dataSource,
            } =
                await createDataSource([
                    {
                        id: 1,
                        name: 'John',
                        email: 'john@example.com',
                        age: 20,
                    },
                    {
                        id: 2,
                        name: 'Jane',
                        email: 'jane@example.com',
                        age: 25,
                    },
                    {
                        id: 3,
                        name: 'Bob',
                        email: 'bob@example.com',
                        age: 30,
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        QueryFeaturesUser,
                    );

                const users =
                    await repository.find({
                        where: {
                            name: 'John',
                        },
                    });

                expect(users)
                    .toEqual([
                        {
                            id: 1,
                            name: 'John',
                            email: 'john@example.com',
                            age: 20,
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
        'should support In operator',
        async () =>
        {
            const {
                dataSource,
            } =
                await createDataSource([
                    {
                        id: 1,
                        name: 'John',
                        email: 'john@example.com',
                        age: 20,
                    },
                    {
                        id: 2,
                        name: 'Jane',
                        email: 'jane@example.com',
                        age: 25,
                    },
                    {
                        id: 3,
                        name: 'Bob',
                        email: 'bob@example.com',
                        age: 30,
                    },
                    {
                        id: 4,
                        name: 'Alice',
                        email: 'alice@example.com',
                        age: 35,
                    },
                    {
                        id: 5,
                        name: 'Johnny',
                        email: 'johnny@example.com',
                        age: 40,
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        QueryFeaturesUser,
                    );

                const users =
                    await repository.find({
                        where: {
                            id: In([1, 3, 5]),
                        },
                    });

                expect(users)
                    .toEqual([
                        {
                            id: 1,
                            name: 'John',
                            email: 'john@example.com',
                            age: 20,
                        },
                        {
                            id: 3,
                            name: 'Bob',
                            email: 'bob@example.com',
                            age: 30,
                        },
                        {
                            id: 5,
                            name: 'Johnny',
                            email: 'johnny@example.com',
                            age: 40,
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
        'should support Not operator',
        async () =>
        {
            const {
                dataSource,
            } =
                await createDataSource([
                    {
                        id: 1,
                        name: 'John',
                        email: 'john@example.com',
                        age: 20,
                    },
                    {
                        id: 2,
                        name: 'Jane',
                        email: 'jane@example.com',
                        age: 25,
                    },
                    {
                        id: 3,
                        name: 'Bob',
                        email: 'bob@example.com',
                        age: 30,
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        QueryFeaturesUser,
                    );

                const users =
                    await repository.find({
                        where: {
                            name: Not('John'),
                        },
                    });

                expect(users)
                    .toEqual([
                        {
                            id: 2,
                            name: 'Jane',
                            email: 'jane@example.com',
                            age: 25,
                        },
                        {
                            id: 3,
                            name: 'Bob',
                            email: 'bob@example.com',
                            age: 30,
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
        'should support Like operator',
        async () =>
        {
            const {
                dataSource,
            } =
                await createDataSource([
                    {
                        id: 1,
                        name: 'John',
                        email: 'john@example.com',
                        age: 20,
                    },
                    {
                        id: 2,
                        name: 'Jane',
                        email: 'jane@example.com',
                        age: 25,
                    },
                    {
                        id: 3,
                        name: 'Johnny',
                        email: 'johnny@example.com',
                        age: 40,
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        QueryFeaturesUser,
                    );

                const users =
                    await repository.find({
                        where: {
                            name: Like('John%'),
                        },
                    });

                expect(users)
                    .toEqual([
                        {
                            id: 1,
                            name: 'John',
                            email: 'john@example.com',
                            age: 20,
                        },
                        {
                            id: 3,
                            name: 'Johnny',
                            email: 'johnny@example.com',
                            age: 40,
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
        'should support Between operator',
        async () =>
        {
            const {
                dataSource,
            } =
                await createDataSource([
                    {
                        id: 1,
                        name: 'John',
                        email: 'john@example.com',
                        age: 20,
                    },
                    {
                        id: 2,
                        name: 'Jane',
                        email: 'jane@example.com',
                        age: 25,
                    },
                    {
                        id: 3,
                        name: 'Bob',
                        email: 'bob@example.com',
                        age: 30,
                    },
                    {
                        id: 4,
                        name: 'Alice',
                        email: 'alice@example.com',
                        age: 35,
                    },
                    {
                        id: 5,
                        name: 'Johnny',
                        email: 'johnny@example.com',
                        age: 40,
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        QueryFeaturesUser,
                    );

                const users =
                    await repository.find({
                        where: {
                            age: Between(25, 35),
                        },
                    });

                expect(users)
                    .toEqual([
                        {
                            id: 2,
                            name: 'Jane',
                            email: 'jane@example.com',
                            age: 25,
                        },
                        {
                            id: 3,
                            name: 'Bob',
                            email: 'bob@example.com',
                            age: 30,
                        },
                        {
                            id: 4,
                            name: 'Alice',
                            email: 'alice@example.com',
                            age: 35,
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
        'should support MoreThan operator',
        async () =>
        {
            const {
                dataSource,
            } =
                await createDataSource([
                    {
                        id: 1,
                        name: 'John',
                        email: 'john@example.com',
                        age: 20,
                    },
                    {
                        id: 2,
                        name: 'Jane',
                        email: 'jane@example.com',
                        age: 25,
                    },
                    {
                        id: 3,
                        name: 'Bob',
                        email: 'bob@example.com',
                        age: 30,
                    },
                    {
                        id: 4,
                        name: 'Alice',
                        email: 'alice@example.com',
                        age: 35,
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        QueryFeaturesUser,
                    );

                const users =
                    await repository.find({
                        where: {
                            age: MoreThan(30),
                        },
                    });

                expect(users)
                    .toEqual([
                        {
                            id: 4,
                            name: 'Alice',
                            email: 'alice@example.com',
                            age: 35,
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
        'should support MoreThanOrEqual operator',
        async () =>
        {
            const {
                dataSource,
            } =
                await createDataSource([
                    {
                        id: 1,
                        name: 'John',
                        email: 'john@example.com',
                        age: 20,
                    },
                    {
                        id: 2,
                        name: 'Jane',
                        email: 'jane@example.com',
                        age: 25,
                    },
                    {
                        id: 3,
                        name: 'Bob',
                        email: 'bob@example.com',
                        age: 30,
                    },
                    {
                        id: 4,
                        name: 'Alice',
                        email: 'alice@example.com',
                        age: 35,
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        QueryFeaturesUser,
                    );

                const users =
                    await repository.find({
                        where: {
                            age: MoreThanOrEqual(30),
                        },
                    });

                expect(users)
                    .toEqual([
                        {
                            id: 3,
                            name: 'Bob',
                            email: 'bob@example.com',
                            age: 30,
                        },
                        {
                            id: 4,
                            name: 'Alice',
                            email: 'alice@example.com',
                            age: 35,
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
        'should support LessThan operator',
        async () =>
        {
            const {
                dataSource,
            } =
                await createDataSource([
                    {
                        id: 1,
                        name: 'John',
                        email: 'john@example.com',
                        age: 20,
                    },
                    {
                        id: 2,
                        name: 'Jane',
                        email: 'jane@example.com',
                        age: 25,
                    },
                    {
                        id: 3,
                        name: 'Bob',
                        email: 'bob@example.com',
                        age: 30,
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        QueryFeaturesUser,
                    );

                const users =
                    await repository.find({
                        where: {
                            age: LessThan(30),
                        },
                    });

                expect(users)
                    .toEqual([
                        {
                            id: 1,
                            name: 'John',
                            email: 'john@example.com',
                            age: 20,
                        },
                        {
                            id: 2,
                            name: 'Jane',
                            email: 'jane@example.com',
                            age: 25,
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
        'should support LessThanOrEqual operator',
        async () =>
        {
            const {
                dataSource,
            } =
                await createDataSource([
                    {
                        id: 1,
                        name: 'John',
                        email: 'john@example.com',
                        age: 20,
                    },
                    {
                        id: 2,
                        name: 'Jane',
                        email: 'jane@example.com',
                        age: 25,
                    },
                    {
                        id: 3,
                        name: 'Bob',
                        email: 'bob@example.com',
                        age: 30,
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        QueryFeaturesUser,
                    );

                const users =
                    await repository.find({
                        where: {
                            age: LessThanOrEqual(25),
                        },
                    });

                expect(users)
                    .toEqual([
                        {
                            id: 1,
                            name: 'John',
                            email: 'john@example.com',
                            age: 20,
                        },
                        {
                            id: 2,
                            name: 'Jane',
                            email: 'jane@example.com',
                            age: 25,
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
        'should support IsNull operator',
        async () =>
        {
            const {
                dataSource,
            } =
                await createDataSource([
                    {
                        id: 1,
                        name: 'John',
                        email: 'john@example.com',
                        age: 20,
                    },
                    {
                        id: 2,
                        name: null,
                        email: 'null@example.com',
                        age: 25,
                    },
                    {
                        id: 3,
                        name: 'Bob',
                        email: 'bob@example.com',
                        age: 30,
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        QueryFeaturesUser,
                    );

                const users =
                    await repository.find({
                        where: {
                            name: IsNull(),
                        },
                    });

                expect(users)
                    .toEqual([
                        {
                            id: 2,
                            name: null,
                            email: 'null@example.com',
                            age: 25,
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
        'should support ordering',
        async () =>
        {
            const {
                dataSource,
            } =
                await createDataSource([
                    {
                        id: 1,
                        name: 'John',
                        email: 'john@example.com',
                        age: 20,
                    },
                    {
                        id: 2,
                        name: 'Jane',
                        email: 'jane@example.com',
                        age: 25,
                    },
                    {
                        id: 3,
                        name: 'Bob',
                        email: 'bob@example.com',
                        age: 30,
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        QueryFeaturesUser,
                    );

                const users =
                    await repository.find({
                        order: {
                            age: 'DESC',
                        },
                    });

                expect(users)
                    .toEqual([
                        {
                            id: 3,
                            name: 'Bob',
                            email: 'bob@example.com',
                            age: 30,
                        },
                        {
                            id: 2,
                            name: 'Jane',
                            email: 'jane@example.com',
                            age: 25,
                        },
                        {
                            id: 1,
                            name: 'John',
                            email: 'john@example.com',
                            age: 20,
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
        'should support skip',
        async () =>
        {
            const {
                dataSource,
            } =
                await createDataSource([
                    {
                        id: 1,
                        name: 'John',
                        email: 'john@example.com',
                        age: 20,
                    },
                    {
                        id: 2,
                        name: 'Jane',
                        email: 'jane@example.com',
                        age: 25,
                    },
                    {
                        id: 3,
                        name: 'Bob',
                        email: 'bob@example.com',
                        age: 30,
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        QueryFeaturesUser,
                    );

                const users =
                    await repository.find({
                        skip: 1,
                    });

                expect(users)
                    .toEqual([
                        {
                            id: 2,
                            name: 'Jane',
                            email: 'jane@example.com',
                            age: 25,
                        },
                        {
                            id: 3,
                            name: 'Bob',
                            email: 'bob@example.com',
                            age: 30,
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
        'should support take',
        async () =>
        {
            const {
                dataSource,
            } =
                await createDataSource([
                    {
                        id: 1,
                        name: 'John',
                        email: 'john@example.com',
                        age: 20,
                    },
                    {
                        id: 2,
                        name: 'Jane',
                        email: 'jane@example.com',
                        age: 25,
                    },
                    {
                        id: 3,
                        name: 'Bob',
                        email: 'bob@example.com',
                        age: 30,
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        QueryFeaturesUser,
                    );

                const users =
                    await repository.find({
                        take: 2,
                    });

                expect(users)
                    .toEqual([
                        {
                            id: 1,
                            name: 'John',
                            email: 'john@example.com',
                            age: 20,
                        },
                        {
                            id: 2,
                            name: 'Jane',
                            email: 'jane@example.com',
                            age: 25,
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
        'should support pagination using skip and take',
        async () =>
        {
            const {
                dataSource,
            } =
                await createDataSource([
                    {
                        id: 1,
                        name: 'John',
                        email: 'john@example.com',
                        age: 20,
                    },
                    {
                        id: 2,
                        name: 'Jane',
                        email: 'jane@example.com',
                        age: 25,
                    },
                    {
                        id: 3,
                        name: 'Bob',
                        email: 'bob@example.com',
                        age: 30,
                    },
                    {
                        id: 4,
                        name: 'Alice',
                        email: 'alice@example.com',
                        age: 35,
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        QueryFeaturesUser,
                    );

                const users =
                    await repository.find({
                        skip: 1,
                        take: 2,
                    });

                expect(users)
                    .toEqual([
                        {
                            id: 2,
                            name: 'Jane',
                            email: 'jane@example.com',
                            age: 25,
                        },
                        {
                            id: 3,
                            name: 'Bob',
                            email: 'bob@example.com',
                            age: 30,
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
        'should support partial select',
        async () =>
        {
            const {
                dataSource,
            } =
                await createDataSource([
                    {
                        id: 1,
                        name: 'John',
                        email: 'john@example.com',
                        age: 20,
                    },
                    {
                        id: 2,
                        name: 'Jane',
                        email: 'jane@example.com',
                        age: 25,
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        QueryFeaturesUser,
                    );

                const users =
                    await repository.find({
                        select: {
                            id: true,
                            name: true,
                        },
                    });

                expect(users as Partial<QueryFeaturesUser>[])
                    .toEqual([
                        {
                            id: 1,
                            name: 'John',
                        },
                        {
                            id: 2,
                            name: 'Jane',
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
        });

    test(
        'should support Raw greater than with ISO date string',
        async () =>
        {
            const {
                dataSource,
            } =
                await createEventDataSource([
                    {
                        id: 1,
                        expires_at: '2026-09-19T09:00:00.000Z',
                        name: 'Expired',
                    },
                    {
                        id: 2,
                        expires_at: '2026-09-19T11:00:00.000Z',
                        name: 'Active',
                    },
                    {
                        id: 3,
                        expires_at: null,
                        name: 'Never expires',
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        QueryFeaturesEvent,
                    );

                const now =
                    new Date(
                        '2026-09-19T10:00:00.000Z',
                    );

                const events =
                    await repository.find({
                        where: {
                            expires_at: Raw(
                                (alias) =>
                                    `${alias} > :now`,
                                {
                                    now,
                                },
                            ),
                        },
                    });

                expect(events.map(
                    event => event.id,
                ))
                    .toEqual([2]);
            }
            finally
            {
                if (dataSource.isInitialized)
                {
                    await dataSource.destroy();
                }
            }
        });

    test(
        'should support Raw nullable date condition with ISO date string',
        async () =>
        {
            const {
                dataSource,
            } =
                await createEventDataSource([
                    {
                        id: 1,
                        expires_at: null,
                        name: 'Never expires',
                    },
                    {
                        id: 2,
                        expires_at: '2026-09-19T11:00:00.000Z',
                        name: 'Active',
                    },
                    {
                        id: 3,
                        expires_at: '2026-09-19T09:00:00.000Z',
                        name: 'Expired',
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        QueryFeaturesEvent,
                    );

                const now =
                    new Date(
                        '2026-09-19T10:00:00.000Z',
                    );

                const events =
                    await repository.find({
                        where: {
                            expires_at: Raw(
                                (alias) =>
                                    `(${alias} IS NULL OR ${alias} > :now)`,
                                {
                                    now,
                                },
                            ),
                        },
                    });

                expect(events.map(
                    event => event.id,
                ))
                    .toEqual([1, 2]);
            }
            finally
            {
                if (dataSource.isInitialized)
                {
                    await dataSource.destroy();
                }
            }
        });

    test(
        'should support Raw BETWEEN with ISO date strings',
        async () =>
        {
            const {
                dataSource,
            } =
                await createEventDataSource([
                    {
                        id: 1,
                        expires_at: '2026-09-19T09:59:59.999Z',
                        name: 'Before',
                    },
                    {
                        id: 2,
                        expires_at: '2026-09-19T10:30:00.000Z',
                        name: 'Inside',
                    },
                    {
                        id: 3,
                        expires_at: '2026-09-19T12:00:00.000Z',
                        name: 'Boundary',
                    },
                    {
                        id: 4,
                        expires_at: '2026-09-19T12:00:00.001Z',
                        name: 'After',
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        QueryFeaturesEvent,
                    );

                const min =
                    new Date(
                        '2026-09-19T10:00:00.000Z',
                    );

                const max =
                    new Date(
                        '2026-09-19T12:00:00.000Z',
                    );

                const events =
                    await repository.find({
                        where: {
                            expires_at: Raw(
                                (alias) =>
                                    `${alias} BETWEEN :min AND :max`,
                                {
                                    min,
                                    max,
                                },
                            ),
                        },
                    });

                expect(events.map(
                    event => event.id,
                ))
                    .toEqual([2, 3]);
            }
            finally
            {
                if (dataSource.isInitialized)
                {
                    await dataSource.destroy();
                }
            }
        });
});
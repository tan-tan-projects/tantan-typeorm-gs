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

    async function createDataSource(
        rows: GoogleSheetsRow[] = [],
    )
    {
        const client =
            new Memory({
                query_features_users: rows,
            });

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
        },
    );
},
);
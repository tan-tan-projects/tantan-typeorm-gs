import { describe, expect, test } from 'bun:test';
import
{
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Memory } from '../../src/core/memory';
import { createGoogleSheetsDataSource, type GoogleSheetsRow } from '../../src';

describe('Query Object Criteria', () =>
{
    @Entity('query_users')
    class QueryUser
    {
        @PrimaryGeneratedColumn()
        id!: number;

        @Column()
        name!: string;

        @Column()
        email!: string;
    }

    async function createDataSource(
        rows: GoogleSheetsRow[] = [],
    )
    {
        const client =
            new Memory({
                query_users: rows,
            });

        await client.insertHeaders(
            'query_users',
            [
                'id',
                'name',
                'email',
            ],
        );

        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',

                client,

                entities: [
                    QueryUser,
                ],
            });

        await dataSource.initialize();

        return {
            client,
            dataSource,
        };
    }

    test(
        'should find entities using object criteria',
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
                    },
                    {
                        id: 2,
                        name: 'Jane',
                        email: 'jane@example.com',
                    },
                    {
                        id: 3,
                        name: 'John',
                        email: 'john2@example.com',
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        QueryUser,
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
                        },
                        {
                            id: 3,
                            name: 'John',
                            email: 'john2@example.com',
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
        'should find one entity using object criteria',
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
                    },
                    {
                        id: 2,
                        name: 'Jane',
                        email: 'jane@example.com',
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        QueryUser,
                    );

                const user =
                    await repository.findOne({
                        where: {
                            email: 'jane@example.com',
                        },
                    });

                expect(user)
                    .toEqual({
                        id: 2,
                        name: 'Jane',
                        email: 'jane@example.com',
                    });
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
        'should find entities using multiple object criteria',
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
                    },
                    {
                        id: 2,
                        name: 'Jane',
                        email: 'jane@example.com',
                    },
                    {
                        id: 3,
                        name: 'John',
                        email: 'john2@example.com',
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        QueryUser,
                    );

                const users =
                    await repository.find({
                        where: {
                            name: 'John',
                            email: 'john@example.com',
                        },
                    });

                expect(users)
                    .toEqual([
                        {
                            id: 1,
                            name: 'John',
                            email: 'john@example.com',
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
        'should return empty result when object criteria does not match',
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
                    },
                    {
                        id: 2,
                        name: 'Jane',
                        email: 'jane@example.com',
                    },
                ]);

            try
            {
                const repository =
                    dataSource.getRepository(
                        QueryUser,
                    );

                const users =
                    await repository.find({
                        where: {
                            name: 'Unknown',
                        },
                    });

                expect(users)
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
},
);
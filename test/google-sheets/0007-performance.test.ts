import { describe, expect, test } from 'bun:test';
import
{
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Memory } from '../../src/core/memory';
import { createGoogleSheetsDataSource, type GoogleSheetsRow } from '../../src';


describe(
    'Google Sheets API Performance',
    () =>
    {
        @Entity('performance_users')
        class PerformanceUser
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
                    performance_users: rows,
                });

            await client.insertHeaders(
                'performance_users',
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
                        PerformanceUser,
                    ],
                });

            await dataSource.initialize();

            return {
                client,
                dataSource,
            };
        }

        test('should insert 100 rows within acceptable time',
            async () =>
            {
                const {
                    client,
                    dataSource,
                } =
                    await createDataSource();

                try
                {
                    const repository =
                        dataSource.getRepository(
                            PerformanceUser,
                        );

                    const users =
                        Array.from(
                            {
                                length: 1000,
                            },
                            (_, index) => ({
                                name:
                                    `User ${index + 1} `,
                                email:
                                    `user${index + 1} @example.com`,
                            }),
                        );

                    const start =
                        performance.now();

                    await repository.insert(
                        users,
                    );

                    const elapsed =
                        performance.now() -
                        start;

                    const rows =
                        await client.getRows(
                            'performance_users',
                        );

                    expect(rows)
                        .toHaveLength(1000);

                    expect(elapsed)
                        .toBeLessThan(5000);
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
            'should read 100 rows within acceptable time',
            async () =>
            {
                const rows =
                    Array.from(
                        {
                            length: 100,
                        },
                        (_, index) => ({
                            id: index + 1,
                            name:
                                `User ${index + 1} `,
                            email:
                                `user${index + 1} @example.com`,
                        }),
                    );

                const {
                    dataSource,
                } =
                    await createDataSource(rows);

                try
                {
                    const repository =
                        dataSource.getRepository(
                            PerformanceUser,
                        );

                    const start =
                        performance.now();

                    const users =
                        await repository.find();

                    const elapsed =
                        performance.now() -
                        start;

                    expect(users)
                        .toHaveLength(100);

                    expect(elapsed)
                        .toBeLessThan(300);
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

        test('should insert 1000 rows within acceptable time',
            async () =>
            {
                const {
                    client,
                    dataSource,
                } =
                    await createDataSource();

                try
                {
                    const repository =
                        dataSource.getRepository(
                            PerformanceUser,
                        );

                    const users =
                        Array.from(
                            {
                                length: 1000,
                            },
                            (_, index) => ({
                                name:
                                    `User ${index + 1} `,
                                email:
                                    `user${index + 1} @example.com`,
                            }),
                        );

                    const start =
                        performance.now();

                    await repository.insert(
                        users,
                    );

                    const elapsed =
                        performance.now() -
                        start;

                    const rows =
                        await client.getRows(
                            'performance_users',
                        );

                    expect(rows)
                        .toHaveLength(1000);

                    expect(elapsed)
                        .toBeLessThan(1000);
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
            'should read 1000 rows within acceptable time',
            async () =>
            {
                const rows =
                    Array.from(
                        {
                            length: 1000,
                        },
                        (_, index) => ({
                            id: index + 1,
                            name:
                                `User ${index + 1} `,
                            email:
                                `user${index + 1} @example.com`,
                        }),
                    );

                const {
                    dataSource,
                } =
                    await createDataSource(rows);

                try
                {
                    const repository =
                        dataSource.getRepository(
                            PerformanceUser,
                        );

                    const start =
                        performance.now();

                    const users =
                        await repository.find();

                    const elapsed =
                        performance.now() -
                        start;

                    expect(users)
                        .toHaveLength(1000);

                    expect(elapsed)
                        .toBeLessThan(1000);
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

        test('should insert 10000 rows within acceptable time',
            async () =>
            {
                const {
                    client,
                    dataSource,
                } =
                    await createDataSource();

                try
                {
                    const repository =
                        dataSource.getRepository(
                            PerformanceUser,
                        );

                    const users =
                        Array.from(
                            {
                                length: 10000,
                            },
                            (_, index) => ({
                                name:
                                    `User ${index + 1} `,
                                email:
                                    `user${index + 1} @example.com`,
                            }),
                        );

                    const start =
                        performance.now();

                    await repository.insert(
                        users,
                    );

                    const elapsed =
                        performance.now() -
                        start;

                    const rows =
                        await client.getRows(
                            'performance_users',
                        );

                    expect(rows)
                        .toHaveLength(10000);

                    expect(elapsed)
                        .toBeLessThan(3000);
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
            'should read 10000 rows within acceptable time',
            async () =>
            {
                const rows =
                    Array.from(
                        {
                            length: 10000,
                        },
                        (_, index) => ({
                            id: index + 1,
                            name:
                                `User ${index + 1} `,
                            email:
                                `user${index + 1} @example.com`,
                        }),
                    );

                const {
                    dataSource,
                } =
                    await createDataSource(rows);

                try
                {
                    const repository =
                        dataSource.getRepository(
                            PerformanceUser,
                        );

                    const start =
                        performance.now();

                    const users =
                        await repository.find();

                    const elapsed =
                        performance.now() -
                        start;

                    expect(users)
                        .toHaveLength(10000);

                    expect(elapsed)
                        .toBeLessThan(3000);
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

        test('should insert 100000 rows within acceptable time',
            async () =>
            {
                const {
                    client,
                    dataSource,
                } =
                    await createDataSource();

                try
                {
                    const repository =
                        dataSource.getRepository(
                            PerformanceUser,
                        );

                    const users =
                        Array.from(
                            {
                                length: 100000,
                            },
                            (_, index) => ({
                                name:
                                    `User ${index + 1} `,
                                email:
                                    `user${index + 1} @example.com`,
                            }),
                        );

                    const start =
                        performance.now();

                    await repository.insert(
                        users,
                    );

                    const elapsed =
                        performance.now() -
                        start;

                    const rows =
                        await client.getRows(
                            'performance_users',
                        );

                    expect(rows)
                        .toHaveLength(100000);

                    expect(elapsed)
                        .toBeLessThan(5000);
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
            'should read 100000 rows within acceptable time',
            async () =>
            {
                const rows =
                    Array.from(
                        {
                            length: 100000,
                        },
                        (_, index) => ({
                            id: index + 1,
                            name:
                                `User ${index + 1} `,
                            email:
                                `user${index + 1} @example.com`,
                        }),
                    );

                const {
                    dataSource,
                } =
                    await createDataSource(rows);

                try
                {
                    const repository =
                        dataSource.getRepository(
                            PerformanceUser,
                        );

                    const start =
                        performance.now();

                    const users =
                        await repository.find();

                    const elapsed =
                        performance.now() -
                        start;

                    expect(users)
                        .toHaveLength(100000);

                    expect(elapsed)
                        .toBeLessThan(5000);
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
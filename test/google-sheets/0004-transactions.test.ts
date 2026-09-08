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
    'CRUD Compatibility',
    () =>
    {
        @Entity('crud_users')
        class CrudUser
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
                    crud_users: rows,
                });

            await client.insertHeaders(
                'crud_users',
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
                        CrudUser,
                    ],
                });

            await dataSource.initialize();

            return {
                client,
                dataSource,
            };
        }

        test(
            'should save entity',
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
                            CrudUser,
                        );

                    const user =
                        await repository.save({
                            name: 'John',
                            email: 'john@example.com',
                        });

                    expect(user)
                        .toBeDefined();

                    expect(user.name)
                        .toBe('John');

                    expect(user.email)
                        .toBe('john@example.com');

                    const rows =
                        await client.getRows(
                            'crud_users',
                        );

                    expect(rows)
                        .toHaveLength(1);

                    expect(rows[0])
                        .toMatchObject({
                            name: 'John',
                            email: 'john@example.com',
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
            'should update entity',
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
                            email: 'john@example.com',
                        },
                    ]);

                try
                {
                    const repository =
                        dataSource.getRepository(
                            CrudUser,
                        );

                    const user =
                        await repository.findOneBy({
                            id: 1,
                        });

                    expect(user)
                        .toBeDefined();

                    user!.name =
                        'John Updated';

                    await repository.save(
                        user!,
                    );

                    const rows =
                        await client.getRows(
                            'crud_users',
                        );

                    expect(rows)
                        .toEqual([
                            {
                                id: 1,
                                name: 'John Updated',
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
            'should delete entity',
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
                            CrudUser,
                        );

                    const user =
                        await repository.findOneBy({
                            id: 1,
                        });

                    expect(user)
                        .toBeDefined();

                    await repository.remove(
                        user!,
                    );

                    const rows =
                        await client.getRows(
                            'crud_users',
                        );

                    expect(rows)
                        .toEqual([
                            {
                                id: 2,
                                name: 'Jane',
                                email: 'jane@example.com',
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
            'should insert entity',
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
                            CrudUser,
                        );

                    const result =
                        await repository.insert({
                            id: 1,
                            name: 'John',
                            email: 'john@example.com',
                        });

                    expect(result)
                        .toBeDefined();

                    const rows =
                        await client.getRows(
                            'crud_users',
                        );

                    expect(rows)
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
            'should remove entity',
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
                            CrudUser,
                        );

                    const result =
                        await repository.delete({
                            id: 1,
                        });

                    expect(result.affected)
                        .toBe(1);

                    const rows =
                        await client.getRows(
                            'crud_users',
                        );

                    expect(rows)
                        .toEqual([
                            {
                                id: 2,
                                name: 'Jane',
                                email: 'jane@example.com',
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
            'should bulk insert entities',
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
                            CrudUser,
                        );

                    const result =
                        await repository.insert([
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
                                name: 'Bob',
                                email: 'bob@example.com',
                            },
                        ]);

                    expect(result)
                        .toBeDefined();

                    const rows =
                        await client.getRows(
                            'crud_users',
                        );

                    expect(rows)
                        .toEqual([
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
                                name: 'Bob',
                                email: 'bob@example.com',
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
            'should bulk update entities',
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
                            email: 'john@example.com',
                        },
                        {
                            id: 2,
                            name: 'Jane',
                            email: 'jane@example.com',
                        },
                        {
                            id: 3,
                            name: 'Bob',
                            email: 'bob@example.com',
                        },
                    ]);

                try
                {
                    const repository =
                        dataSource.getRepository(
                            CrudUser,
                        );

                    const result =
                        await repository.update(
                            {
                                id: 1,
                            },
                            {
                                name: 'John Updated',
                            },
                        );

                    expect(result.affected)
                        .toBe(1);

                    const rows =
                        await client.getRows(
                            'crud_users',
                        );

                    expect(rows)
                        .toEqual([
                            {
                                id: 1,
                                name: 'John Updated',
                                email: 'john@example.com',
                            },
                            {
                                id: 2,
                                name: 'Jane',
                                email: 'jane@example.com',
                            },
                            {
                                id: 3,
                                name: 'Bob',
                                email: 'bob@example.com',
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
            'should bulk delete entities',
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
                            email: 'john@example.com',
                        },
                        {
                            id: 2,
                            name: 'Jane',
                            email: 'jane@example.com',
                        },
                        {
                            id: 3,
                            name: 'Bob',
                            email: 'bob@example.com',
                        },
                    ]);

                try
                {
                    const repository =
                        dataSource.getRepository(
                            CrudUser,
                        );

                    const result =
                        await repository.delete([
                            {
                                id: 1,
                            },
                            {
                                id: 2,
                            },
                        ]);

                    expect(result.affected)
                        .toBe(2);

                    const rows =
                        await client.getRows(
                            'crud_users',
                        );

                    expect(rows)
                        .toEqual([
                            {
                                id: 3,
                                name: 'Bob',
                                email: 'bob@example.com',
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
            'should find entities',
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
                            CrudUser,
                        );

                    const users =
                        await repository.find();

                    expect(users)
                        .toHaveLength(2);

                    expect(users)
                        .toEqual([
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
            'should find one entity',
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
                            CrudUser,
                        );

                    const user =
                        await repository.findOneBy({
                            id: 2,
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
            'should find entities by criteria',
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
                            CrudUser,
                        );

                    const users =
                        await repository.findBy({
                            name: 'John',
                        });

                    expect(users)
                        .toHaveLength(2);

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
            'should find one entity by criteria',
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
                            CrudUser,
                        );

                    const user =
                        await repository.findOneBy({
                            email: 'jane@example.com',
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
            'should find and count entities',
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
                            name: 'Bob',
                            email: 'bob@example.com',
                        },
                    ]);

                try
                {
                    const repository =
                        dataSource.getRepository(
                            CrudUser,
                        );

                    const [
                        users,
                        count,
                    ] =
                        await repository.findAndCount();

                    expect(users)
                        .toHaveLength(3);

                    expect(count)
                        .toBe(3);
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
            'should count entities',
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
                            name: 'Bob',
                            email: 'bob@example.com',
                        },
                    ]);

                try
                {
                    const repository =
                        dataSource.getRepository(
                            CrudUser,
                        );

                    const count =
                        await repository.count();

                    expect(count)
                        .toBe(3);
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
            'should count entities by criteria',
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
                            CrudUser,
                        );

                    const count =
                        await repository.countBy({
                            name: 'John',
                        });

                    expect(count)
                        .toBe(2);
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
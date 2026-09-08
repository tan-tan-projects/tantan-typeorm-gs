import { describe, expect, test } from 'bun:test';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { createGoogleSheetsDataSource } from '../../src';
import { Memory } from '../../src/core/memory';

describe('GoogleSheetsLogging', () =>
{
    @Entity()
    class User
    {
        @PrimaryGeneratedColumn()
        id!: number;

        @Column()
        name!: string;
    }

    test(
        'logs query when logging includes query',
        async () =>
        {
            const dataSource = createGoogleSheetsDataSource({
                type: 'google-sheets',
                client: new Memory({
                    user: [
                        {
                            id: 1,
                            name: 'Basuni',
                        },
                    ],
                }),
                entities: [User],
                logging: ['query'],
            });

            await dataSource.initialize();

            try
            {
                const repository =
                    dataSource.getRepository(User);

                await repository.find();
            }
            finally
            {
                await dataSource.destroy();
            }
        },
    );

    test(
        'logs query error when logging includes error',
        async () =>
        {
            const dataSource = createGoogleSheetsDataSource({
                type: 'google-sheets',
                client: new Memory({
                    user: [
                        {
                            id: 1,
                            name: 'Basuni',
                        },
                    ],
                }),
                entities: [User],
                logging: ['error'],
            });

            await dataSource.initialize();

            try
            {
                const queryRunner =
                    dataSource.createQueryRunner();

                await queryRunner.connect();

                try
                {
                    await expect(
                        queryRunner.query(
                            'INVALID QUERY',
                        ),
                    ).rejects.toThrow();
                }
                finally
                {
                    await queryRunner.release();
                }
            }
            finally
            {
                await dataSource.destroy();
            }
        },
    );

    test(
        'logs schema when logging includes schema',
        async () =>
        {
            const dataSource = createGoogleSheetsDataSource({
                type: 'google-sheets',
                client: new Memory({
                    user: [],
                }),
                entities: [User],
                synchronize: true,
                logging: ['schema'],
            });

            await dataSource.initialize();

            await dataSource.destroy();
        },
    );

    test(
        'does not log query when logging is empty',
        async () =>
        {
            const dataSource = createGoogleSheetsDataSource({
                type: 'google-sheets',
                client: new Memory({
                    user: [
                        {
                            id: 1,
                            name: 'Basuni',
                        },
                    ],
                }),
                entities: [User],
                logging: [],
            });

            await dataSource.initialize();

            try
            {
                const repository =
                    dataSource.getRepository(User);

                await repository.find();
            }
            finally
            {
                await dataSource.destroy();
            }
        },
    );

    test(
        'logs all events when logging is true',
        async () =>
        {
            const dataSource = createGoogleSheetsDataSource({
                type: 'google-sheets',
                client: new Memory({
                    user: [],
                }),
                entities: [User],
                synchronize: true,
                logging: true,
            });

            await dataSource.initialize();

            try
            {
                const repository =
                    dataSource.getRepository(User);

                await repository.find();
            }
            finally
            {
                await dataSource.destroy();
            }
        },
    );
});
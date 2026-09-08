import { describe, expect, test } from 'bun:test';
import
{
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Memory } from '../../src/core/memory';
import { createGoogleSheetsDataSource } from '../../src/core/data-source';

describe('GoogleSheetsDataSource - Select', () =>
{
    @Entity()
    class User
    {
        @PrimaryGeneratedColumn()
        id!: number;

        @Column()
        name!: string;
    }

    test('finds all entities', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                user: [
                    { id: 1, name: 'Basuni' },
                    { id: 2, name: 'Budi' },
                    { id: 3, name: 'Andi' },
                ],
            }),
            entities: [User],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const users = await repository.find();

        expect(users).toHaveLength(3);

        expect(users.map((user) => user.id)).toEqual([
            1,
            2,
            3,
        ]);

        expect(users.map((user) => user.name)).toEqual([
            'Basuni',
            'Budi',
            'Andi',
        ]);

        await dataSource.destroy();
    });

    test('selects specific columns', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                user: [
                    { id: 1, name: 'Basuni' },
                    { id: 2, name: 'Budi' },
                    { id: 3, name: 'Andi' },
                ],
            }),
            entities: [User],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const users = await repository
            .createQueryBuilder('user')
            .select([
                'user.id',
                'user.name',
            ])
            .getMany();

        expect(users).toHaveLength(3);

        expect(users[0]).toMatchObject({
            id: 1,
            name: 'Basuni',
        });

        await dataSource.destroy();
    });

    test('orders entities ascending', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                user: [
                    { id: 3, name: 'Andi' },
                    { id: 1, name: 'Basuni' },
                    { id: 2, name: 'Budi' },
                ],
            }),
            entities: [User],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const users = await repository
            .createQueryBuilder('user')
            .orderBy('user.id', 'ASC')
            .getMany();

        expect(users.map((user) => user.id)).toEqual([
            1,
            2,
            3,
        ]);

        await dataSource.destroy();
    });

    test('orders entities descending', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                user: [
                    { id: 3, name: 'Andi' },
                    { id: 1, name: 'Basuni' },
                    { id: 2, name: 'Budi' },
                ],
            }),
            entities: [User],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const users = await repository
            .createQueryBuilder('user')
            .orderBy('user.id', 'DESC')
            .getMany();

        expect(users.map((user) => user.id)).toEqual([
            3,
            2,
            1,
        ]);

        await dataSource.destroy();
    });

    test('limits selected entities', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                user: [
                    { id: 1, name: 'Basuni' },
                    { id: 2, name: 'Budi' },
                    { id: 3, name: 'Andi' },
                ],
            }),
            entities: [User],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const users = await repository
            .createQueryBuilder('user')
            .take(2)
            .getMany();

        expect(users.map((user) => user.id)).toEqual([
            1,
            2,
        ]);

        await dataSource.destroy();
    });

    test('skips selected entities', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                user: [
                    { id: 1, name: 'Basuni' },
                    { id: 2, name: 'Budi' },
                    { id: 3, name: 'Andi' },
                ],
            }),
            entities: [User],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const users = await repository
            .createQueryBuilder('user')
            .skip(1)
            .getMany();

        expect(users.map((user) => user.id)).toEqual([
            2,
            3,
        ]);

        await dataSource.destroy();
    });

    test('orders and paginates entities', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                user: [
                    { id: 5, name: 'Eka' },
                    { id: 2, name: 'Budi' },
                    { id: 4, name: 'Deni' },
                    { id: 1, name: 'Andi' },
                    { id: 3, name: 'Caca' },
                ],
            }),
            entities: [User],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const users = await repository
            .createQueryBuilder('user')
            .orderBy('user.id', 'ASC')
            .skip(1)
            .take(2)
            .getMany();

        expect(users.map((user) => user.id)).toEqual([
            2,
            3,
        ]);

        await dataSource.destroy();
    });

    test('counts entities', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                user: [
                    { id: 1, name: 'Basuni' },
                    { id: 2, name: 'Budi' },
                    { id: 3, name: 'Andi' },
                ],
            }),
            entities: [User],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const count = await repository.count();

        expect(count).toBe(3);

        await dataSource.destroy();
    });
});
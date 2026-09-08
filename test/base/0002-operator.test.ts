import { describe, expect, test } from 'bun:test';
import
{
    Column,
    Entity,
    In,
    IsNull,
    LessThan,
    LessThanOrEqual,
    MoreThan,
    MoreThanOrEqual,
    Not,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Memory } from '../../src/core/memory';
import { createGoogleSheetsDataSource } from '../../src/core/data-source';

describe('GoogleSheetsDataSource - Operators', () =>
{
    @Entity()
    class User
    {
        @PrimaryGeneratedColumn()
        id!: number;

        @Column({ nullable: true })
        name!: string | null;
    }

    test('finds entities with equal condition', async () =>
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

        const users = await repository.find({
            where: {
                name: 'Basuni',
            },
        });

        expect(users).toHaveLength(1);
        expect(users[0]).toMatchObject({
            id: 1,
            name: 'Basuni',
        });

        await dataSource.destroy();
    });

    test('finds entities with Not equal condition', async () =>
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

        const users = await repository.find({
            where: {
                name: Not('Basuni'),
            },
        });

        expect(users.map((user) => user.id)).toEqual([2, 3]);

        await dataSource.destroy();
    });

    test('finds entities with Not equal operator <>', async () =>
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
            .where('"user"."name" <> :name', {
                name: 'Basuni',
            })
            .getMany();

        expect(users.map((user) => user.id)).toEqual([2, 3]);

        await dataSource.destroy();
    });

    test('finds entities with MoreThan condition', async () =>
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

        const users = await repository.find({
            where: {
                id: MoreThan(1),
            },
        });

        expect(users.map((user) => user.id)).toEqual([2, 3]);

        await dataSource.destroy();
    });

    test('finds entities with MoreThanOrEqual condition', async () =>
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

        const users = await repository.find({
            where: {
                id: MoreThanOrEqual(2),
            },
        });

        expect(users.map((user) => user.id)).toEqual([2, 3]);

        await dataSource.destroy();
    });

    test('finds entities with LessThan condition', async () =>
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

        const users = await repository.find({
            where: {
                id: LessThan(3),
            },
        });

        expect(users.map((user) => user.id)).toEqual([1, 2]);

        await dataSource.destroy();
    });

    test('finds entities with LessThanOrEqual condition', async () =>
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

        const users = await repository.find({
            where: {
                id: LessThanOrEqual(2),
            },
        });

        expect(users.map((user) => user.id)).toEqual([1, 2]);

        await dataSource.destroy();
    });

    test('finds entities with IsNull condition', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                user: [
                    { id: 1, name: 'Basuni' },
                    { id: 2, name: null },
                    { id: 3, name: 'Budi' },
                ],
            }),
            entities: [User],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const users = await repository.find({
            where: {
                name: IsNull(),
            },
        });

        expect(users).toHaveLength(1);
        expect(users[0]).toMatchObject({
            id: 2,
            name: null,
        });

        await dataSource.destroy();
    });

    test('finds entities with IsNotNull condition', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                user: [
                    { id: 1, name: 'Basuni' },
                    { id: 2, name: null },
                    { id: 3, name: 'Budi' },
                ],
            }),
            entities: [User],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const users = await repository.find({
            where: {
                name: Not(IsNull()),
            },
        });

        expect(users.map((user) => user.id)).toEqual([1, 3]);

        await dataSource.destroy();
    });

    test('finds entities with In condition', async () =>
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

        const users = await repository.find({
            where: {
                id: In([1, 3]),
            },
        });

        expect(users.map((user) => user.id)).toEqual([1, 3]);

        await dataSource.destroy();
    });

    test('finds entities with Not In condition', async () =>
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

        const users = await repository.find({
            where: {
                id: Not(In([1, 3])),
            },
        });

        expect(users.map((user) => user.id)).toEqual([2]);

        await dataSource.destroy();
    });

    test('finds entities with LIKE condition', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                user: [
                    { id: 1, name: 'Basuni' },
                    { id: 2, name: 'Budi' },
                    { id: 3, name: 'Andi' },
                    { id: 4, name: 'Basuki' },
                ],
            }),
            entities: [User],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const users = await repository
            .createQueryBuilder('user')
            .where('"user"."name" LIKE :name', {
                name: 'Basu%',
            })
            .getMany();

        expect(users.map((user) => user.id)).toEqual([1, 4]);

        await dataSource.destroy();
    });

    test('finds entities with NOT LIKE condition', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                user: [
                    { id: 1, name: 'Basuni' },
                    { id: 2, name: 'Budi' },
                    { id: 3, name: 'Andi' },
                    { id: 4, name: 'Basuki' },
                ],
            }),
            entities: [User],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const users = await repository
            .createQueryBuilder('user')
            .where('"user"."name" NOT LIKE :name', {
                name: 'Basu%',
            })
            .getMany();

        expect(users.map((user) => user.id)).toEqual([2, 3]);

        await dataSource.destroy();
    });

    test('finds entities with ILIKE condition', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                user: [
                    { id: 1, name: 'Basuni' },
                    { id: 2, name: 'Budi' },
                    { id: 3, name: 'ANDI' },
                    { id: 4, name: 'Basuki' },
                ],
            }),
            entities: [User],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const users = await repository
            .createQueryBuilder('user')
            .where('"user"."name" ILIKE :name', {
                name: 'andi',
            })
            .getMany();

        expect(users.map((user) => user.id)).toEqual([3]);

        await dataSource.destroy();
    });

    test('finds entities with NOT ILIKE condition', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                user: [
                    { id: 1, name: 'Basuni' },
                    { id: 2, name: 'Budi' },
                    { id: 3, name: 'ANDI' },
                    { id: 4, name: 'Basuki' },
                ],
            }),
            entities: [User],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const users = await repository
            .createQueryBuilder('user')
            .where('"user"."name" NOT ILIKE :name', {
                name: 'andi',
            })
            .getMany();

        expect(users.map((user) => user.id)).toEqual([1, 2, 4]);

        await dataSource.destroy();
    });

    test('finds entities with BETWEEN condition', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                user: [
                    { id: 1, name: 'Basuni' },
                    { id: 2, name: 'Budi' },
                    { id: 3, name: 'Andi' },
                    { id: 4, name: 'Caca' },
                    { id: 5, name: 'Deni' },
                ],
            }),
            entities: [User],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const users = await repository
            .createQueryBuilder('user')
            .where(
                '"user"."id" BETWEEN :min AND :max',
                {
                    min: 2,
                    max: 4,
                },
            )
            .getMany();

        expect(users.map((user) => user.id)).toEqual([2, 3, 4]);

        await dataSource.destroy();
    });

    test('finds entities with AND condition', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                user: [
                    { id: 1, name: 'Basuni' },
                    { id: 2, name: 'Budi' },
                    { id: 3, name: 'Andi' },
                    { id: 4, name: 'Caca' },
                ],
            }),
            entities: [User],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const users = await repository.find({
            where: {
                id: MoreThan(1),
                name: 'Andi',
            },
        });

        expect(users.map((user) => user.id)).toEqual([3]);

        await dataSource.destroy();
    });

    test('finds entities with OR condition', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                user: [
                    { id: 1, name: 'Basuni' },
                    { id: 2, name: 'Budi' },
                    { id: 3, name: 'Andi' },
                    { id: 4, name: 'Caca' },
                ],
            }),
            entities: [User],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const users = await repository.find({
            where: [
                { id: 1 },
                { id: 4 },
            ],
        });

        expect(users.map((user) => user.id)).toEqual([1, 4]);

        await dataSource.destroy();
    });

    test('finds entities with combined AND and OR conditions', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                user: [
                    { id: 1, name: 'Basuni' },
                    { id: 2, name: 'Budi' },
                    { id: 3, name: 'Andi' },
                    { id: 4, name: 'Andi' },
                    { id: 5, name: 'Caca' },
                ],
            }),
            entities: [User],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        const users = await repository
            .createQueryBuilder('user')
            .where(
                '(("user"."id" > :min AND "user"."name" = :name) OR "user"."id" = :id)',
                {
                    min: 2,
                    name: 'Andi',
                    id: 1,
                },
            )
            .getMany();

        expect(users.map((user) => user.id)).toEqual([1, 3, 4]);

        await dataSource.destroy();
    });
});
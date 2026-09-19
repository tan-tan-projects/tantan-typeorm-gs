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
    MoreThan,
    MoreThanOrEqual,
    Not,
    PrimaryGeneratedColumn,
    Raw,
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

    test('finds entities with equal Date condition', async () =>
    {
        @Entity()
        class Event
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            name!: string;

            @Column()
            createdAt!: Date;
        }

        const date = new Date('2026-01-15T10:00:00.000Z');

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                event: [
                    {
                        id: 1,
                        name: 'Event A',
                        createdAt: date,
                    },
                    {
                        id: 2,
                        name: 'Event B',
                        createdAt: new Date('2026-02-15T10:00:00.000Z'),
                    },
                    {
                        id: 3,
                        name: 'Event C',
                        createdAt: new Date('2026-03-15T10:00:00.000Z'),
                    },
                ],
            }),
            entities: [Event],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(Event);

        const events = await repository.find({
            where: {
                createdAt: date,
            },
        });

        expect(events.map((event) => event.id)).toEqual([1]);

        await dataSource.destroy();
    });


    test('finds entities with MoreThan Date condition', async () =>
    {
        @Entity()
        class Event
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            name!: string;

            @Column()
            createdAt!: Date;
        }

        const date = new Date('2026-02-01T00:00:00.000Z');

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                event: [
                    {
                        id: 1,
                        name: 'Event A',
                        createdAt: new Date('2026-01-15T10:00:00.000Z'),
                    },
                    {
                        id: 2,
                        name: 'Event B',
                        createdAt: new Date('2026-02-15T10:00:00.000Z'),
                    },
                    {
                        id: 3,
                        name: 'Event C',
                        createdAt: new Date('2026-03-15T10:00:00.000Z'),
                    },
                ],
            }),
            entities: [Event],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(Event);

        const events = await repository.find({
            where: {
                createdAt: MoreThan(date),
            },
        });

        expect(events.map((event) => event.id)).toEqual([2, 3]);

        await dataSource.destroy();
    });


    test('finds entities with MoreThanOrEqual Date condition', async () =>
    {
        @Entity()
        class Event
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            name!: string;

            @Column()
            createdAt!: Date;
        }

        const date = new Date('2026-02-15T10:00:00.000Z');

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                event: [
                    {
                        id: 1,
                        name: 'Event A',
                        createdAt: new Date('2026-01-15T10:00:00.000Z'),
                    },
                    {
                        id: 2,
                        name: 'Event B',
                        createdAt: new Date('2026-02-15T10:00:00.000Z'),
                    },
                    {
                        id: 3,
                        name: 'Event C',
                        createdAt: new Date('2026-03-15T10:00:00.000Z'),
                    },
                ],
            }),
            entities: [Event],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(Event);

        const events = await repository.find({
            where: {
                createdAt: MoreThanOrEqual(date),
            },
        });

        expect(events.map((event) => event.id)).toEqual([2, 3]);

        await dataSource.destroy();
    });


    test('finds entities with LessThan Date condition', async () =>
    {
        @Entity()
        class Event
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            name!: string;

            @Column()
            createdAt!: Date;
        }

        const date = new Date('2026-03-01T00:00:00.000Z');

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                event: [
                    {
                        id: 1,
                        name: 'Event A',
                        createdAt: new Date('2026-01-15T10:00:00.000Z'),
                    },
                    {
                        id: 2,
                        name: 'Event B',
                        createdAt: new Date('2026-02-15T10:00:00.000Z'),
                    },
                    {
                        id: 3,
                        name: 'Event C',
                        createdAt: new Date('2026-03-15T10:00:00.000Z'),
                    },
                ],
            }),
            entities: [Event],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(Event);

        const events = await repository.find({
            where: {
                createdAt: LessThan(date),
            },
        });

        expect(events.map((event) => event.id)).toEqual([1, 2]);

        await dataSource.destroy();
    });


    test('finds entities with LessThanOrEqual Date condition', async () =>
    {
        @Entity()
        class Event
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            name!: string;

            @Column()
            createdAt!: Date;
        }

        const date = new Date('2026-02-15T10:00:00.000Z');

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                event: [
                    {
                        id: 1,
                        name: 'Event A',
                        createdAt: new Date('2026-01-15T10:00:00.000Z'),
                    },
                    {
                        id: 2,
                        name: 'Event B',
                        createdAt: new Date('2026-02-15T10:00:00.000Z'),
                    },
                    {
                        id: 3,
                        name: 'Event C',
                        createdAt: new Date('2026-03-15T10:00:00.000Z'),
                    },
                ],
            }),
            entities: [Event],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(Event);

        const events = await repository.find({
            where: {
                createdAt: LessThanOrEqual(date),
            },
        });

        expect(events.map((event) => event.id)).toEqual([1, 2]);

        await dataSource.destroy();
    });


    test('finds entities with Between Date condition', async () =>
    {
        @Entity()
        class Event
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            name!: string;

            @Column()
            createdAt!: Date;
        }

        const minDate = new Date('2026-02-01T00:00:00.000Z');
        const maxDate = new Date('2026-03-01T00:00:00.000Z');

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                event: [
                    {
                        id: 1,
                        name: 'Event A',
                        createdAt: new Date('2026-01-15T10:00:00.000Z'),
                    },
                    {
                        id: 2,
                        name: 'Event B',
                        createdAt: new Date('2026-02-15T10:00:00.000Z'),
                    },
                    {
                        id: 3,
                        name: 'Event C',
                        createdAt: new Date('2026-02-28T10:00:00.000Z'),
                    },
                    {
                        id: 4,
                        name: 'Event D',
                        createdAt: new Date('2026-03-15T10:00:00.000Z'),
                    },
                ],
            }),
            entities: [Event],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(Event);

        const events = await repository.find({
            where: {
                createdAt: Between(minDate, maxDate),
            },
        });

        expect(events.map((event) => event.id)).toEqual([2, 3]);

        await dataSource.destroy();
    });


    test('finds entities with Not Date condition', async () =>
    {
        @Entity()
        class Event
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            name!: string;

            @Column()
            createdAt!: Date;
        }

        const date = new Date('2026-02-15T10:00:00.000Z');

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                event: [
                    {
                        id: 1,
                        name: 'Event A',
                        createdAt: new Date('2026-01-15T10:00:00.000Z'),
                    },
                    {
                        id: 2,
                        name: 'Event B',
                        createdAt: date,
                    },
                    {
                        id: 3,
                        name: 'Event C',
                        createdAt: new Date('2026-03-15T10:00:00.000Z'),
                    },
                ],
            }),
            entities: [Event],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(Event);

        const events = await repository.find({
            where: {
                createdAt: Not(date),
            },
        });

        expect(events.map((event) => event.id)).toEqual([1, 3]);

        await dataSource.destroy();
    });


    test('finds entities with IsNull Date condition', async () =>
    {
        @Entity()
        class Event
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column({ nullable: true })
            createdAt!: Date | null;
        }

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                event: [
                    {
                        id: 1,
                        createdAt: new Date('2026-01-15T10:00:00.000Z'),
                    },
                    {
                        id: 2,
                        createdAt: null,
                    },
                    {
                        id: 3,
                        createdAt: new Date('2026-03-15T10:00:00.000Z'),
                    },
                ],
            }),
            entities: [Event],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(Event);

        const events = await repository.find({
            where: {
                createdAt: IsNull(),
            },
        });

        expect(events.map((event) => event.id)).toEqual([2]);

        await dataSource.destroy();
    });


    test('finds entities with Not IsNull Date condition', async () =>
    {
        @Entity()
        class Event
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column({ nullable: true })
            createdAt!: Date | null;
        }

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                event: [
                    {
                        id: 1,
                        createdAt: new Date('2026-01-15T10:00:00.000Z'),
                    },
                    {
                        id: 2,
                        createdAt: null,
                    },
                    {
                        id: 3,
                        createdAt: new Date('2026-03-15T10:00:00.000Z'),
                    },
                ],
            }),
            entities: [Event],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(Event);

        const events = await repository.find({
            where: {
                createdAt: Not(IsNull()),
            },
        });

        expect(events.map((event) => event.id)).toEqual([1, 3]);

        await dataSource.destroy();
    });

    test('finds entities with equal Date query condition', async () =>
    {
        @Entity()
        class Event
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            name!: string;

            @Column()
            createdAt!: Date;
        }

        const date = new Date('2026-02-15T10:00:00.000Z');

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                event: [
                    {
                        id: 1,
                        name: 'Event A',
                        createdAt: new Date('2026-01-15T10:00:00.000Z'),
                    },
                    {
                        id: 2,
                        name: 'Event B',
                        createdAt: date,
                    },
                    {
                        id: 3,
                        name: 'Event C',
                        createdAt: new Date('2026-03-15T10:00:00.000Z'),
                    },
                ],
            }),
            entities: [Event],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(Event);

        const events = await repository
            .createQueryBuilder('event')
            .where('"event"."createdAt" = :createdAt', {
                createdAt: date,
            })
            .getMany();

        expect(events.map((event) => event.id)).toEqual([2]);

        await dataSource.destroy();
    });


    test('finds entities with Not Date query condition', async () =>
    {
        @Entity()
        class Event
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            name!: string;

            @Column()
            createdAt!: Date;
        }

        const date = new Date('2026-02-15T10:00:00.000Z');

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                event: [
                    {
                        id: 1,
                        name: 'Event A',
                        createdAt: new Date('2026-01-15T10:00:00.000Z'),
                    },
                    {
                        id: 2,
                        name: 'Event B',
                        createdAt: date,
                    },
                    {
                        id: 3,
                        name: 'Event C',
                        createdAt: new Date('2026-03-15T10:00:00.000Z'),
                    },
                ],
            }),
            entities: [Event],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(Event);

        const events = await repository
            .createQueryBuilder('event')
            .where('"event"."createdAt" <> :createdAt', {
                createdAt: date,
            })
            .getMany();

        expect(events.map((event) => event.id)).toEqual([1, 3]);

        await dataSource.destroy();
    });


    test('finds entities with MoreThan Date query condition', async () =>
    {
        @Entity()
        class Event
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            name!: string;

            @Column()
            createdAt!: Date;
        }

        const date = new Date('2026-02-01T00:00:00.000Z');

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                event: [
                    {
                        id: 1,
                        name: 'Event A',
                        createdAt: new Date('2026-01-15T10:00:00.000Z'),
                    },
                    {
                        id: 2,
                        name: 'Event B',
                        createdAt: new Date('2026-02-15T10:00:00.000Z'),
                    },
                    {
                        id: 3,
                        name: 'Event C',
                        createdAt: new Date('2026-03-15T10:00:00.000Z'),
                    },
                ],
            }),
            entities: [Event],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(Event);

        const events = await repository
            .createQueryBuilder('event')
            .where('"event"."createdAt" > :createdAt', {
                createdAt: date,
            })
            .getMany();

        expect(events.map((event) => event.id)).toEqual([2, 3]);

        await dataSource.destroy();
    });


    test('finds entities with MoreThanOrEqual Date query condition', async () =>
    {
        @Entity()
        class Event
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            name!: string;

            @Column()
            createdAt!: Date;
        }

        const date = new Date('2026-02-15T10:00:00.000Z');

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                event: [
                    {
                        id: 1,
                        name: 'Event A',
                        createdAt: new Date('2026-01-15T10:00:00.000Z'),
                    },
                    {
                        id: 2,
                        name: 'Event B',
                        createdAt: date,
                    },
                    {
                        id: 3,
                        name: 'Event C',
                        createdAt: new Date('2026-03-15T10:00:00.000Z'),
                    },
                ],
            }),
            entities: [Event],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(Event);

        const events = await repository
            .createQueryBuilder('event')
            .where('"event"."createdAt" >= :createdAt', {
                createdAt: date,
            })
            .getMany();

        expect(events.map((event) => event.id)).toEqual([2, 3]);

        await dataSource.destroy();
    });


    test('finds entities with LessThan Date query condition', async () =>
    {
        @Entity()
        class Event
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            name!: string;

            @Column()
            createdAt!: Date;
        }

        const date = new Date('2026-03-01T00:00:00.000Z');

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                event: [
                    {
                        id: 1,
                        name: 'Event A',
                        createdAt: new Date('2026-01-15T10:00:00.000Z'),
                    },
                    {
                        id: 2,
                        name: 'Event B',
                        createdAt: new Date('2026-02-15T10:00:00.000Z'),
                    },
                    {
                        id: 3,
                        name: 'Event C',
                        createdAt: new Date('2026-03-15T10:00:00.000Z'),
                    },
                ],
            }),
            entities: [Event],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(Event);

        const events = await repository
            .createQueryBuilder('event')
            .where('"event"."createdAt" < :createdAt', {
                createdAt: date,
            })
            .getMany();

        expect(events.map((event) => event.id)).toEqual([1, 2]);

        await dataSource.destroy();
    });


    test('finds entities with LessThanOrEqual Date query condition', async () =>
    {
        @Entity()
        class Event
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            name!: string;

            @Column()
            createdAt!: Date;
        }

        const date = new Date('2026-02-15T10:00:00.000Z');

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                event: [
                    {
                        id: 1,
                        name: 'Event A',
                        createdAt: new Date('2026-01-15T10:00:00.000Z'),
                    },
                    {
                        id: 2,
                        name: 'Event B',
                        createdAt: date,
                    },
                    {
                        id: 3,
                        name: 'Event C',
                        createdAt: new Date('2026-03-15T10:00:00.000Z'),
                    },
                ],
            }),
            entities: [Event],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(Event);

        const events = await repository
            .createQueryBuilder('event')
            .where('"event"."createdAt" <= :createdAt', {
                createdAt: date,
            })
            .getMany();

        expect(events.map((event) => event.id)).toEqual([1, 2]);

        await dataSource.destroy();
    });


    test('finds entities with BETWEEN Date query condition', async () =>
    {
        @Entity()
        class Event
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            name!: string;

            @Column()
            createdAt!: Date;
        }

        const minDate = new Date('2026-02-01T00:00:00.000Z');
        const maxDate = new Date('2026-03-01T00:00:00.000Z');

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                event: [
                    {
                        id: 1,
                        name: 'Event A',
                        createdAt: new Date('2026-01-15T10:00:00.000Z'),
                    },
                    {
                        id: 2,
                        name: 'Event B',
                        createdAt: new Date('2026-02-15T10:00:00.000Z'),
                    },
                    {
                        id: 3,
                        name: 'Event C',
                        createdAt: new Date('2026-02-28T10:00:00.000Z'),
                    },
                    {
                        id: 4,
                        name: 'Event D',
                        createdAt: new Date('2026-03-15T10:00:00.000Z'),
                    },
                ],
            }),
            entities: [Event],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(Event);

        const events = await repository
            .createQueryBuilder('event')
            .where(
                '"event"."createdAt" BETWEEN :min AND :max',
                {
                    min: minDate,
                    max: maxDate,
                },
            )
            .getMany();

        expect(events.map((event) => event.id)).toEqual([2, 3]);

        await dataSource.destroy();
    });


    test('finds entities with IS NULL Date query condition', async () =>
    {
        @Entity()
        class Event
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            name!: string;

            @Column({ nullable: true })
            createdAt!: Date | null;
        }

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                event: [
                    {
                        id: 1,
                        name: 'Event A',
                        createdAt: new Date('2026-01-15T10:00:00.000Z'),
                    },
                    {
                        id: 2,
                        name: 'Event B',
                        createdAt: null,
                    },
                    {
                        id: 3,
                        name: 'Event C',
                        createdAt: new Date('2026-03-15T10:00:00.000Z'),
                    },
                ],
            }),
            entities: [Event],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(Event);

        const events = await repository
            .createQueryBuilder('event')
            .where('"event"."createdAt" IS NULL')
            .getMany();

        expect(events.map((event) => event.id)).toEqual([2]);

        await dataSource.destroy();
    });


    test('finds entities with IS NOT NULL Date query condition', async () =>
    {
        @Entity()
        class Event
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            name!: string;

            @Column({ nullable: true })
            createdAt!: Date | null;
        }

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                event: [
                    {
                        id: 1,
                        name: 'Event A',
                        createdAt: new Date('2026-01-15T10:00:00.000Z'),
                    },
                    {
                        id: 2,
                        name: 'Event B',
                        createdAt: null,
                    },
                    {
                        id: 3,
                        name: 'Event C',
                        createdAt: new Date('2026-03-15T10:00:00.000Z'),
                    },
                ],
            }),
            entities: [Event],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(Event);

        const events = await repository
            .createQueryBuilder('event')
            .where('"event"."createdAt" IS NOT NULL')
            .getMany();

        expect(events.map((event) => event.id)).toEqual([1, 3]);

        await dataSource.destroy();
    });

    test('finds entities with Raw greater than condition', async () =>
    {
        @Entity()
        class SecurityRule
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column({ nullable: true })
            expires_at!: Date | null;
        }

        const now = new Date('2026-09-19T10:00:00.000Z');

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                security_rule: [
                    {
                        id: 1,
                        expires_at: new Date('2026-09-19T09:00:00.000Z'),
                    },
                    {
                        id: 2,
                        expires_at: new Date('2026-09-19T11:00:00.000Z'),
                    },
                    {
                        id: 3,
                        expires_at: null,
                    },
                ],
            }),
            entities: [SecurityRule],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(SecurityRule);

        const rules = await repository.find({
            where: {
                expires_at: Raw(
                    (alias) => `${alias} > :now`,
                    { now },
                ),
            },
        });

        expect(rules.map((rule) => rule.id)).toEqual([2]);

        await dataSource.destroy();
    });

    test('finds active entities with Raw nullable date condition', async () =>
    {
        @Entity()
        class SecurityRule
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            type!: string;

            @Column()
            value!: string;

            @Column()
            is_active!: boolean;

            @Column({ nullable: true })
            expires_at!: Date | null;

            @Column()
            created_at!: Date;
        }

        const now = new Date('2026-09-19T10:00:00.000Z');

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                security_rule: [
                    {
                        id: 1,
                        type: 'IP',
                        value: '127.0.0.1',
                        is_active: true,
                        expires_at: null,
                        created_at: new Date('2026-09-19T07:00:00.000Z'),
                    },
                    {
                        id: 2,
                        type: 'IP',
                        value: '127.0.0.1',
                        is_active: true,
                        expires_at: new Date('2026-09-19T11:00:00.000Z'),
                        created_at: new Date('2026-09-19T08:00:00.000Z'),
                    },
                    {
                        id: 3,
                        type: 'IP',
                        value: '127.0.0.1',
                        is_active: true,
                        expires_at: new Date('2026-09-19T09:00:00.000Z'),
                        created_at: new Date('2026-09-19T09:00:00.000Z'),
                    },
                    {
                        id: 4,
                        type: 'IP',
                        value: '127.0.0.1',
                        is_active: false,
                        expires_at: new Date('2026-09-19T11:00:00.000Z'),
                        created_at: new Date('2026-09-19T09:30:00.000Z'),
                    },
                    {
                        id: 5,
                        type: 'TOKEN',
                        value: '127.0.0.1',
                        is_active: true,
                        expires_at: new Date('2026-09-19T11:00:00.000Z'),
                        created_at: new Date('2026-09-19T09:30:00.000Z'),
                    },
                ],
            }),
            entities: [SecurityRule],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(SecurityRule);

        const rules = await repository.find({
            where: {
                type: 'IP',
                value: '127.0.0.1',
                is_active: true,
                expires_at: Raw(
                    (alias) => `(${alias} IS NULL OR ${alias} > :now)`,
                    { now },
                ),
            },
            order: {
                created_at: 'DESC',
            },
        });

        expect(rules.map((rule) => rule.id)).toEqual([2, 1]);

        await dataSource.destroy();
    });

    test('finds entities with Raw greater than or equal Date condition', async () =>
    {
        @Entity()
        class Event
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            created_at!: Date;
        }

        const now = new Date('2026-09-19T10:00:00.000Z');

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                event: [
                    {
                        id: 1,
                        created_at: new Date('2026-09-19T09:59:59.999Z'),
                    },
                    {
                        id: 2,
                        created_at: now,
                    },
                    {
                        id: 3,
                        created_at: new Date('2026-09-19T10:00:00.001Z'),
                    },
                ],
            }),
            entities: [Event],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(Event);

        const events = await repository.find({
            where: {
                created_at: Raw(
                    (alias) => `${alias} >= :now`,
                    { now },
                ),
            },
        });

        expect(events.map((event) => event.id)).toEqual([2, 3]);

        await dataSource.destroy();
    });

    test('finds entities with Raw BETWEEN Date condition', async () =>
    {
        @Entity()
        class Event
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            created_at!: Date;
        }

        const minDate = new Date('2026-09-19T10:00:00.000Z');
        const maxDate = new Date('2026-09-19T12:00:00.000Z');

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                event: [
                    {
                        id: 1,
                        created_at: new Date('2026-09-19T09:59:59.999Z'),
                    },
                    {
                        id: 2,
                        created_at: new Date('2026-09-19T10:30:00.000Z'),
                    },
                    {
                        id: 3,
                        created_at: new Date('2026-09-19T12:00:00.000Z'),
                    },
                    {
                        id: 4,
                        created_at: new Date('2026-09-19T12:00:00.001Z'),
                    },
                ],
            }),
            entities: [Event],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(Event);

        const events = await repository.find({
            where: {
                created_at: Raw(
                    (alias) => `${alias} BETWEEN :min AND :max`,
                    {
                        min: minDate,
                        max: maxDate,
                    },
                ),
            },
        });

        expect(events.map((event) => event.id)).toEqual([2, 3]);

        await dataSource.destroy();
    });

    test('finds entities with Raw NOT expired condition', async () =>
    {
        @Entity()
        class SecurityRule
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column({ nullable: true })
            expires_at!: Date | null;
        }

        const now = new Date('2026-09-19T10:00:00.000Z');

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                security_rule: [
                    {
                        id: 1,
                        expires_at: new Date('2026-09-19T09:00:00.000Z'),
                    },
                    {
                        id: 2,
                        expires_at: new Date('2026-09-19T11:00:00.000Z'),
                    },
                    {
                        id: 3,
                        expires_at: null,
                    },
                ],
            }),
            entities: [SecurityRule],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(SecurityRule);

        const rules = await repository.find({
            where: {
                expires_at: Raw(
                    (alias) => `NOT (${alias} < :now)`,
                    { now },
                ),
            },
        });

        expect(rules.map((rule) => rule.id)).toEqual([2, 3]);

        await dataSource.destroy();
    });

    test('finds entities with complex Raw condition and parameters', async () =>
    {
        @Entity()
        class SecurityRule
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            type!: string;

            @Column()
            is_active!: boolean;

            @Column({ nullable: true })
            expires_at!: Date | null;

            @Column()
            created_at!: Date;
        }

        const start = new Date('2026-09-19T08:00:00.000Z');
        const end = new Date('2026-09-19T12:00:00.000Z');

        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                security_rule: [
                    {
                        id: 1,
                        type: 'IP',
                        is_active: true,
                        expires_at: new Date('2026-09-19T09:00:00.000Z'),
                        created_at: new Date('2026-09-19T08:30:00.000Z'),
                    },
                    {
                        id: 2,
                        type: 'IP',
                        is_active: true,
                        expires_at: new Date('2026-09-19T11:00:00.000Z'),
                        created_at: new Date('2026-09-19T09:00:00.000Z'),
                    },
                    {
                        id: 3,
                        type: 'IP',
                        is_active: false,
                        expires_at: new Date('2026-09-19T11:00:00.000Z'),
                        created_at: new Date('2026-09-19T09:30:00.000Z'),
                    },
                    {
                        id: 4,
                        type: 'TOKEN',
                        is_active: true,
                        expires_at: new Date('2026-09-19T11:00:00.000Z'),
                        created_at: new Date('2026-09-19T10:00:00.000Z'),
                    },
                    {
                        id: 5,
                        type: 'IP',
                        is_active: true,
                        expires_at: null,
                        created_at: new Date('2026-09-19T13:00:00.000Z'),
                    },
                ],
            }),
            entities: [SecurityRule],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(SecurityRule);

        const rules = await repository.find({
            where: {
                type: 'IP',
                is_active: true,
                expires_at: Raw(
                    (alias) =>
                        `(${alias} IS NULL OR ${alias} BETWEEN :start AND :end)`,
                    {
                        start,
                        end,
                    },
                ),
            },
            order: {
                created_at: 'ASC',
            },
        });

        expect(rules.map((rule) => rule.id)).toEqual([1, 2, 5]);

        await dataSource.destroy();
    });
});
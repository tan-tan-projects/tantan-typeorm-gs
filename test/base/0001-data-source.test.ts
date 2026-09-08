import { describe, expect, test } from 'bun:test';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Memory } from '../../src/core/memory';
import { createGoogleSheetsDataSource } from '../../src/core/data-source';

describe('GoogleSheetsDataSource', () =>
{
    @Entity()
    class User
    {
        @PrimaryGeneratedColumn()
        id!: number;

        @Column()
        name!: string;
    }

    @Entity()
    class DataTypeUser
    {
        @PrimaryGeneratedColumn()
        id!: number;

        @Column()
        name!: string;

        @Column()
        age!: number;

        @Column()
        active!: boolean;

        @Column()
        createdAt!: Date;
    }

    @Entity()
    class TimestampUser
    {
        @PrimaryGeneratedColumn()
        id!: number;

        @Column()
        name!: string;

        @CreateDateColumn()
        createdAt!: Date;

        @UpdateDateColumn()
        updatedAt!: Date;
    }

    test('creates DataSource with GoogleSheetsDriver', () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory(),
        });

        expect(dataSource.driver.constructor.name)
            .toBe('GoogleSheetsDriver');

        expect(dataSource.manager.constructor.name)
            .toBe('EntityManager');
    });

    test('initializes and builds entity metadata', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory(),
            entities: [User],
        });

        await dataSource.initialize();

        expect(dataSource.isInitialized).toBe(true);
        expect(dataSource.entityMetadatas).toHaveLength(1);

        const metadata = dataSource.getMetadata(User);

        expect(metadata.tableName).toBe('user');
        expect(metadata.columns).toHaveLength(2);

        await dataSource.destroy();
    });

    test('creates repository', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory(),
            entities: [User],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(User);

        expect(repository.metadata).toBe(dataSource.getMetadata(User));
        expect(repository.target).toBe(User);

        await dataSource.destroy();
    });

    test('saves supported column data types', async () =>
    {
        const client =
            new Memory();

        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',
                client,
                entities: [
                    DataTypeUser,
                ]
            });

        await dataSource.initialize();

        const user =
            dataSource
                .getRepository(DataTypeUser)
                .create({
                    name: 'John',
                    age: 30,
                    active: true,
                    createdAt: new Date(),
                });

        await dataSource
            .getRepository(DataTypeUser)
            .save(user);

        const result =
            await dataSource
                .getRepository(DataTypeUser)
                .findOneBy({
                    id: user.id,
                });

        expect(result)
            .toBeDefined();

        expect(result?.name)
            .toBe('John');

        expect(result?.age)
            .toBe(30);

        expect(result?.active)
            .toBe(true);

        expect(result?.createdAt)
            .toEqual(user.createdAt);
    });

    test('assigns create and update dates when saving a new entity', async () =>
    {
        const client =
            new Memory();

        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',
                client,
                entities: [
                    TimestampUser,
                ]
            });

        await dataSource.initialize();

        const user =
            dataSource
                .getRepository(TimestampUser)
                .create({
                    name: 'John',
                });

        await dataSource
            .getRepository(TimestampUser)
            .save(user);

        expect(user.createdAt)
            .toBeInstanceOf(Date);

        expect(user.updatedAt)
            .toBeInstanceOf(Date);

        expect(user.createdAt.getTime())
            .toBeLessThanOrEqual(
                user.updatedAt.getTime(),
            );
    });

    test('updates update date when updating an existing entity', async () =>
    {
        const client =
            new Memory();

        const dataSource =
            createGoogleSheetsDataSource({
                type: 'google-sheets',
                client,
                entities: [
                    TimestampUser,
                ]
            });

        await dataSource.initialize();

        const repository =
            dataSource.getRepository(TimestampUser);

        const user =
            repository.create({
                name: 'John',
            });

        await repository.save(user);

        const createdAt =
            user.createdAt.getTime();

        const updatedAt =
            user.updatedAt.getTime();

        await new Promise(
            (resolve) =>
                setTimeout(resolve, 5),
        );

        user.name = 'Jane';

        await repository.save(user);

        expect(user.createdAt)
            .toBeInstanceOf(Date);

        expect(user.updatedAt)
            .toBeInstanceOf(Date);

        expect(user.createdAt.getTime())
            .toBe(createdAt);

        expect(user.updatedAt.getTime())
            .toBeGreaterThan(updatedAt);
    });

})
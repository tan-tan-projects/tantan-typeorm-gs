import { describe, expect, test } from 'bun:test';
import
{
    Column,
    Entity,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Memory } from '../../src/core/memory';
import { createGoogleSheetsDataSource } from '../../src/core/data-source';

describe('GoogleSheetsDataSource - Aggregate', () =>
{
    @Entity()
    class Product
    {
        @PrimaryGeneratedColumn()
        id!: number;

        @Column()
        name!: string;

        @Column()
        price!: number;

        @Column({ nullable: true })
        category!: string | null;
    }

    test('counts all rows with COUNT(*)', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                product: [
                    { id: 1, name: 'A', price: 10000, category: 'Protein' },
                    { id: 2, name: 'B', price: 20000, category: 'Protein' },
                    { id: 3, name: 'C', price: 30000, category: 'Drink' },
                ],
            }),
            entities: [Product],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(Product);

        const result = await repository
            .createQueryBuilder('product')
            .select('COUNT(*)', 'count')
            .getRawOne();

        expect(result).toMatchObject({
            count: 3,
        });

        await dataSource.destroy();
    });

    test('counts non-null values with COUNT(column)', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                product: [
                    { id: 1, name: 'A', price: 10000, category: 'Protein' },
                    { id: 2, name: 'B', price: 20000, category: null },
                    { id: 3, name: 'C', price: 30000, category: 'Drink' },
                ],
            }),
            entities: [Product],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(Product);

        const result = await repository
            .createQueryBuilder('product')
            .select('COUNT(product.category)', 'count')
            .getRawOne();

        expect(result).toMatchObject({
            count: 2,
        });

        await dataSource.destroy();
    });

    test('calculates SUM', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                product: [
                    { id: 1, name: 'A', price: 10000, category: 'Protein' },
                    { id: 2, name: 'B', price: 20000, category: 'Protein' },
                    { id: 3, name: 'C', price: 30000, category: 'Drink' },
                ],
            }),
            entities: [Product],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(Product);

        const result = await repository
            .createQueryBuilder('product')
            .select('SUM(product.price)', 'total')
            .getRawOne();

        expect(result).toMatchObject({
            total: 60000,
        });

        await dataSource.destroy();
    });

    test('calculates AVG', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                product: [
                    { id: 1, name: 'A', price: 10000, category: 'Protein' },
                    { id: 2, name: 'B', price: 20000, category: 'Protein' },
                    { id: 3, name: 'C', price: 30000, category: 'Drink' },
                ],
            }),
            entities: [Product],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(Product);

        const result = await repository
            .createQueryBuilder('product')
            .select('AVG(product.price)', 'average')
            .getRawOne();

        expect(result).toMatchObject({
            average: 20000,
        });

        await dataSource.destroy();
    });

    test('calculates MIN and MAX', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                product: [
                    { id: 1, name: 'A', price: 10000, category: 'Protein' },
                    { id: 2, name: 'B', price: 20000, category: 'Protein' },
                    { id: 3, name: 'C', price: 30000, category: 'Drink' },
                ],
            }),
            entities: [Product],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(Product);

        const result = await repository
            .createQueryBuilder('product')
            .select('MIN(product.price)', 'minimum')
            .addSelect('MAX(product.price)', 'maximum')
            .getRawOne();

        expect(result).toMatchObject({
            minimum: 10000,
            maximum: 30000,
        });

        await dataSource.destroy();
    });

    test('aggregates filtered rows', async () =>
    {
        const dataSource = createGoogleSheetsDataSource({
            type: 'google-sheets',
            client: new Memory({
                product: [
                    { id: 1, name: 'A', price: 10000, category: 'Protein' },
                    { id: 2, name: 'B', price: 20000, category: 'Protein' },
                    { id: 3, name: 'C', price: 30000, category: 'Drink' },
                ],
            }),
            entities: [Product],
        });

        await dataSource.initialize();

        const repository = dataSource.getRepository(Product);

        const result = await repository
            .createQueryBuilder('product')
            .select('SUM(product.price)', 'total')
            .where('product.category = :category', {
                category: 'Protein',
            })
            .getRawOne();

        expect(result).toMatchObject({
            total: 30000,
        });

        await dataSource.destroy();
    });
});
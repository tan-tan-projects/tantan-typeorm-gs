import { describe, expect, test } from 'bun:test';
import
{
    AfterInsert,
    AfterLoad,
    AfterRemove,
    AfterUpdate,
    BeforeInsert,
    BeforeRemove,
    BeforeUpdate,
    Column,
    DefaultNamingStrategy,
    Entity,
    EventSubscriber,
    ManyToOne,
    PrimaryColumn,
    PrimaryGeneratedColumn,
    type EntitySubscriberInterface,
    type InsertEvent,
} from 'typeorm';
import type { GoogleSheetsDriver } from '../../src/core/driver';
import { Memory } from '../../src/core/memory';
import { GoogleSheetsConsume, createGoogleSheetsDataSource, type GoogleSheetsDataSourceOptions } from '../../src';

describe(
    'GoogleSheetsDataSource',
    () =>
    {
        class TestNamingStrategy
            extends DefaultNamingStrategy
        {
            override tableName(
                className: string,
                customName: string | undefined,
            ): string
            {
                return `sheet_${customName ?? className}`.toLowerCase();
            }

            override columnName(
                propertyName: string,
                customName: string | undefined,
                embeddedPrefixes: string[],
            ): string
            {
                return `col_${propertyName}`.toLowerCase();
            }
        }

        @EventSubscriber()
        class LifecycleUserSubscriber
            implements EntitySubscriberInterface<LifecycleUser>
        {
            beforeInsert(event: InsertEvent<LifecycleUser>)
            {
                event.entity.name =
                    `${event.entity.name}-subscriber-before`;
            }

            afterInsert(event: InsertEvent<LifecycleUser>)
            {
                event.entity.name =
                    `${event.entity.name}-subscriber-after`;
            }
        }

        @Entity()
        class NamingStrategyUser
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            displayName!: string;
        }

        @Entity('custom_users')
        class CustomUser
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            name!: string;
        }

        @Entity('mapped_users')
        class MappedUser
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column({
                name: 'user_name',
            })
            name!: string;
        }

        @Entity('typed_users')
        class TypedUser
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column({
                type: 'number',
            })
            age!: number;

            @Column({
                type: 'boolean',
            })
            active!: boolean;
        }

        @Entity('nullable_users')
        class NullableUser
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column({
                nullable: true,
            })
            nickname!: string | null;
        }

        @Entity('generated_users')
        class GeneratedUser
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            name!: string;
        }

        @Entity('default_users')
        class DefaultUser
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column({
                default: 'active',
            })
            status!: string;
        }

        @Entity('uuid_users')
        class UuidUser
        {
            @PrimaryGeneratedColumn('uuid')
            id!: string;

            @Column()
            name!: string;
        }

        @Entity('sync_users')
        class SyncUser
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            name!: string;
        }

        @Entity('sync_missing_headers')
        class SyncMissingHeaderUser
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            name!: string;

            @Column()
            email!: string;
        }

        @Entity('required_users')
        class RequiredUser
        {
            @PrimaryColumn()
            id!: number;

            @Column()
            name!: string;
        }

        @Entity('lifecycle_users')
        class LifecycleUser
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            name!: string;

            @BeforeInsert()
            beforeInsert()
            {
                this.name =
                    this.name.toUpperCase();
            }

            @BeforeUpdate()
            beforeUpdate()
            {
                this.name =
                    this.name.toUpperCase();
            }

            @BeforeRemove()
            beforeRemove()
            {
                this.name =
                    `${this.name}-before`;
            }

            @AfterLoad()
            afterLoad()
            {
                this.name =
                    `${this.name}-loaded`;
            }
        }

        @Entity('lifecycle_users2')
        class LifecycleUser2
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            name!: string;

            @AfterInsert()
            afterInsert()
            {
                this.name =
                    `${this.name}-after`;
            }

            @AfterUpdate()
            afterUpdate()
            {
                this.name =
                    `${this.name}-after`;
            }

            @AfterRemove()
            afterRemove()
            {
                this.name =
                    `${this.name}-after`;
            }
        }

        @Entity('relation_users')
        class RelationUser
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            name!: string;
        }

        @Entity('relation_posts')
        class RelationPost
        {
            @PrimaryGeneratedColumn()
            id!: number;

            @Column()
            title!: string;

            @ManyToOne(
                () => RelationUser,
                {
                    nullable: false,
                },
            )
            author!: RelationUser;
        }

        test(
            'should use default GoogleSheetsConsume when client is not provided',
            () =>
            {
                const dataSource = createGoogleSheetsDataSource({
                    type: 'google-sheets',

                    spreadsheetId:
                        'test-spreadsheet-id',

                    credentials: {
                        clientEmail:
                            'test@example.com',

                        privateKey:
                            'test-private-key',
                    },
                });

                const driver =
                    dataSource.driver as GoogleSheetsDriver;

                expect(driver.client)
                    .toBeInstanceOf(
                        GoogleSheetsConsume,
                    );
            },
        );

        test(
            'should use custom client when provided',
            () =>
            {
                const client =
                    new Memory();

                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',

                        spreadsheetId:
                            'test-spreadsheet-id',

                        credentials: {
                            clientEmail:
                                'test@example.com',

                            privateKey:
                                'test-private-key',
                        },

                        client,
                    });

                const driver =
                    dataSource.driver as GoogleSheetsDriver;

                expect(driver.client)
                    .toBe(client);
            },
        );

        test(
            'should resolve custom entity table name',
            async () =>
            {
                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',

                        client:
                            new Memory(),

                        entities: [
                            CustomUser,
                        ],
                    });

                await dataSource.initialize();

                try
                {
                    const metadata =
                        dataSource.entityMetadatas.find(
                            (item) =>
                                item.target === CustomUser,
                        );

                    expect(metadata)
                        .toBeDefined();

                    expect(metadata?.tableName)
                        .toBe('custom_users');
                }
                finally
                {
                    await dataSource.destroy();
                }
            },
        );

        test(
            'should use resolved entity table name as worksheet',
            async () =>
            {
                const client =
                    new Memory({
                        custom_users: [
                            {
                                id: 1,
                                name: 'Basuni',
                            },
                        ],
                    });

                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',

                        client,

                        entities: [
                            CustomUser,
                        ],
                    });

                await dataSource.initialize();

                try
                {
                    const repository =
                        dataSource.getRepository(CustomUser);

                    const users =
                        await repository.find();

                    expect(users)
                        .toHaveLength(1);

                    expect(users[0]?.id)
                        .toBe(1);

                    expect(users[0]?.name)
                        .toBe('Basuni');
                }
                finally
                {
                    await dataSource.destroy();
                }
            },
        );

        test(
            'should resolve custom column name',
            async () =>
            {
                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',

                        client:
                            new Memory(),

                        entities: [
                            MappedUser,
                        ],
                    });

                await dataSource.initialize();

                try
                {
                    const metadata =
                        dataSource.entityMetadatas.find(
                            (item) =>
                                item.target === MappedUser,
                        );

                    const column =
                        metadata?.findColumnWithPropertyName(
                            'name',
                        );

                    expect(column)
                        .toBeDefined();

                    expect(column?.propertyName)
                        .toBe('name');

                    expect(column?.databaseName)
                        .toBe('user_name');
                }
                finally
                {
                    await dataSource.destroy();
                }
            },
        );

        test(
            'should resolve column type',
            async () =>
            {
                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',

                        client:
                            new Memory(),

                        entities: [
                            TypedUser,
                        ],
                    });

                await dataSource.initialize();

                try
                {
                    const metadata =
                        dataSource.entityMetadatas.find(
                            (item) =>
                                item.target === TypedUser,
                        );

                    const ageColumn =
                        metadata?.findColumnWithPropertyName(
                            'age',
                        );

                    const activeColumn =
                        metadata?.findColumnWithPropertyName(
                            'active',
                        );

                    expect(ageColumn?.type)
                        .toBe('number');

                    expect(activeColumn?.type)
                        .toBe('boolean');
                }
                finally
                {
                    await dataSource.destroy();
                }
            },
        );

        test(
            'should resolve nullable column',
            async () =>
            {
                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',

                        client:
                            new Memory(),

                        entities: [
                            NullableUser,
                        ],
                    });

                await dataSource.initialize();

                try
                {
                    const metadata =
                        dataSource.entityMetadatas.find(
                            (item) =>
                                item.target === NullableUser,
                        );

                    const column =
                        metadata?.findColumnWithPropertyName(
                            'nickname',
                        );

                    expect(column)
                        .toBeDefined();

                    expect(column?.isNullable)
                        .toBe(true);
                }
                finally
                {
                    await dataSource.destroy();
                }
            },
        );

        test(
            'should resolve generated column',
            async () =>
            {
                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',

                        client:
                            new Memory(),

                        entities: [
                            GeneratedUser,
                        ],
                    });

                await dataSource.initialize();

                try
                {
                    const metadata =
                        dataSource.entityMetadatas.find(
                            (item) =>
                                item.target === GeneratedUser,
                        );

                    const column =
                        metadata?.findColumnWithPropertyName(
                            'id',
                        );

                    expect(column)
                        .toBeDefined();

                    expect(column?.isGenerated)
                        .toBe(true);

                    expect(column?.isPrimary)
                        .toBe(true);
                }
                finally
                {
                    await dataSource.destroy();
                }
            },
        );

        test(
            'should resolve increment generation strategy',
            async () =>
            {
                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',

                        client:
                            new Memory(),

                        entities: [
                            GeneratedUser,
                        ],
                    });

                await dataSource.initialize();

                try
                {
                    const metadata =
                        dataSource.entityMetadatas.find(
                            (item) =>
                                item.target === GeneratedUser,
                        );

                    const column =
                        metadata?.findColumnWithPropertyName(
                            'id',
                        );

                    expect(column?.generationStrategy)
                        .toBe('increment');
                }
                finally
                {
                    await dataSource.destroy();
                }
            },
        );

        test(
            'should resolve default value',
            async () =>
            {
                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',

                        client:
                            new Memory(),

                        entities: [
                            DefaultUser,
                        ],
                    });

                await dataSource.initialize();

                try
                {
                    const metadata =
                        dataSource.entityMetadatas.find(
                            (item) =>
                                item.target === DefaultUser,
                        );

                    const column =
                        metadata?.findColumnWithPropertyName(
                            'status',
                        );

                    expect(column)
                        .toBeDefined();

                    expect(column?.default)
                        .toBe('active');
                }
                finally
                {
                    await dataSource.destroy();
                }
            },
        );

        test(
            'should resolve uuid generation strategy',
            async () =>
            {
                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',

                        client:
                            new Memory(),

                        entities: [
                            UuidUser,
                        ],
                    });

                await dataSource.initialize();

                try
                {
                    const metadata =
                        dataSource.entityMetadatas.find(
                            (item) =>
                                item.target === UuidUser,
                        );

                    const column =
                        metadata?.findColumnWithPropertyName(
                            'id',
                        );

                    expect(column)
                        .toBeDefined();

                    expect(column?.isPrimary)
                        .toBe(true);

                    expect(column?.isGenerated)
                        .toBe(true);

                    expect(column?.generationStrategy)
                        .toBe('uuid');
                }
                finally
                {
                    await dataSource.destroy();
                }
            },
        );

        test(
            'should initialize with synchronize enabled',
            async () =>
            {
                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',

                        client:
                            new Memory(),

                        entities: [
                            SyncUser,
                        ],

                        synchronize: true,
                    });

                try
                {
                    await dataSource.initialize();

                    expect(dataSource.isInitialized)
                        .toBe(true);
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
            'should detect existing worksheet',
            async () =>
            {
                const client =
                    new Memory({
                        sync_users: [],
                    });

                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',

                        client,

                        entities: [
                            SyncUser,
                        ],

                        synchronize: true,
                    });

                try
                {
                    await dataSource.initialize();

                    expect(
                        await client.hasSheet('sync_users'),
                    ).toBe(true);
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
            'should create worksheet with headers',
            async () =>
            {
                const client =
                    new Memory();

                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',

                        client,

                        entities: [
                            SyncUser,
                        ],

                        synchronize: true,
                    });

                try
                {
                    await dataSource.initialize();

                    expect(
                        await client.hasSheet('sync_users'),
                    ).toBe(true);

                    expect(
                        await client.getHeaders('sync_users'),
                    ).toEqual([
                        'id',
                        'name',
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
            'should add missing headers to existing worksheet',
            async () =>
            {
                const client =
                    new Memory();

                await client.createSheet(
                    'sync_missing_headers',
                );

                await client.insertHeaders(
                    'sync_missing_headers',
                    [
                        'id',
                        'name',
                    ],
                );

                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',

                        client,

                        entities: [
                            SyncMissingHeaderUser,
                        ],

                        synchronize: true,
                    });

                try
                {
                    await dataSource.initialize();

                    expect(
                        await client.getHeaders(
                            'sync_missing_headers',
                        ),
                    ).toEqual([
                        'id',
                        'name',
                        'email',
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
            'should add headers to empty worksheet',
            async () =>
            {
                const client =
                    new Memory();

                await client.createSheet(
                    'sync_missing_headers',
                );

                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',

                        client,

                        entities: [
                            SyncMissingHeaderUser,
                        ],

                        synchronize: true,
                    });

                try
                {
                    await dataSource.initialize();

                    expect(
                        await client.getHeaders(
                            'sync_missing_headers',
                        ),
                    ).toEqual([
                        'id',
                        'name',
                        'email',
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
            'should preserve existing data in worksheet',
            async () =>
            {
                const client =
                    new Memory({
                        sync_missing_headers: [
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
                        ],
                    });

                await client.insertHeaders(
                    'sync_missing_headers',
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
                            SyncMissingHeaderUser,
                        ],

                        synchronize: true,
                    });

                try
                {
                    await dataSource.initialize();

                    expect(
                        await client.getRows(
                            'sync_missing_headers',
                        ),
                    ).toEqual([
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
            'should apply non-destructive schema changes',
            async () =>
            {
                const client =
                    new Memory({
                        sync_missing_headers: [
                            {
                                id: 1,
                                name: 'John',
                            },
                        ],
                    });

                await client.insertHeaders(
                    'sync_missing_headers',
                    [
                        'id',
                        'name',
                    ],
                );

                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',

                        client,

                        entities: [
                            SyncMissingHeaderUser,
                        ],

                        synchronize: true,
                    });

                try
                {
                    await dataSource.initialize();

                    expect(
                        await client.getHeaders(
                            'sync_missing_headers',
                        ),
                    ).toEqual([
                        'id',
                        'name',
                        'email',
                    ]);

                    expect(
                        await client.getRows(
                            'sync_missing_headers',
                        ),
                    ).toEqual([
                        {
                            id: 1,
                            name: 'John',
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
            'should synchronize worksheet schema end-to-end',
            async () =>
            {
                const client =
                    new Memory();

                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',

                        client,

                        entities: [
                            SyncMissingHeaderUser,
                        ],

                        synchronize: true,
                    });

                try
                {
                    await dataSource.initialize();

                    expect(
                        await client.hasSheet(
                            'sync_missing_headers',
                        ),
                    ).toBe(true);

                    expect(
                        await client.getHeaders(
                            'sync_missing_headers',
                        ),
                    ).toEqual([
                        'id',
                        'name',
                        'email',
                    ]);

                    expect(
                        await client.getRows(
                            'sync_missing_headers',
                        ),
                    ).toEqual([]);
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
            'rejects duplicate primary key',
            async () =>
            {
                const client =
                    new Memory({
                        generated_users: [
                            {
                                id: 1,
                                name: 'Basuni',
                            },
                        ],
                    });

                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',

                        client,

                        entities: [
                            GeneratedUser,
                        ],
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
                                'INSERT INTO "generated_users"("id","name") VALUES (:orm_param_0,:orm_param_1)',
                                [
                                    1,
                                    'Budi',
                                ],
                            ),
                        ).rejects.toThrow(
                            'Duplicate primary key',
                        );
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
            'rejects missing primary key',
            async () =>
            {
                const client =
                    new Memory({
                        required_users: [],
                    });

                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',
                        client,
                        entities: [
                            RequiredUser,
                        ],
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
                                'INSERT INTO "required_users"("name") VALUES (:orm_param_0)',
                                [
                                    'Budi',
                                ],
                            ),
                        ).rejects.toThrow(
                            'Missing primary key',
                        );
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
            'rejects unsupported operation',
            async () =>
            {
                const client =
                    new Memory({
                        generated_users: [],
                    });

                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',
                        client,
                        entities: [
                            GeneratedUser,
                        ],
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
                                'TRUNCATE TABLE "generated_users"',
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
            'should execute BeforeInsert lifecycle hook',
            async () =>
            {
                const client =
                    new Memory({
                        lifecycle_users: [],
                    });

                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',
                        client,
                        entities: [
                            LifecycleUser,
                        ],
                    });

                await dataSource.initialize();

                try
                {
                    const repository =
                        dataSource.getRepository(
                            LifecycleUser,
                        );

                    const entity =
                        repository.create({
                            name: 'Budi',
                        });

                    await repository.save(entity);

                    expect(
                        entity.name,
                    ).toBe('BUDI');

                    expect(
                        await repository.find(),
                    ).toEqual([
                        expect.objectContaining({
                            name: 'BUDI-loaded',
                        }),
                    ]);
                }
                finally
                {
                    await dataSource.destroy();
                }
            },
        );

        test(
            'should execute AfterInsert lifecycle hook',
            async () =>
            {
                const client =
                    new Memory({
                        lifecycle_users: [],
                    });

                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',
                        client,
                        entities: [
                            LifecycleUser2,
                        ],
                    });

                await dataSource.initialize();

                try
                {
                    const repository =
                        dataSource.getRepository(
                            LifecycleUser2,
                        );

                    const entity =
                        repository.create({
                            name: 'Budi',
                        });

                    await repository.save(entity);

                    expect(
                        entity.name,
                    ).toBe('Budi-after');
                }
                finally
                {
                    await dataSource.destroy();
                }
            },
        );

        test(
            'should execute BeforeUpdate lifecycle hook',
            async () =>
            {
                const client =
                    new Memory({
                        lifecycle_users: [
                            {
                                id: 1,
                                name: 'Budi',
                            },
                        ],
                    });

                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',
                        client,
                        entities: [
                            LifecycleUser,
                        ],
                    });

                await dataSource.initialize();

                try
                {
                    const repository =
                        dataSource.getRepository(
                            LifecycleUser,
                        );

                    const entity =
                        await repository.findOneBy({
                            id: 1,
                        });

                    expect(entity).toBeDefined();

                    entity!.name = 'andi';

                    await repository.save(entity!);

                    expect(entity!.name).toBe('ANDI');

                    expect(
                        await repository.find(),
                    ).toEqual([
                        expect.objectContaining({
                            name: 'ANDI-loaded',
                        }),
                    ]);
                }
                finally
                {
                    await dataSource.destroy();
                }
            },
        );

        test(
            'should execute AfterUpdate lifecycle hook',
            async () =>
            {
                const client =
                    new Memory({
                        lifecycle_users: [
                            {
                                id: 1,
                                name: 'Budi',
                            },
                        ],
                    });

                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',
                        client,
                        entities: [
                            LifecycleUser2,
                        ],
                    });

                await dataSource.initialize();

                try
                {
                    const repository =
                        dataSource.getRepository(
                            LifecycleUser2,
                        );

                    const entity =
                        repository.create({
                            id: 1,
                            name: 'andi',
                        });

                    await repository.save(entity);

                    expect(entity.name).toBe('andi-after');
                }
                finally
                {
                    await dataSource.destroy();
                }
            },
        );

        test(
            'should execute BeforeRemove lifecycle hook',
            async () =>
            {
                const client =
                    new Memory({
                        lifecycle_users: [
                            {
                                id: 1,
                                name: 'Budi',
                            },
                        ],
                    });

                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',
                        client,
                        entities: [
                            LifecycleUser,
                        ],
                    });

                await dataSource.initialize();

                try
                {
                    const repository =
                        dataSource.getRepository(
                            LifecycleUser,
                        );

                    const entity =
                        repository.create({
                            id: 1,
                            name: 'Budi',
                        });

                    await repository.remove(entity);

                    expect(
                        entity.name,
                    ).toBe('Budi-before');
                }
                finally
                {
                    await dataSource.destroy();
                }
            },
        );

        test(
            'should execute AfterRemove lifecycle hook',
            async () =>
            {
                const client =
                    new Memory({
                        lifecycle_users: [
                            {
                                id: 1,
                                name: 'Budi',
                            },
                        ],
                    });

                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',
                        client,
                        entities: [
                            LifecycleUser2,
                        ],
                    });

                await dataSource.initialize();

                try
                {
                    const repository =
                        dataSource.getRepository(
                            LifecycleUser2,
                        );

                    const entity =
                        repository.create({
                            id: 1,
                            name: 'Budi',
                        });

                    await repository.remove(entity);

                    expect(
                        entity.name,
                    ).toBe('Budi-after');
                }
                finally
                {
                    await dataSource.destroy();
                }
            },
        );

        test(
            'should execute subscriber beforeInsert hook',
            async () =>
            {
                const client =
                    new Memory({
                        lifecycle_users: [],
                    });

                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',
                        client,
                        entities: [
                            LifecycleUser,
                        ],
                        subscribers: [
                            LifecycleUserSubscriber,
                        ],
                    });

                await dataSource.initialize();

                try
                {
                    const repository =
                        dataSource.getRepository(
                            LifecycleUser,
                        );

                    const entity =
                        repository.create({
                            name: 'Budi',
                        });

                    await repository.save(entity);

                    expect(entity.name).toBe(
                        'BUDI-subscriber-before-subscriber-after',
                    );
                }
                finally
                {
                    await dataSource.destroy();
                }
            },
        );

        test(
            'should execute subscriber afterInsert hook',
            async () =>
            {
                const client =
                    new Memory({
                        lifecycle_users: [],
                    });

                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',
                        client,
                        entities: [
                            LifecycleUser,
                        ],
                        subscribers: [
                            LifecycleUserSubscriber,
                        ],
                    });

                await dataSource.initialize();

                try
                {
                    const repository =
                        dataSource.getRepository(
                            LifecycleUser,
                        );

                    const entity =
                        repository.create({
                            name: 'Budi',
                        });

                    await repository.save(entity);

                    expect(entity.name).toBe(
                        'BUDI-subscriber-before-subscriber-after',
                    );
                }
                finally
                {
                    await dataSource.destroy();
                }
            },
        );

        test(
            'should apply naming strategy to worksheet and columns',
            async () =>
            {
                const client =
                    new Memory();

                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',
                        client,
                        entities: [
                            NamingStrategyUser,
                        ],
                        synchronize: true,
                        namingStrategy:
                            new TestNamingStrategy(),
                    } as GoogleSheetsDataSourceOptions & {
                        namingStrategy: TestNamingStrategy;
                    });

                await dataSource.initialize();

                try
                {
                    const metadata =
                        dataSource.getMetadata(
                            NamingStrategyUser,
                        );

                    expect(metadata.tableName).toBe(
                        'sheet_namingstrategyuser',
                    );

                    expect(
                        metadata.findColumnWithPropertyName(
                            'displayName',
                        )?.databaseName,
                    ).toBe(
                        'col_displayname',
                    );

                    expect(
                        await client.hasSheet(
                            'sheet_namingstrategyuser',
                        ),
                    ).toBe(true);

                    expect(
                        await client.getHeaders(
                            'sheet_namingstrategyuser',
                        ),
                    ).toEqual([
                        'col_id',
                        'col_displayname',
                    ]);
                }
                finally
                {
                    await dataSource.destroy();
                }
            },
        );

        test(
            'should resolve relation metadata',
            async () =>
            {
                const client =
                    new Memory({
                        relation_users: [],
                        relation_posts: [],
                    });

                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',
                        client,
                        entities: [
                            RelationUser,
                            RelationPost,
                        ],
                        synchronize: true,
                    });

                await dataSource.initialize();

                try
                {
                    const metadata =
                        dataSource.getMetadata(
                            RelationPost,
                        );

                    const relation =
                        metadata.relations.find(
                            (item) =>
                                item.propertyName === 'author',
                        );

                    expect(relation).toBeDefined();

                    expect(
                        relation!.isManyToOne,
                    ).toBe(true);

                    expect(
                        relation!.inverseEntityMetadata.target,
                    ).toBe(RelationUser);

                    expect(
                        relation!.inverseRelation,
                    ).toBeUndefined();
                }
                finally
                {
                    await dataSource.destroy();
                }
            },
        );

        test(
            'should load many-to-one relation',
            async () =>
            {
                const client =
                    new Memory({
                        relation_users: [
                            {
                                id: 1,
                                name: 'Budi',
                            },
                        ],
                        relation_posts: [
                            {
                                id: 1,
                                title: 'Post Budi',
                                authorId: 1,
                            },
                        ],
                    });

                const dataSource =
                    createGoogleSheetsDataSource({
                        type: 'google-sheets',
                        client,
                        entities: [
                            RelationUser,
                            RelationPost,
                        ],
                    });

                await dataSource.initialize();

                try
                {
                    const repository =
                        dataSource.getRepository(
                            RelationPost,
                        );

                    const post =
                        await repository.findOne({
                            where: {
                                id: 1,
                            },
                            relations: {
                                author: true,
                            },
                        });

                    expect(post).toBeDefined();
                    expect(post!.title).toBe('Post Budi');
                    expect(post!.author).toBeDefined();
                    expect(post!.author.id).toBe(1);
                    expect(post!.author.name).toBe('Budi');
                }
                finally
                {
                    await dataSource.destroy();
                }
            },
        );
    },
);
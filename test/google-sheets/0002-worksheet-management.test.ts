import { describe, expect, test } from 'bun:test';
import { Memory } from '../../src/core/memory';

describe(
    'Worksheet Management',
    () =>
    {
        test(
            'should detect existing worksheet',
            async () =>
            {
                const client =
                    new Memory({
                        users: [],
                    });

                expect(
                    await client.hasSheet('users'),
                ).toBe(true);
            },
        );

        test(
            'should return false for non-existing worksheet',
            async () =>
            {
                const client =
                    new Memory();

                expect(
                    await client.hasSheet('users'),
                ).toBe(false);
            },
        );

        test(
            'should create worksheet',
            async () =>
            {
                const client =
                    new Memory();

                expect(
                    await client.hasSheet('users'),
                ).toBe(false);

                await client.createSheet('users');

                expect(
                    await client.hasSheet('users'),
                ).toBe(true);
            },
        );

        test(
            'should not duplicate existing worksheet',
            async () =>
            {
                const client =
                    new Memory({
                        users: [],
                    });

                await client.createSheet('users');

                expect(
                    await client.hasSheet('users'),
                ).toBe(true);
            },
        );

        test(
            'should create worksheet with empty headers',
            async () =>
            {
                const client =
                    new Memory();

                await client.createSheet('users');

                expect(
                    await client.getHeaders('users'),
                ).toEqual([]);
            },
        );

        test(
            'should create worksheet with empty rows',
            async () =>
            {
                const client =
                    new Memory();

                await client.createSheet('users');

                expect(
                    await client.getRows('users'),
                ).toEqual([]);
            },
        );

        test(
            'should rename worksheet',
            async () =>
            {
                const client =
                    new Memory({
                        users: [
                            {
                                id: 1,
                                name: 'John',
                            },
                        ],
                    });

                await client.insertHeaders(
                    'users',
                    [
                        'id',
                        'name',
                    ],
                );

                await client.renameSheet(
                    'users',
                    'customers',
                );

                expect(
                    await client.hasSheet('users'),
                ).toBe(false);

                expect(
                    await client.hasSheet('customers'),
                ).toBe(true);
            },
        );

        test(
            'should preserve worksheet data when renamed',
            async () =>
            {
                const client =
                    new Memory({
                        users: [
                            {
                                id: 1,
                                name: 'John',
                            },
                        ],
                    });

                await client.insertHeaders(
                    'users',
                    [
                        'id',
                        'name',
                    ],
                );

                await client.renameSheet(
                    'users',
                    'customers',
                );

                expect(
                    await client.getHeaders('customers'),
                ).toEqual([
                    'id',
                    'name',
                ]);

                expect(
                    await client.getRows('customers'),
                ).toEqual([
                    {
                        id: 1,
                        name: 'John',
                    },
                ]);
            },
        );

        test(
            'should delete worksheet',
            async () =>
            {
                const client =
                    new Memory({
                        users: [],
                    });

                expect(
                    await client.hasSheet('users'),
                ).toBe(true);

                await client.deleteSheet('users');

                expect(
                    await client.hasSheet('users'),
                ).toBe(false);
            },
        );

        test(
            'should remove worksheet data when deleted',
            async () =>
            {
                const client =
                    new Memory({
                        users: [
                            {
                                id: 1,
                                name: 'John',
                            },
                        ],
                    });

                await client.insertHeaders(
                    'users',
                    [
                        'id',
                        'name',
                    ],
                );

                await client.deleteSheet('users');

                expect(
                    await client.getHeaders('users'),
                ).toEqual([]);

                expect(
                    await client.getRows('users'),
                ).toEqual([]);
            },
        );

        test(
            'should get worksheet metadata',
            async () =>
            {
                const client =
                    new Memory({
                        users: [],
                    });

                const metadata =
                    await client.getSheetMetadata('users');

                expect(metadata).toEqual({
                    sheetId: expect.any(Number),
                    title: 'users',
                });
            },
        );

        test(
            'should return null for non-existing worksheet metadata',
            async () =>
            {
                const client =
                    new Memory();

                const metadata =
                    await client.getSheetMetadata('users');

                expect(metadata).toBeNull();
            },
        );

        test(
            'should reject invalid worksheet name when creating',
            async () =>
            {
                const client =
                    new Memory();

                await expect(
                    client.createSheet('users:test'),
                ).rejects.toThrow(
                    'Worksheet name contains invalid characters.',
                );
            },
        );

        test(
            'should reject worksheet name longer than 100 characters',
            async () =>
            {
                const client =
                    new Memory();

                const sheetName =
                    'a'.repeat(101);

                await expect(
                    client.createSheet(sheetName),
                ).rejects.toThrow(
                    'Worksheet name cannot exceed 100 characters.',
                );
            },
        );

        test(
            'should reject invalid worksheet name when renaming',
            async () =>
            {
                const client =
                    new Memory({
                        users: [],
                    });

                await expect(
                    client.renameSheet(
                        'users',
                        'users:test',
                    ),
                ).rejects.toThrow(
                    'Worksheet name contains invalid characters.',
                );
            },
        );

        test(
            'should support worksheet name with spaces',
            async () =>
            {
                const client =
                    new Memory();

                await client.createSheet(
                    'User Data',
                );

                expect(
                    await client.hasSheet(
                        'User Data',
                    ),
                ).toBe(true);
            },
        );

        test(
            'should support worksheet name with apostrophe',
            async () =>
            {
                const client =
                    new Memory();

                await client.createSheet(
                    "User's Data",
                );

                expect(
                    await client.hasSheet(
                        "User's Data",
                    ),
                ).toBe(true);
            },
        );

        test(
            'should preserve worksheet data with special characters',
            async () =>
            {
                const client =
                    new Memory();

                const sheetName =
                    'User Data';

                await client.createSheet(
                    sheetName,
                );

                await client.insertHeaders(
                    sheetName,
                    [
                        'id',
                        'name',
                    ],
                );

                await client.insertRows(
                    sheetName,
                    [
                        {
                            id: 1,
                            name: 'John',
                        },
                    ],
                );

                expect(
                    await client.getRows(
                        sheetName,
                    ),
                ).toEqual([
                    {
                        id: 1,
                        name: 'John',
                    },
                ]);
            },
        );
    },
);
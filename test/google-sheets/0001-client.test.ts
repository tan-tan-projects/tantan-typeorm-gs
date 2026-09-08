import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from 'bun:test';

const getMock = mock();
const sheetsMock = mock();
const appendMock = mock();
const updateMock = mock();
const getSpreadsheetMock = mock();
const batchUpdateMock = mock();

mock.module(
    'googleapis',
    () =>
    ({
        google: {
            auth: {
                GoogleAuth: mock(),
            },

            sheets: sheetsMock,
        },
    }),
);

const { GoogleSheetsConsume } = await import('../../src/index')

describe(
    'GoogleSheetsConsume',
    () =>
    {
        beforeEach(() =>
        {
            getMock.mockReset();

            appendMock.mockReset();

            updateMock.mockReset();

            getSpreadsheetMock.mockReset();

            batchUpdateMock.mockReset();

            sheetsMock.mockReset();

            sheetsMock.mockReturnValue({
                spreadsheets: {
                    values: {
                        get: getMock,
                        append: appendMock,
                        update: updateMock,
                    },
                    get: getSpreadsheetMock,

                    batchUpdate: batchUpdateMock,
                },
            });

        });

        afterEach(() =>
        {
            mock.restore();
        });

        test(
            'should read rows from Google Sheets',
            async () =>
            {
                getMock.mockResolvedValue({
                    data: {
                        values: [
                            [
                                'id',
                                'name',
                                'age',
                            ],
                            [
                                1,
                                'Budi',
                                20,
                            ],
                            [
                                2,
                                'Andi',
                                25,
                            ],
                        ],
                    },
                });

                const client =
                    new GoogleSheetsConsume({
                        spreadsheetId:
                            'spreadsheet-123',

                        credentials: {
                            clientEmail:
                                'test@example.com',

                            privateKey:
                                'private-key',
                        },
                    });

                await client.connect();

                const rows =
                    await client.getRows(
                        'users',
                    );

                expect(
                    rows,
                ).toEqual([
                    {
                        id: 1,
                        name: 'Budi',
                        age: 20,
                    },
                    {
                        id: 2,
                        name: 'Andi',
                        age: 25,
                    },
                ]);

                expect(
                    getMock,
                ).toHaveBeenCalledWith({
                    spreadsheetId:
                        'spreadsheet-123',

                    range:
                        'users',
                });
            },
        );

        test(
            'should return empty array when sheet has no rows',
            async () =>
            {
                getMock.mockResolvedValue({
                    data: {
                        values: [],
                    },
                });

                const client =
                    new GoogleSheetsConsume({
                        spreadsheetId:
                            'spreadsheet-123',

                        credentials: {
                            clientEmail:
                                'test@example.com',

                            privateKey:
                                'private-key',
                        },
                    });

                await client.connect();

                const rows =
                    await client.getRows(
                        'users',
                    );

                expect(
                    rows,
                ).toEqual([]);
            },
        );

        test(
            'should insert rows into Google Sheets',
            async () =>
            {
                getMock.mockResolvedValue({
                    data: {
                        values: [
                            ['id', 'name', 'age'],
                        ],
                    },
                });

                appendMock.mockResolvedValue({
                    data: {},
                });

                const client =
                    new GoogleSheetsConsume({
                        spreadsheetId:
                            'spreadsheet-123',

                        credentials: {
                            clientEmail:
                                'test@example.com',

                            privateKey:
                                'private-key',
                        },
                    });

                await client.connect();

                await client.insertRows(
                    'users',
                    [
                        {
                            id: 1,
                            name: 'Budi',
                            age: 20,
                        },
                        {
                            id: 2,
                            name: 'Andi',
                            age: 25,
                        },
                    ],
                );

                expect(
                    appendMock,
                ).toHaveBeenCalledWith({
                    spreadsheetId:
                        'spreadsheet-123',

                    range:
                        'users',

                    valueInputOption:
                        'RAW',

                    insertDataOption:
                        'INSERT_ROWS',

                    requestBody: {
                        values: [
                            [
                                1,
                                'Budi',
                                20,
                            ],
                            [
                                2,
                                'Andi',
                                25,
                            ],
                        ],
                    },
                });
            },
        );

        test(
            'should do nothing when inserting empty rows',
            async () =>
            {
                const client =
                    new GoogleSheetsConsume({
                        spreadsheetId:
                            'spreadsheet-123',

                        credentials: {
                            clientEmail:
                                'test@example.com',

                            privateKey:
                                'private-key',
                        },
                    });

                await client.connect();

                await client.insertRows(
                    'users',
                    [],
                );

                expect(
                    appendMock,
                ).not.toHaveBeenCalled();
            },
        );

        test(
            'should update matching rows in Google Sheets',
            async () =>
            {
                getMock.mockResolvedValue({
                    data: {
                        values: [
                            [
                                'id',
                                'name',
                                'age',
                            ],
                            [
                                1,
                                'Budi',
                                20,
                            ],
                            [
                                2,
                                'Andi',
                                25,
                            ],
                        ],
                    },
                });

                updateMock.mockResolvedValue({
                    data: {},
                });

                const client =
                    new GoogleSheetsConsume({
                        spreadsheetId:
                            'spreadsheet-123',

                        credentials: {
                            clientEmail:
                                'test@example.com',

                            privateKey:
                                'private-key',
                        },
                    });

                await client.connect();

                const affected =
                    await client.updateRows(
                        'users',
                        (row) =>
                            row.id === 2,
                        {
                            age: 26,
                        },
                    );

                expect(
                    affected,
                ).toBe(1);

                expect(
                    updateMock,
                ).toHaveBeenCalledWith({
                    spreadsheetId:
                        'spreadsheet-123',

                    range:
                        "'users'!A3",

                    valueInputOption:
                        'RAW',

                    requestBody: {
                        values: [
                            [
                                2,
                                'Andi',
                                26,
                            ],
                        ],
                    },
                });
            },
        );

        test(
            'should return zero when no rows match update predicate',
            async () =>
            {
                getMock.mockResolvedValue({
                    data: {
                        values: [
                            [
                                'id',
                                'name',
                            ],
                            [
                                1,
                                'Budi',
                            ],
                        ],
                    },
                });

                const client =
                    new GoogleSheetsConsume({
                        spreadsheetId:
                            'spreadsheet-123',

                        credentials: {
                            clientEmail:
                                'test@example.com',

                            privateKey:
                                'private-key',
                        },
                    });

                await client.connect();

                const affected =
                    await client.updateRows(
                        'users',
                        (row) =>
                            row.id === 999,
                        {
                            name: 'Nobody',
                        },
                    );

                expect(
                    affected,
                ).toBe(0);

                expect(
                    updateMock,
                ).not.toHaveBeenCalled();
            },
        );

        test(
            'should delete matching rows from Google Sheets',
            async () =>
            {
                getMock.mockResolvedValue({
                    data: {
                        values: [
                            [
                                'id',
                                'name',
                                'age',
                            ],
                            [
                                1,
                                'Budi',
                                20,
                            ],
                            [
                                2,
                                'Andi',
                                25,
                            ],
                            [
                                3,
                                'Citra',
                                30,
                            ],
                        ],
                    },
                });

                getSpreadsheetMock.mockResolvedValue({
                    data: {
                        sheets: [
                            {
                                properties: {
                                    sheetId: 123,
                                    title: 'users',
                                },
                            },
                        ],
                    },
                });

                batchUpdateMock.mockResolvedValue({
                    data: {},
                });

                const client =
                    new GoogleSheetsConsume({
                        spreadsheetId:
                            'spreadsheet-123',

                        credentials: {
                            clientEmail:
                                'test@example.com',

                            privateKey:
                                'private-key',
                        },
                    });

                await client.connect();

                const affected =
                    await client.deleteRows(
                        'users',
                        (row) =>
                            row.id === 2,
                    );

                expect(
                    affected,
                ).toBe(1);

                expect(
                    getSpreadsheetMock,
                ).toHaveBeenCalledWith({
                    spreadsheetId:
                        'spreadsheet-123',

                    fields:
                        'sheets.properties',
                });

                expect(
                    batchUpdateMock,
                ).toHaveBeenCalledWith({
                    spreadsheetId:
                        'spreadsheet-123',

                    requestBody: {
                        requests: [
                            {
                                deleteDimension: {
                                    range: {
                                        sheetId: 123,
                                        dimension: 'ROWS',
                                        startIndex: 2,
                                        endIndex: 3,
                                    },
                                },
                            },
                        ],
                    },
                });
            },
        );

        test(
            'should return zero when no rows match delete predicate',
            async () =>
            {
                getMock.mockResolvedValue({
                    data: {
                        values: [
                            [
                                'id',
                                'name',
                            ],
                            [
                                1,
                                'Budi',
                            ],
                        ],
                    },
                });

                const client =
                    new GoogleSheetsConsume({
                        spreadsheetId:
                            'spreadsheet-123',

                        credentials: {
                            clientEmail:
                                'test@example.com',

                            privateKey:
                                'private-key',
                        },
                    });

                await client.connect();

                const affected =
                    await client.deleteRows(
                        'users',
                        (row) =>
                            row.id === 999,
                    );

                expect(
                    affected,
                ).toBe(0);

                expect(
                    getSpreadsheetMock,
                ).not.toHaveBeenCalled();

                expect(
                    batchUpdateMock,
                ).not.toHaveBeenCalled();
            },
        );

        test(
            'should escape worksheet name with spaces when updating rows',
            async () =>
            {
                getMock.mockResolvedValue({
                    data: {
                        values: [
                            [
                                'id',
                                'name',
                            ],
                            [
                                1,
                                'Budi',
                            ],
                        ],
                    },
                });

                updateMock.mockResolvedValue({
                    data: {},
                });

                const client =
                    new GoogleSheetsConsume({
                        spreadsheetId:
                            'spreadsheet-123',

                        credentials: {
                            clientEmail:
                                'test@example.com',

                            privateKey:
                                'private-key',
                        },
                    });

                await client.connect();

                await client.updateRows(
                    'User Data',
                    (row) =>
                        row.id === 1,
                    {
                        name: 'Andi',
                    },
                );

                expect(
                    updateMock,
                ).toHaveBeenCalledWith({
                    spreadsheetId:
                        'spreadsheet-123',

                    range:
                        "'User Data'!A2",

                    valueInputOption:
                        'RAW',

                    requestBody: {
                        values: [
                            [
                                1,
                                'Andi',
                            ],
                        ],
                    },
                });
            },
        );

        test(
            'should escape apostrophe in worksheet name when updating rows',
            async () =>
            {
                getMock.mockResolvedValue({
                    data: {
                        values: [
                            [
                                'id',
                                'name',
                            ],
                            [
                                1,
                                'Budi',
                            ],
                        ],
                    },
                });

                updateMock.mockResolvedValue({
                    data: {},
                });

                const client =
                    new GoogleSheetsConsume({
                        spreadsheetId:
                            'spreadsheet-123',

                        credentials: {
                            clientEmail:
                                'test@example.com',

                            privateKey:
                                'private-key',
                        },
                    });

                await client.connect();

                await client.updateRows(
                    "User's Data",
                    (row) =>
                        row.id === 1,
                    {
                        name: 'Andi',
                    },
                );

                expect(
                    updateMock,
                ).toHaveBeenCalledWith({
                    spreadsheetId:
                        'spreadsheet-123',

                    range:
                        "'User''s Data'!A2",

                    valueInputOption:
                        'RAW',

                    requestBody: {
                        values: [
                            [
                                1,
                                'Andi',
                            ],
                        ],
                    },
                });
            },
        );

        test(
            'should read multiple rows with one API request',
            async () =>
            {
                getMock.mockResolvedValue({
                    data: {
                        values: [
                            ['id', 'name'],
                            [1, 'Budi'],
                            [2, 'Andi'],
                            [3, 'Citra'],
                            [4, 'Deni'],
                        ],
                    },
                });

                const client =
                    new GoogleSheetsConsume({
                        spreadsheetId:
                            'spreadsheet-123',

                        credentials: {
                            clientEmail:
                                'test@example.com',

                            privateKey:
                                'private-key',
                        },
                    });

                await client.connect();

                const rows =
                    await client.getRows(
                        'users',
                    );

                expect(
                    rows,
                ).toHaveLength(4);

                expect(
                    getMock,
                ).toHaveBeenCalledTimes(1);
            },
        );

        test(
            'should append multiple rows with one API request',
            async () =>
            {
                getMock.mockResolvedValue({
                    data: {
                        values: [
                            ['id', 'name'],
                        ],
                    },
                });

                appendMock.mockResolvedValue({
                    data: {},
                });

                const client =
                    new GoogleSheetsConsume({
                        spreadsheetId:
                            'spreadsheet-123',

                        credentials: {
                            clientEmail:
                                'test@example.com',

                            privateKey:
                                'private-key',
                        },
                    });

                await client.connect();

                const rows = [
                    {
                        id: 1,
                        name: 'Budi',
                    },
                    {
                        id: 2,
                        name: 'Andi',
                    },
                    {
                        id: 3,
                        name: 'Citra',
                    },
                ];

                await client.insertRows(
                    'users',
                    rows,
                );

                expect(
                    appendMock,
                ).toHaveBeenCalledTimes(1);

                expect(
                    appendMock,
                ).toHaveBeenCalledWith({
                    spreadsheetId:
                        'spreadsheet-123',

                    range:
                        'users',

                    valueInputOption:
                        'RAW',

                    insertDataOption:
                        'INSERT_ROWS',

                    requestBody: {
                        values: [
                            [1, 'Budi'],
                            [2, 'Andi'],
                            [3, 'Citra'],
                        ],
                    },
                });
            },
        );

        test(
            'should update multiple rows with one API request',
            async () =>
            {
                getMock.mockResolvedValue({
                    data: {
                        values: [
                            ['id', 'name'],
                            [1, 'Budi'],
                            [2, 'Andi'],
                            [3, 'Citra'],
                        ],
                    },
                });

                updateMock.mockResolvedValue({
                    data: {},
                });

                const client =
                    new GoogleSheetsConsume({
                        spreadsheetId:
                            'spreadsheet-123',

                        credentials: {
                            clientEmail:
                                'test@example.com',

                            privateKey:
                                'private-key',
                        },
                    });

                await client.connect();

                const affected =
                    await client.updateRows(
                        'users',
                        (row) =>
                            row.id === 1 ||
                            row.id === 2 ||
                            row.id === 3,
                        {
                            name: 'Updated',
                        },
                    );

                expect(
                    affected,
                ).toBe(3);

                expect(
                    updateMock,
                ).toHaveBeenCalledTimes(1);

                expect(
                    updateMock,
                ).toHaveBeenCalledWith({
                    spreadsheetId:
                        'spreadsheet-123',

                    range:
                        "'users'!A2",

                    valueInputOption:
                        'RAW',

                    requestBody: {
                        values: [
                            [1, 'Updated'],
                            [2, 'Updated'],
                            [3, 'Updated'],
                        ],
                    },
                });
            },
        );

        test(
            'should update non-contiguous rows with separate API requests',
            async () =>
            {
                getMock.mockResolvedValue({
                    data: {
                        values: [
                            ['id', 'name'],
                            [1, 'Budi'],
                            [2, 'Andi'],
                            [3, 'Citra'],
                            [4, 'Deni'],
                            [5, 'Eko'],
                        ],
                    },
                });

                updateMock.mockResolvedValue({
                    data: {},
                });

                const client =
                    new GoogleSheetsConsume({
                        spreadsheetId:
                            'spreadsheet-123',

                        credentials: {
                            clientEmail:
                                'test@example.com',

                            privateKey:
                                'private-key',
                        },
                    });

                await client.connect();

                const affected =
                    await client.updateRows(
                        'users',
                        (row) =>
                            row.id === 1 ||
                            row.id === 2 ||
                            row.id === 4 ||
                            row.id === 5,
                        {
                            name: 'Updated',
                        },
                    );

                expect(
                    affected,
                ).toBe(4);

                expect(
                    updateMock,
                ).toHaveBeenCalledTimes(2);

                expect(
                    updateMock,
                ).toHaveBeenNthCalledWith(
                    1,
                    {
                        spreadsheetId:
                            'spreadsheet-123',

                        range:
                            "'users'!A2",

                        valueInputOption:
                            'RAW',

                        requestBody: {
                            values: [
                                [1, 'Updated'],
                                [2, 'Updated'],
                            ],
                        },
                    },
                );

                expect(
                    updateMock,
                ).toHaveBeenNthCalledWith(
                    2,
                    {
                        spreadsheetId:
                            'spreadsheet-123',

                        range:
                            "'users'!A5",

                        valueInputOption:
                            'RAW',

                        requestBody: {
                            values: [
                                [4, 'Updated'],
                                [5, 'Updated'],
                            ],
                        },
                    },
                );
            },
        );

        test(
            'should delete multiple rows with one API request',
            async () =>
            {
                getMock.mockResolvedValue({
                    data: {
                        values: [
                            ['id', 'name'],
                            [1, 'Budi'],
                            [2, 'Andi'],
                            [3, 'Citra'],
                            [4, 'Deni'],
                        ],
                    },
                });

                getSpreadsheetMock.mockResolvedValue({
                    data: {
                        sheets: [
                            {
                                properties: {
                                    sheetId: 123,
                                    title: 'users',
                                },
                            },
                        ],
                    },
                });

                batchUpdateMock.mockResolvedValue({
                    data: {},
                });

                const client =
                    new GoogleSheetsConsume({
                        spreadsheetId:
                            'spreadsheet-123',

                        credentials: {
                            clientEmail:
                                'test@example.com',

                            privateKey:
                                'private-key',
                        },
                    });

                await client.connect();

                const affected =
                    await client.deleteRows(
                        'users',
                        (row) =>
                            row.id === 2 ||
                            row.id === 3 ||
                            row.id === 4,
                    );

                expect(
                    affected,
                ).toBe(3);

                expect(
                    batchUpdateMock,
                ).toHaveBeenCalledTimes(1);
            },
        );

        test(
            'should cache worksheet metadata',
            async () =>
            {
                getSpreadsheetMock.mockResolvedValue({
                    data: {
                        sheets: [
                            {
                                properties: {
                                    sheetId: 123,
                                    title: 'users',
                                },
                            },
                        ],
                    },
                });

                const client =
                    new GoogleSheetsConsume({
                        spreadsheetId:
                            'spreadsheet-123',

                        credentials: {
                            clientEmail:
                                'test@example.com',

                            privateKey:
                                'private-key',
                        },
                    });

                await client.connect();

                const first =
                    await client.getSheetMetadata(
                        'users',
                    );

                const second =
                    await client.getSheetMetadata(
                        'users',
                    );

                expect(first).toEqual({
                    sheetId: 123,
                    title: 'users',
                });

                expect(second).toEqual({
                    sheetId: 123,
                    title: 'users',
                });

                expect(
                    getSpreadsheetMock,
                ).toHaveBeenCalledTimes(1);
            },
        );

        test(
            'should cache worksheet headers',
            async () =>
            {
                getMock.mockResolvedValue({
                    data: {
                        values: [
                            [
                                'id',
                                'name',
                                'email',
                            ],
                        ],
                    },
                });

                const client =
                    new GoogleSheetsConsume({
                        spreadsheetId:
                            'spreadsheet-123',

                        credentials: {
                            clientEmail:
                                'test@example.com',

                            privateKey:
                                'private-key',
                        },
                    });

                await client.connect();

                const first =
                    await client.getHeaders(
                        'users',
                    );

                const second =
                    await client.getHeaders(
                        'users',
                    );

                expect(first).toEqual([
                    'id',
                    'name',
                    'email',
                ]);

                expect(second).toEqual([
                    'id',
                    'name',
                    'email',
                ]);

                expect(
                    getMock,
                ).toHaveBeenCalledTimes(1);
            },
        );

        test(
            'should retry failed API request',
            async () =>
            {
                getMock
                    .mockRejectedValueOnce(
                        {
                            response: {
                                status: 500,
                            },
                        },
                    )
                    .mockResolvedValueOnce({
                        data: {
                            values: [
                                ['id', 'name'],
                                [1, 'John'],
                            ],
                        },
                    });

                const client =
                    new GoogleSheetsConsume({
                        spreadsheetId:
                            'spreadsheet-123',

                        credentials: {
                            clientEmail:
                                'test@example.com',

                            privateKey:
                                'private-key',
                        },
                    });

                await client.connect();

                const rows =
                    await client.getRows(
                        'users',
                    );

                expect(rows).toEqual([
                    {
                        id: 1,
                        name: 'John',
                    },
                ]);

                expect(
                    getMock,
                ).toHaveBeenCalledTimes(2);
            },
        );

        test(
            'should retry API request multiple times before failing',
            async () =>
            {
                const error =
                    Object.assign(
                        new Error(
                            'Temporary API error',
                        ),
                        {
                            response: {
                                status: 500,
                            },
                        },
                    );

                getMock
                    .mockRejectedValueOnce(error)
                    .mockRejectedValueOnce(error)
                    .mockRejectedValueOnce(error)
                    .mockRejectedValueOnce(error);

                const client =
                    new GoogleSheetsConsume({
                        spreadsheetId:
                            'spreadsheet-id',

                        credentials: {
                            clientEmail:
                                'client@example.com',

                            privateKey:
                                'private-key',
                        },
                    });

                await client.connect();

                await expect(
                    client.getRows('users'),
                ).rejects.toBe(error);

                expect(
                    getMock,
                ).toHaveBeenCalledTimes(4);
            },
        );

        test(
            'should retry rate limit API request',
            async () =>
            {
                getMock
                    .mockRejectedValueOnce({
                        response: {
                            status: 429,
                        },
                    })
                    .mockResolvedValueOnce({
                        data: {
                            values: [
                                ['id', 'name'],
                                [1, 'John'],
                            ],
                        },
                    });

                const client =
                    new GoogleSheetsConsume({
                        spreadsheetId:
                            'spreadsheet-id',

                        credentials: {
                            clientEmail:
                                'client@example.com',

                            privateKey:
                                'private-key',
                        },
                    });

                await client.connect();

                const rows =
                    await client.getRows('users');

                expect(rows).toEqual([
                    {
                        id: 1,
                        name: 'John',
                    },
                ]);

                expect(
                    getMock,
                ).toHaveBeenCalledTimes(2);
            },
        );

        test(
            'should use exponential backoff when retrying API request',
            async () =>
            {
                const sleepMock =
                    spyOn(
                        globalThis,
                        'setTimeout',
                    );

                getMock
                    .mockRejectedValueOnce({
                        response: {
                            status: 500,
                        },
                    })
                    .mockRejectedValueOnce({
                        response: {
                            status: 500,
                        },
                    })
                    .mockResolvedValueOnce({
                        data: {
                            values: [
                                ['id', 'name'],
                                [1, 'John'],
                            ],
                        },
                    });

                const client =
                    new GoogleSheetsConsume({
                        spreadsheetId:
                            'spreadsheet-id',

                        credentials: {
                            clientEmail:
                                'client@example.com',

                            privateKey:
                                'private-key',
                        },
                    });

                await client.connect();

                const rows =
                    await client.getRows('users');

                expect(rows).toEqual([
                    {
                        id: 1,
                        name: 'John',
                    },
                ]);

                expect(
                    getMock,
                ).toHaveBeenCalledTimes(3);

                expect(
                    sleepMock,
                ).toHaveBeenCalledTimes(2);

                expect(
                    sleepMock.mock.calls[0]?.[1],
                ).toBe(100);

                expect(
                    sleepMock.mock.calls[1]?.[1],
                ).toBe(200);

                sleepMock.mockRestore();
            },
        );

        test(
            'should respect retry-after when rate limit API request fails',
            async () =>
            {
                const sleepMock =
                    spyOn(
                        globalThis,
                        'setTimeout',
                    );

                getMock
                    .mockRejectedValueOnce({
                        response: {
                            status: 429,
                            headers: {
                                'retry-after': '1',
                            },
                        },
                    })
                    .mockResolvedValueOnce({
                        data: {
                            values: [
                                ['id', 'name'],
                                [1, 'John'],
                            ],
                        },
                    });

                const client =
                    new GoogleSheetsConsume({
                        spreadsheetId:
                            'spreadsheet-id',

                        credentials: {
                            clientEmail:
                                'client@example.com',

                            privateKey:
                                'private-key',
                        },
                    });

                await client.connect();

                const rows =
                    await client.getRows('users');

                expect(rows).toEqual([
                    {
                        id: 1,
                        name: 'John',
                    },
                ]);

                expect(
                    getMock,
                ).toHaveBeenCalledTimes(2);

                expect(
                    sleepMock,
                ).toHaveBeenCalledTimes(1);

                expect(
                    sleepMock.mock.calls[0]?.[1],
                ).toBe(1000);

                sleepMock.mockRestore();
            },
        );

        test(
            'should throw authentication error when Google API rejects with 401',
            async () =>
            {
                getMock.mockRejectedValue({
                    response: {
                        status: 401,
                    },
                });

                const client =
                    new GoogleSheetsConsume({
                        spreadsheetId:
                            'spreadsheet-123',

                        credentials: {
                            clientEmail:
                                'test@example.com',

                            privateKey:
                                'private-key',
                        },
                    });

                await client.connect();

                await expect(
                    client.getRows('users'),
                ).rejects.toMatchObject({
                    name:
                        'GoogleSheetsAuthenticationError',
                });

                expect(
                    getMock,
                ).toHaveBeenCalledTimes(1);
            },
        );

        test(
            'should throw spreadsheet not found error when Google API rejects with 404',
            async () =>
            {
                getMock.mockRejectedValue({
                    response: {
                        status: 404,
                    },
                });

                const client =
                    new GoogleSheetsConsume({
                        spreadsheetId:
                            'spreadsheet-123',

                        credentials: {
                            clientEmail:
                                'test@example.com',

                            privateKey:
                                'private-key',
                        },
                    });

                await client.connect();

                await expect(
                    client.getRows('users'),
                ).rejects.toMatchObject({
                    name:
                        'GoogleSheetsSpreadsheetNotFoundError',
                });

                expect(
                    getMock,
                ).toHaveBeenCalledTimes(1);
            },
        );

        test(
            'should throw worksheet not found error when deleting from missing worksheet',
            async () =>
            {
                getMock.mockResolvedValue({
                    data: {
                        values: [
                            ['id', 'name'],
                            [1, 'John'],
                        ],
                    },
                });

                getSpreadsheetMock.mockResolvedValue({
                    data: {
                        sheets: [],
                    },
                });

                const client =
                    new GoogleSheetsConsume({
                        spreadsheetId:
                            'spreadsheet-123',

                        credentials: {
                            clientEmail:
                                'test@example.com',

                            privateKey:
                                'private-key',
                        },
                    });

                await client.connect();

                await expect(
                    client.deleteRows(
                        'missing-sheet',
                        () => true,
                    ),
                ).rejects.toMatchObject({
                    name:
                        'GoogleSheetsWorksheetNotFoundError',

                    message:
                        'Worksheet "missing-sheet" not found.',
                });
            },
        );

        test(
            'should throw invalid range error when Google API rejects with invalid range',
            async () =>
            {
                getMock.mockRejectedValue({
                    response: {
                        status: 400,
                    },
                });

                const client =
                    new GoogleSheetsConsume({
                        spreadsheetId:
                            'spreadsheet-123',

                        credentials: {
                            clientEmail:
                                'test@example.com',

                            privateKey:
                                'private-key',
                        },
                    });

                await client.connect();

                await expect(
                    client.getRows(
                        'invalid:range',
                    ),
                ).rejects.toMatchObject({
                    name:
                        'GoogleSheetsInvalidRangeError',
                });

                expect(
                    getMock,
                ).toHaveBeenCalledTimes(1);
            },
        );
    },
);
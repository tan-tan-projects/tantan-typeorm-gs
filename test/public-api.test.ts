import { createGoogleSheetsDataSource, GoogleSheetsConsume } from '../src/index';
import type {
    GoogleSheetsDataSourceOptions,
    GoogleSheetsClient,
    GoogleSheetsRow,
} from '../src/index';

import { describe, expect, test } from 'bun:test';

describe('public API', () =>
{
    test('exports public runtime API', () =>
    {
        expect(createGoogleSheetsDataSource).toBeFunction();
        expect(GoogleSheetsConsume).toBeFunction();
    });

    test('exports public types', () =>
    {
        const client: GoogleSheetsClient =
            {} as GoogleSheetsClient;

        const options:
            GoogleSheetsDataSourceOptions =
            {} as GoogleSheetsDataSourceOptions;

        const row: GoogleSheetsRow =
            {} as GoogleSheetsRow;

        expect(client).toBeDefined();
        expect(options).toBeDefined();
        expect(row).toBeDefined();
    });
});
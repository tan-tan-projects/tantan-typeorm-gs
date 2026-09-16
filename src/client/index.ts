import { google, type sheets_v4 } from "googleapis";
import
{
    DEFAULT_MAX_RETRIES,
    type GoogleSheetsCache,
    type GoogleSheetsClient,
    type GoogleSheetsConsumeOptions,
    type GoogleSheetsRow,
    type GoogleSheetsSheetMetadata
} from "../core/types.js";
import
{
    GoogleSheetsAuthenticationError,
    GoogleSheetsGenaralError,
    GoogleSheetsInvalidRangeError,
    GoogleSheetsSpreadsheetNotFoundError,
    GoogleSheetsWorksheetNotFoundError
} from "../core/error.js";
import { buildWorksheetRange } from "../core/utils.js";
import { GoogleSheetsMemoryCache } from "../core/cache.js";

export class GoogleSheetsConsume implements GoogleSheetsClient 
{
    private readonly spreadsheetId: string;
    private readonly clientEmail: string;
    private readonly privateKey: string;
    private sheets?: sheets_v4.Sheets;
    private readonly cache: GoogleSheetsCache;

    constructor(
        options: GoogleSheetsConsumeOptions,
    )
    {
        this.spreadsheetId = options.spreadsheetId;
        this.clientEmail = options.credentials.clientEmail;
        this.privateKey = options.credentials.privateKey;
        this.cache = options.cache ?? new GoogleSheetsMemoryCache();
    }

    async connect(): Promise<void>
    {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: this.clientEmail,
                private_key: this.privateKey.replace(/\\n/g, '\n'),
            },

            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        this.sheets = google.sheets({ version: 'v4', auth });
    }

    async disconnect(): Promise<void>
    {
        this.sheets = undefined;

        this.cache.clear();
    }

    async hasSheet(sheetName: string): Promise<boolean>
    {
        if (!this.sheets)
        {
            throw new GoogleSheetsGenaralError('Google Sheets client is not connected.');
        }

        const response = await this.sheets.spreadsheets.get({
            spreadsheetId: this.spreadsheetId,
            fields: 'sheets.properties.title',
        });

        return (response.data.sheets?.some((sheet) => sheet.properties?.title === sheetName) ?? false);
    }

    async createSheet(sheetName: string): Promise<void>
    {
        if (!this.sheets)
        {
            throw new GoogleSheetsGenaralError('Google Sheets client is not connected.');
        }

        await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            requestBody: {
                requests: [
                    { addSheet: { properties: { title: sheetName } } },
                ],
            },
        });

        this.cache.invalidateMetadata(sheetName);
        this.cache.invalidateHeaders(sheetName);
        this.cache.invalidateRows(sheetName);
    }

    async getSheetMetadata(sheetName: string): Promise<GoogleSheetsSheetMetadata | null>
    {
        if (!this.sheets)
        {
            throw new GoogleSheetsGenaralError('GoogleSheetsApiClient is not connected.');
        }

        const cachedMetadata = this.cache.getMetadata(sheetName);

        if (cachedMetadata !== undefined) return cachedMetadata;

        const response = await this.sheets.spreadsheets.get({
            spreadsheetId: this.spreadsheetId,
            fields: 'sheets.properties',
        });

        const sheet = response.data.sheets?.find((item) => item.properties?.title === sheetName);

        if (!sheet?.properties?.sheetId || !sheet.properties.title)
        {
            this.cache.setMetadata(sheetName, null);

            return null;
        }

        const metadata: GoogleSheetsSheetMetadata = {
            sheetId: sheet.properties.sheetId,
            title: sheet.properties.title,
        };

        this.cache.setMetadata(sheetName, metadata);

        return metadata;
    }

    async getHeaders(sheetName: string): Promise<string[]>
    {
        if (!this.sheets)
        {
            throw new GoogleSheetsGenaralError('GoogleSheetsApiClient is not connected.');
        }

        const cachedHeaders = this.cache.getHeaders(sheetName);

        if (cachedHeaders) return [...cachedHeaders];

        const response =
            await this.sheets.spreadsheets.values.get({
                spreadsheetId: this.spreadsheetId,
                range: buildWorksheetRange(sheetName, '1:1'),
            });

        const values = response.data.values?.[0] ?? [];

        const headers = values.map((value) => String(value));

        this.cache.setHeaders(sheetName, headers);

        return headers;
    }

    async insertHeaders(sheetName: string, headers: string[]): Promise<void>
    {
        if (!this.sheets)
        {
            throw new GoogleSheetsGenaralError('GoogleSheetsApiClient is not connected.');
        }

        if (headers.length === 0) return;

        await this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: buildWorksheetRange(sheetName, 'A1'),
            valueInputOption: 'RAW',
            requestBody: {
                values: [headers],
            },
        });

        this.cache.invalidateHeaders(sheetName);
        this.cache.invalidateRows(sheetName);
    }

    async renameSheet(oldSheetName: string, newSheetName: string): Promise<void>
    {
        if (!this.sheets)
        {
            throw new GoogleSheetsGenaralError('GoogleSheetsApiClient is not connected.');
        }

        const response = await this.sheets.spreadsheets.get({
            spreadsheetId: this.spreadsheetId,
            fields: 'sheets.properties',
        });

        const sheet = response.data.sheets?.find((item) => item.properties?.title === oldSheetName);

        if (!sheet?.properties?.sheetId) return;

        await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            requestBody: {
                requests: [
                    {
                        updateSheetProperties: {
                            properties: {
                                sheetId: sheet.properties.sheetId,
                                title: newSheetName,
                            },
                            fields: 'title',
                        },
                    },
                ],
            },
        });

        this.cache.invalidateMetadata(oldSheetName);
        this.cache.invalidateHeaders(oldSheetName);
        this.cache.invalidateRows(oldSheetName);

        this.cache.invalidateMetadata(newSheetName);
        this.cache.invalidateHeaders(newSheetName);
        this.cache.invalidateRows(newSheetName);
    }

    async deleteSheet(sheetName: string): Promise<void>
    {
        if (!this.sheets)
        {
            throw new GoogleSheetsGenaralError('GoogleSheetsApiClient is not connected.');
        }

        const response = await this.sheets.spreadsheets.get({
            spreadsheetId: this.spreadsheetId,
            fields: 'sheets.properties',
        });

        const sheet = response.data.sheets?.find((item) => item.properties?.title === sheetName);

        if (!sheet?.properties?.sheetId) return;

        await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            requestBody: {
                requests: [
                    { deleteSheet: { sheetId: sheet.properties.sheetId } },
                ],
            },
        });

        this.cache.invalidateMetadata(sheetName);
        this.cache.invalidateHeaders(sheetName);
        this.cache.invalidateRows(sheetName);
    }

    async getRows(sheetName: string): Promise<GoogleSheetsRow[]>
    {
        if (!this.sheets)
        {
            throw new GoogleSheetsGenaralError('GoogleSheetsApiClient is not connected.');
        }

        const cachedRows = this.cache.getRows(sheetName);
        if (cachedRows) return cachedRows.map(row => ({ ...row }));

        const response =
            await this.withRetry(
                () => this.sheets!.spreadsheets.values.get({
                    spreadsheetId: this.spreadsheetId,
                    range: sheetName,
                }),
            );

        const values = response.data.values ?? [];

        if (values.length === 0)
        {
            this.cache.setRows(sheetName, []);
            return [];
        }

        const headerRow = values[0];

        if (!headerRow)
        {
            this.cache.setRows(sheetName, []);
            return [];
        }

        const headers = headerRow.map((header) => String(header));

        const rows = values.slice(1).map((values) =>
        {
            const row: GoogleSheetsRow = {};

            for (let index = 0; index < headers.length; index++)
            {
                const header = headers[index];

                if (header === undefined) continue;

                row[header] = values[index];
            }

            return row;
        });

        this.cache.setRows(sheetName, rows);

        return rows.map(row => ({ ...row }));
    }

    async insertRows(sheetName: string, rows: GoogleSheetsRow[]): Promise<void>
    {
        if (!this.sheets)
        {
            throw new GoogleSheetsGenaralError('GoogleSheetsApiClient is not connected.');
        }

        if (rows.length === 0) return;

        const headers = await this.getHeaders(sheetName);
        const values = rows.map((row) => headers.map((header) => row[header] ?? ''));

        await this.sheets.spreadsheets.values.append({
            spreadsheetId: this.spreadsheetId,
            range: sheetName,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: {
                values,
            },
        });

        this.cache.invalidateRows(sheetName);
    }

    async updateRows(
        sheetName: string,
        predicate: (
            row: GoogleSheetsRow,
        ) => boolean,
        update: Partial<GoogleSheetsRow>,
    ): Promise<number>
    {
        if (!this.sheets)
        {
            throw new GoogleSheetsGenaralError('GoogleSheetsApiClient is not connected.');
        }

        const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: sheetName,
        });

        const values = response.data.values ?? [];

        if (values.length <= 1) return 0;

        const headerRow = values[0];

        if (!headerRow) return 0;

        const headers = headerRow.map((header) => String(header));
        const matchingRows: { rowNumber: number; values: unknown[]; }[] = [];

        for (let index = 1; index < values.length; index++)
        {
            const valuesRow = values[index];

            if (!valuesRow) continue;

            const row: GoogleSheetsRow = {};

            for (let columnIndex = 0; columnIndex < headers.length; columnIndex++)
            {
                const header = headers[columnIndex];

                if (header === undefined) continue;

                row[header] = valuesRow[columnIndex];
            }

            if (!predicate(row)) continue;

            const updatedRow = { ...row, ...update };

            matchingRows.push({
                rowNumber: index + 1,
                values: headers.map((header) => updatedRow[header] ?? '')
            });

        }


        if (matchingRows.length === 0) return 0;

        let groupStart = matchingRows[0]!;
        let groupValues = [groupStart.values];

        for (let index = 1; index < matchingRows.length; index++)
        {
            const current = matchingRows[index]!;
            const previous = matchingRows[index - 1]!;

            if (current.rowNumber === previous.rowNumber + 1)
            {
                groupValues.push(current.values);

                continue;
            }

            await this.sheets.spreadsheets.values.update({
                spreadsheetId: this.spreadsheetId,
                range: buildWorksheetRange(sheetName, `A${groupStart.rowNumber}`),
                valueInputOption: 'RAW',
                requestBody: {
                    values: groupValues,
                },
            });

            groupStart = current;
            groupValues = [current.values];
        }

        await this.sheets.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: buildWorksheetRange(sheetName, `A${groupStart.rowNumber}`),
            valueInputOption: 'RAW',
            requestBody: {
                values: groupValues,
            },
        });

        this.cache.invalidateRows(sheetName);

        return matchingRows.length;
    }

    async deleteRows(
        sheetName: string,
        predicate: (
            row: GoogleSheetsRow,
        ) => boolean,
    ): Promise<number>
    {
        if (!this.sheets)
        {
            throw new GoogleSheetsGenaralError('GoogleSheetsApiClient is not connected.');
        }

        const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: sheetName,
        });

        const values = response.data.values ?? [];

        if (values.length <= 1) return 0;

        const headerRow = values[0];

        if (!headerRow) return 0;

        const headers = headerRow.map((header) => String(header));
        const rowNumbers: number[] = [];

        for (let index = 1; index < values.length; index++)
        {
            const valuesRow = values[index];

            if (!valuesRow) continue;

            const row: GoogleSheetsRow = {};

            for (let columnIndex = 0; columnIndex < headers.length; columnIndex++)
            {
                const header = headers[columnIndex];

                if (header === undefined) continue;

                row[header] = valuesRow[columnIndex];
            }

            if (predicate(row)) rowNumbers.push(index + 1);
        }

        if (rowNumbers.length === 0) return 0;

        const spreadsheetResponse = await this.sheets.spreadsheets.get({
            spreadsheetId: this.spreadsheetId,
            fields: 'sheets.properties',
        });

        const sheet = spreadsheetResponse.data.sheets?.find((sheet) => sheet.properties?.title === sheetName);
        const sheetId = sheet?.properties?.sheetId;

        if (sheetId === undefined)
        {
            throw new GoogleSheetsWorksheetNotFoundError(`Worksheet "${sheetName}" not found.`);
        }

        await this.sheets.spreadsheets.batchUpdate({
            spreadsheetId: this.spreadsheetId,
            requestBody: {
                requests: rowNumbers.sort((a, b) => b - a).map((rowNumber) => ({
                    deleteDimension: {
                        range: {
                            sheetId,
                            dimension: 'ROWS',
                            startIndex: rowNumber - 1,
                            endIndex: rowNumber,
                        },
                    },
                }),
                ),
            },
        });

        this.cache.invalidateRows(sheetName);

        return rowNumbers.length;
    }

    private async withRetry<T>(operation: () => Promise<T>): Promise<T>
    {
        let lastError: unknown;

        for (let attempt = 0; attempt <= DEFAULT_MAX_RETRIES; attempt++)
        {
            try
            {
                return await operation();
            }
            catch (error)
            {
                lastError = error;

                if (!this.isRetryableError(error) || attempt === DEFAULT_MAX_RETRIES)
                {
                    if (this.isAuthenticationError(error))
                    {
                        throw new GoogleSheetsAuthenticationError('Google Sheets authentication failed.', { cause: error });
                    }

                    if (this.isSpreadsheetNotFoundError(error))
                    {
                        throw new GoogleSheetsSpreadsheetNotFoundError('Google Sheets spreadsheet not found.', { cause: error });
                    }

                    if (this.isInvalidRangeError(error))
                    {
                        throw new GoogleSheetsInvalidRangeError('Google Sheets range is invalid.', { cause: error });
                    }

                    throw error;
                }

                const retryAfter = this.getRetryAfter(error);
                const delay = retryAfter ?? 100 * 2 ** attempt;

                await new Promise<void>((resolve) => setTimeout(resolve, delay));
            }
        }

        throw lastError;
    }

    private getRetryAfter(error: unknown): number | null
    {
        const response = (error as { response?: { headers?: Record<string, unknown> } }).response;
        const value = response?.headers?.['retry-after'];

        if (typeof value !== 'string' && typeof value !== 'number') return null;

        const seconds = Number(value);

        if (!Number.isFinite(seconds) || seconds < 0) return null;

        return seconds * 1000;
    }

    private isRetryableError(error: unknown): boolean
    {
        if (typeof error !== 'object' || error === null) return false;

        const status = 'response' in error && typeof error.response === 'object' && error.response !== null &&
            'status' in error.response
            ? error.response.status
            : undefined;

        return (status === 429 || status === 500 || status === 502 || status === 503 || status === 504);
    }

    private isAuthenticationError(error: unknown): boolean
    {
        if (typeof error !== 'object' || error === null) return false;

        const response = (error as { response?: { status?: unknown } }).response;

        return response?.status === 401;
    }

    private isSpreadsheetNotFoundError(error: unknown): boolean
    {
        if (typeof error !== 'object' || error === null) return false;

        const response = (error as { response?: { status?: unknown } }).response;

        return response?.status === 404;
    }

    private isInvalidRangeError(error: unknown): boolean
    {
        if (typeof error !== 'object' || error === null) return false;

        const response = (error as { response?: { status?: unknown } }).response;

        return response?.status === 400;
    }
}
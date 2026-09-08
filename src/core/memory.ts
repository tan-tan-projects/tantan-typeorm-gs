import type { GoogleSheetsClient, GoogleSheetsRow, GoogleSheetsSheetMetadata } from "./types.js";
import { validateWorksheetName } from "./utils.js";

export class Memory implements GoogleSheetsClient
{
    private readonly sheets = new Map<string, GoogleSheetsRow[]>();

    private readonly headers = new Map<string, string[]>();

    private readonly sheetMetadata = new Map<string, GoogleSheetsSheetMetadata>();

    constructor(
        initialSheets: Record<string, GoogleSheetsRow[]> = {},
    )
    {
        let sheetId = 1;

        for (const [sheetName, rows] of Object.entries(initialSheets))
        {
            this.sheets.set(sheetName, structuredClone(rows));

            this.sheetMetadata.set(sheetName, { sheetId, title: sheetName });

            sheetId++;
        }
    }

    async connect(): Promise<void> { }

    async disconnect(): Promise<void> { }

    async hasSheet(sheetName: string): Promise<boolean>
    {
        return this.sheets.has(sheetName);
    }

    async createSheet(sheetName: string): Promise<void>
    {
        validateWorksheetName(sheetName);

        if (this.sheets.has(sheetName)) return;

        this.sheets.set(sheetName, []);

        this.headers.set(sheetName, []);

        this.sheetMetadata.set(sheetName, { sheetId: this.sheetMetadata.size + 1, title: sheetName });
    }

    async getSheetMetadata(sheetName: string): Promise<GoogleSheetsSheetMetadata | null>
    {
        const metadata = this.sheetMetadata.get(sheetName);

        if (!metadata) return null;

        return structuredClone(metadata);
    }

    async getHeaders(sheetName: string): Promise<string[]>
    {
        return structuredClone(this.headers.get(sheetName) ?? []);
    }

    async insertHeaders(sheetName: string, headers: string[]): Promise<void>
    {
        this.headers.set(sheetName, structuredClone(headers));
    }

    async renameSheet(oldSheetName: string, newSheetName: string): Promise<void>
    {
        validateWorksheetName(newSheetName);

        if (!this.sheets.has(oldSheetName)) return;

        const rows = this.sheets.get(oldSheetName)!;
        const headers = this.headers.get(oldSheetName) ?? [];
        const metadata = this.sheetMetadata.get(oldSheetName);

        this.sheets.delete(oldSheetName);
        this.headers.delete(oldSheetName);
        this.sheetMetadata.delete(oldSheetName);

        this.sheets.set(newSheetName, rows);
        this.headers.set(newSheetName, headers);

        if (metadata) this.sheetMetadata.set(newSheetName, { ...metadata, title: newSheetName });
    }

    async deleteSheet(sheetName: string): Promise<void>
    {
        this.sheets.delete(sheetName);
        this.headers.delete(sheetName);
        this.sheetMetadata.delete(sheetName);
    }

    async getRows(sheetName: string): Promise<GoogleSheetsRow[]>
    {
        return structuredClone(this.sheets.get(sheetName) ?? []);
    }

    async insertRows(sheetName: string, rows: GoogleSheetsRow[]): Promise<void>
    {
        const currentRows = this.sheets.get(sheetName) ?? [];

        currentRows.push(...structuredClone(rows));

        this.sheets.set(sheetName, currentRows);
    }

    async updateRows(sheetName: string, predicate: (row: GoogleSheetsRow) => boolean, update: Partial<GoogleSheetsRow>)
        : Promise<number>
    {
        const rows = this.sheets.get(sheetName) ?? [];

        let affected = 0;

        for (const row of rows)
        {
            if (!predicate(row)) continue;

            Object.assign(row, update);

            affected++;
        }

        return affected;
    }

    async deleteRows(sheetName: string, predicate: (row: GoogleSheetsRow) => boolean): Promise<number>
    {
        const rows = this.sheets.get(sheetName) ?? [];

        const remainingRows: GoogleSheetsRow[] = [];
        let affected = 0;

        for (const row of rows)
        {
            if (predicate(row))
            {
                affected++;

                continue;
            }

            remainingRows.push(row);
        }

        this.sheets.set(sheetName, remainingRows);

        return affected;
    }
}
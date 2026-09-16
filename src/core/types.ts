import type { DataSourceOptions } from "typeorm";

export interface GoogleSheetsDataSourceOptionsBase
{
    type: 'google-sheets';

    entities?: DataSourceOptions['entities'];
    subscribers?: DataSourceOptions['subscribers'];
    migrations?: DataSourceOptions['migrations'];

    synchronize?: boolean;
    migrationsRun?: boolean;
    dropSchema?: boolean;

    logging?: DataSourceOptions['logging'];
    logger?: DataSourceOptions['logger'];

    name?: string;
}

export interface GoogleSheetsCredentials
{
    clientEmail: string;
    privateKey: string;
}

export interface GoogleSheetsConsumeOptions
{
    spreadsheetId: string;
    credentials: GoogleSheetsCredentials;
    cache?: GoogleSheetsCache;
}

export interface GoogleSheetsDataSourceWithClientOptions extends GoogleSheetsDataSourceOptionsBase
{
    client: GoogleSheetsClient;
}

export interface GoogleSheetsDataSourceWithCredentialsOptions extends GoogleSheetsDataSourceOptionsBase
{
    spreadsheetId: string;
    credentials: GoogleSheetsCredentials;
    cache?: GoogleSheetsCache;

    client?: GoogleSheetsClient;
}

export type GoogleSheetsDataSourceOptions =
    | GoogleSheetsDataSourceWithClientOptions
    | GoogleSheetsDataSourceWithCredentialsOptions;

export interface GoogleSheetsClient
{
    connect(): Promise<void>;

    disconnect(): Promise<void>;

    hasSheet(
        sheetName: string,
    ): Promise<boolean>;

    createSheet(sheetName: string): Promise<void>;

    getSheetMetadata(
        sheetName: string,
    ): Promise<GoogleSheetsSheetMetadata | null>;

    getHeaders(
        sheetName: string,
    ): Promise<string[]>;

    insertHeaders(
        sheetName: string,
        headers: string[],
    ): Promise<void>;

    renameSheet(
        oldSheetName: string,
        newSheetName: string,
    ): Promise<void>;

    deleteSheet(
        sheetName: string,
    ): Promise<void>;

    getRows(
        sheetName: string,
    ): Promise<GoogleSheetsRow[]>;

    insertRows(
        sheetName: string,
        rows: GoogleSheetsRow[],
    ): Promise<void>;

    updateRows(
        sheetName: string,
        predicate: (row: GoogleSheetsRow) => boolean,
        update: Partial<GoogleSheetsRow>,
    ): Promise<number>;

    deleteRows(
        sheetName: string,
        predicate: (row: GoogleSheetsRow) => boolean,
    ): Promise<number>;
}

export type GoogleSheetsRow = Record<string, unknown>;

export interface GoogleSheetsSheetMetadata
{
    sheetId: number;
    title: string;
}

export const DEFAULT_MAX_RETRIES = 3;

export interface GoogleSheetsCacheEntry<T>
{
    value: T;
    expiresAt: number;
}

export interface GoogleSheetsMemoryCacheOptions
{
    ttl?: number;
}

export interface GoogleSheetsCache
{
    getRows(sheetName: string): GoogleSheetsRow[] | undefined;
    setRows(sheetName: string, rows: GoogleSheetsRow[]): void;
    invalidateRows(sheetName: string): void;

    getHeaders(sheetName: string): string[] | undefined;
    setHeaders(sheetName: string, headers: string[]): void;
    invalidateHeaders(sheetName: string): void;

    getMetadata(sheetName: string): GoogleSheetsSheetMetadata | null | undefined;
    setMetadata(
        sheetName: string,
        metadata: GoogleSheetsSheetMetadata | null,
    ): void;
    invalidateMetadata(sheetName: string): void;

    clear(): void;
}
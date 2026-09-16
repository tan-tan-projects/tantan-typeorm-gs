import type {
    GoogleSheetsCache,
    GoogleSheetsCacheEntry,
    GoogleSheetsMemoryCacheOptions,
    GoogleSheetsRow,
    GoogleSheetsSheetMetadata
} from "./types.js";

export class GoogleSheetsMemoryCache implements GoogleSheetsCache 
{
    private static readonly DEFAULT_TTL = 60_000;
    private readonly ttl: number;
    private readonly rowsCache = new Map<string, GoogleSheetsCacheEntry<GoogleSheetsRow[]>>();
    private readonly headersCache = new Map<string, GoogleSheetsCacheEntry<string[]>>();

    private readonly metadataCache = new Map<string, GoogleSheetsCacheEntry<GoogleSheetsSheetMetadata | null>>();

    constructor(options: GoogleSheetsMemoryCacheOptions = {})
    {
        this.ttl = options.ttl ?? GoogleSheetsMemoryCache.DEFAULT_TTL;
    }

    private get<T>(cache: Map<string, GoogleSheetsCacheEntry<T>>, key: string): T | undefined
    {
        const entry = cache.get(key);

        if (!entry) return undefined;
        if (entry.expiresAt <= Date.now())
        {
            cache.delete(key);

            return undefined;
        }

        return entry.value;
    }

    private set<T>(cache: Map<string, GoogleSheetsCacheEntry<T>>, key: string, value: T,): void
    {
        cache.set(key, { value, expiresAt: Date.now() + this.ttl });
    }

    getRows(sheetName: string): GoogleSheetsRow[] | undefined
    {
        return this.get(this.rowsCache, sheetName)
    }
    setRows(sheetName: string, rows: GoogleSheetsRow[]): void
    {
        this.set(this.rowsCache, sheetName, rows);
    }
    invalidateRows(sheetName: string): void
    {
        this.rowsCache.delete(sheetName);
    }
    getHeaders(sheetName: string): string[] | undefined
    {
        return this.get(this.headersCache, sheetName);
    }
    setHeaders(sheetName: string, headers: string[]): void
    {
        this.set(this.headersCache, sheetName, headers);
    }
    invalidateHeaders(sheetName: string): void
    {
        this.headersCache.delete(sheetName);
    }
    getMetadata(sheetName: string): GoogleSheetsSheetMetadata | null | undefined
    {
        return this.get(this.metadataCache, sheetName);
    }
    setMetadata(sheetName: string, metadata: GoogleSheetsSheetMetadata | null): void
    {
        this.set(this.metadataCache, sheetName, metadata);
    }
    invalidateMetadata(sheetName: string): void
    {
        this.metadataCache.delete(sheetName);
    }
    clear(): void
    {
        this.rowsCache.clear();
        this.headersCache.clear();
        this.metadataCache.clear();
    }
}
import { DataSource, type DataSourceOptions } from "typeorm";
import { DriverFactory } from "typeorm/driver/DriverFactory.js";
import type { GoogleSheetsClient, GoogleSheetsDataSourceOptions } from "./types.js";
import { GoogleSheetsSpreadsheetNotFoundError } from "./error.js";
import { GoogleSheetsConsume } from "../client/index.js";
import { GoogleSheetsDriver } from "./driver.js";
import { GoogleSheetsMemoryCache } from "./cache.js";

export function createGoogleSheetsDataSource(options: GoogleSheetsDataSourceOptions): DataSource
{
    let client: GoogleSheetsClient;

    if (options.client !== undefined) client = options.client;
    else
    {
        if (!('spreadsheetId' in options) || !('credentials' in options))
        {
            throw new GoogleSheetsSpreadsheetNotFoundError(
                'spreadsheetId and credentials are required when client is not provided.',
            );
        }

        client = new GoogleSheetsConsume({
            spreadsheetId: options.spreadsheetId,
            credentials: options.credentials,
            cache: options.cache ?? new GoogleSheetsMemoryCache()
        });
    }

    const originalCreate = DriverFactory.prototype.create;

    DriverFactory.prototype.create = function (dataSource)
    {
        const type = dataSource.options.type as string;

        if (type === 'google-sheets') return new GoogleSheetsDriver(dataSource, client);

        return originalCreate.call(this, dataSource);
    };

    try
    {
        return new DataSource(options as unknown as DataSourceOptions);
    }
    finally
    {
        DriverFactory.prototype.create = originalCreate;
    }
}
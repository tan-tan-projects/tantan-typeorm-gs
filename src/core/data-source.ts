import { DataSource, type DataSourceOptions } from "typeorm";
import { DriverFactory } from "typeorm/driver/DriverFactory.js";
import { EntityMetadataValidator } from "typeorm/metadata-builder/EntityMetadataValidator.js";
import { ConnectionMetadataBuilder } from "typeorm/connection/ConnectionMetadataBuilder.js";
import { EntityMetadata } from "typeorm/metadata/EntityMetadata.js";
import { ObjectUtils } from "typeorm/util/ObjectUtils.js";
import type { GoogleSheetsClient, GoogleSheetsDataSourceOptions } from "./types.js";
import { GoogleSheetsSpreadsheetNotFoundError } from "./error.js";
import { GoogleSheetsConsume } from "../client/index.js";
import { GoogleSheetsDriver } from "./driver.js";
import { GoogleSheetsMemoryCache } from "./cache.js";


class GoogleSheetsDataSource extends DataSource
{
    protected override async buildMetadatas(): Promise<void>
    {
        const connectionMetadataBuilder = new ConnectionMetadataBuilder(this);
        const entityMetadataValidator = new EntityMetadataValidator();
        const flattenedSubscribers = ObjectUtils.mixedListToArray(this.options.subscribers ?? []);
        const subscribers = await connectionMetadataBuilder.buildSubscribers(flattenedSubscribers);

        ObjectUtils.assign(this, { subscribers });

        // --------------------------------------------------
        // Build Entity Metadata
        // --------------------------------------------------

        const flattenedEntities = ObjectUtils.mixedListToArray(this.options.entities ?? []);
        const entityMetadatas = await connectionMetadataBuilder.buildEntityMetadatas(flattenedEntities);


        // --------------------------------------------------
        // Google Sheets metadata fix
        // --------------------------------------------------

        this.fixNullableObjectColumns(entityMetadatas);

        ObjectUtils.assign(this, {
            entityMetadatas,
            entityMetadatasMap: new Map(entityMetadatas.map((metadata) => [metadata.target, metadata])),
        });


        // --------------------------------------------------
        // Migrations
        // --------------------------------------------------

        const flattenedMigrations = ObjectUtils.mixedListToArray(this.options.migrations ?? []);
        const migrations = await connectionMetadataBuilder.buildMigrations(flattenedMigrations);
        ObjectUtils.assign(this, { migrations });


        // --------------------------------------------------
        // Validate
        // --------------------------------------------------

        entityMetadataValidator.validateMany(
            this.entityMetadatas.filter((metadata) => metadata.tableType !== "view"),
            this.driver,
        );


        // --------------------------------------------------
        // BaseEntity
        // --------------------------------------------------

        for (const entityMetadata of entityMetadatas)
        {
            if (typeof entityMetadata.target === "function" && "useDataSource" in entityMetadata.target &&
                typeof entityMetadata.target.useDataSource === "function"
            )
            {
                entityMetadata.target.useDataSource(this);
            }
        }
    }


    private fixNullableObjectColumns(entityMetadatas: EntityMetadata[]): void
    {
        for (const entityMetadata of entityMetadatas)
        {
            if (typeof entityMetadata.target !== "function") continue;

            for (const column of entityMetadata.columns)
            {
                if ((column.type as unknown) !== Object) continue;

                const propertyType = Reflect.getMetadata(
                    "design:type",
                    entityMetadata.target.prototype,
                    column.propertyName,
                );

                if (propertyType === Date) column.type = Date;
            }
        }
    }
}


export function createGoogleSheetsDataSource(options: GoogleSheetsDataSourceOptions): DataSource
{
    let client: GoogleSheetsClient;

    if (options.client !== undefined) client = options.client;
    else
    {
        if (!("spreadsheetId" in options) || !("credentials" in options))
        {
            throw new GoogleSheetsSpreadsheetNotFoundError(
                "spreadsheetId and credentials are required when client is not provided.",
            );
        }

        client = new GoogleSheetsConsume({
            spreadsheetId: options.spreadsheetId,
            credentials: options.credentials,
            cache: options.cache ?? new GoogleSheetsMemoryCache(),
        });
    }


    const originalCreate = DriverFactory.prototype.create;

    DriverFactory.prototype.create = function (dataSource)
    {
        const type = dataSource.options.type as string;

        if (type === "google-sheets") return new GoogleSheetsDriver(dataSource, client);

        return originalCreate.call(this, dataSource);
    };


    try
    {
        return new GoogleSheetsDataSource(options as unknown as DataSourceOptions);
    }
    finally
    {
        DriverFactory.prototype.create = originalCreate;
    }
}
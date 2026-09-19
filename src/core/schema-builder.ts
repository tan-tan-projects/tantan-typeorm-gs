import type { DataSource } from "typeorm";
import type { SqlInMemory } from "typeorm/driver/SqlInMemory.js";
import type { SchemaBuilder } from "typeorm/schema-builder/SchemaBuilder.js";
import type { GoogleSheetsDriver } from "./driver.js";

export class GoogleSheetsSchemaBuilder implements SchemaBuilder
{
    constructor(
        private readonly connection: DataSource,
        private readonly driver: GoogleSheetsDriver
    ) { }

    async build(): Promise<void>
    {
        const metadatas = this.connection.entityMetadatas;

        for (const metadata of metadatas)
        {
            if (!metadata.synchronize) continue;

            const sheetName = this.driver.buildTableName(
                metadata.tableName,
                metadata.schema,
                metadata.database,
            );

            const exists = await this.driver.client.hasSheet(sheetName);

            if (!exists)
            {
                await this.driver.client.createSheet(sheetName);

                this.connection.logger.logSchemaBuild(`Created sheet "${sheetName}"`);

                const headers = metadata.columns.map((column) => column.databaseName);

                await this.driver.client.insertHeaders(sheetName, headers);

                this.connection.logger.logSchemaBuild(`Created columns for "${sheetName}": ${headers.join(', ')}`);

                continue;
            }

            const existingHeaders = await this.driver.client.getHeaders(sheetName);

            const metadataHeaders = metadata.columns.map((column) => column.databaseName);

            const missingHeaders = metadataHeaders.filter((header) => !existingHeaders.includes(header));

            if (missingHeaders.length === 0) continue;

            await this.driver.client.insertHeaders(sheetName, [...existingHeaders, ...missingHeaders]);

            this.connection.logger.logSchemaBuild(`Added columns to "${sheetName}": ${missingHeaders.join(', ')}`);
        }
    }

    log(): Promise<SqlInMemory>
    {
        throw new Error("Method not implemented.");
    }

}
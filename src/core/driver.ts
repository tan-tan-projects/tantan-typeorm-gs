import type {
    ColumnType,
    DataSource,
    Driver,
    EntityMetadata,
    ObjectLiteral,
    QueryRunner,
    ReplicationMode,
    Table,
    TableColumn,
    TableForeignKey,
    View
} from "typeorm";
import type { CteCapabilities } from "typeorm/driver/types/CteCapabilities.js";
import type { DataTypeDefaults } from "typeorm/driver/types/DataTypeDefaults.js";
import type { IsolationLevel } from "typeorm/driver/types/IsolationLevel.js";
import type { MappedColumnTypes } from "typeorm/driver/types/MappedColumnTypes.js";
import type { UpsertType } from "typeorm/driver/types/UpsertType.js";
import type { SchemaBuilder } from "typeorm/schema-builder/SchemaBuilder.js";
import type { ColumnMetadata } from "typeorm/metadata/ColumnMetadata.js";
import type { ReturningType } from "typeorm/driver/types/ReturningType.js";
import type { GoogleSheetsClient } from "./types.js";
import { GoogleSheetsSchemaBuilder } from "./schema-builder.js";
import { GoogleSheetsInvalidMetadataError } from "./error.js";
import { GoogleSheetsQueryRunner } from "./query/runner.js";

export class GoogleSheetsDriver implements Driver
{
    constructor(
        public readonly dataSource: DataSource,
        public readonly client: GoogleSheetsClient,
    ) { }

    version = '1.0';
    database = undefined;
    schema = undefined;
    isReplicated = false;
    treeSupport = false;
    transactionSupport = 'none' as const;
    supportedDataTypes: ColumnType[] = [
        'string',
        'number',
        'boolean',
        'date',
        'uuid',
        'int',
        'enum'
    ];
    supportedIsolationLevels: readonly IsolationLevel[] = [];
    supportedUpsertTypes: UpsertType[] = [];
    supportedOnDeleteTypes = [];
    supportedOnUpdateTypes = [];
    dataTypeDefaults: DataTypeDefaults = {};
    spatialTypes: ColumnType[] = [];
    withLengthColumnTypes: ColumnType[] = [];
    withPrecisionColumnTypes: ColumnType[] = [];
    withScaleColumnTypes: ColumnType[] = [];
    mappedDataTypes: MappedColumnTypes = {
        createDate: Date,
        createDateDefault: 'CURRENT_TIMESTAMP',
        updateDate: Date,
        updateDateDefault: 'CURRENT_TIMESTAMP',
        deleteDate: Date,
        deleteDateNullable: true,
        version: Number,
        treeLevel: Number,
        migrationId: Number,
        migrationTimestamp: Number,
        migrationName: String,
        cacheId: Number,
        cacheIdentifier: String,
        cacheTime: Number,
        cacheDuration: Number,
        cacheQuery: String,
        cacheResult: String,
        metadataType: String,
        metadataDatabase: String,
        metadataSchema: String,
        metadataTable: String,
        metadataName: String,
        metadataValue: String,
    };
    parametersPrefix = '@';
    maxAliasLength = 255;
    cteCapabilities: CteCapabilities = {
        enabled: false,
        requiresRecursiveHint: false,
    };
    dummyTableName = 'dual';

    get options()
    {
        return this.dataSource.options;
    }

    async connect(): Promise<void>
    {
        await this.client.connect();
    }

    async afterConnect(): Promise<void> { }

    async disconnect(): Promise<void>
    {
        await this.client.disconnect();
    }

    createSchemaBuilder(): SchemaBuilder
    {
        return new GoogleSheetsSchemaBuilder(this.dataSource, this);
    }

    createQueryRunner(mode: ReplicationMode): QueryRunner
    {
        return new GoogleSheetsQueryRunner(this, mode);
    }

    escapeQueryWithParameters(sql: string, parameters: ObjectLiteral): [string, any[]]
    {
        const values: any[] = [];

        const escapedSql =
            sql.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_match, parameterName: string) =>
            {
                const index = values.length;

                values.push(parameters[parameterName],
                );

                return `:orm_param_${index}`;
            },
            );

        return [escapedSql, values];
    }

    escape(name: string): string
    {
        return `"${name.replaceAll('"', '""')}"`;
    }

    buildTableName(tableName: string, schema?: string, database?: string): string
    {
        return tableName;
    }

    parseTableName(target: EntityMetadata | Table | View | TableForeignKey | string)
        : { tableName: string; schema?: string; database?: string; }
    {
        if (typeof target === 'string') return { tableName: target };
        if ('tableName' in target && target.tableName) return { tableName: target.tableName };
        if ('name' in target && typeof target.name === 'string') return { tableName: target.name };

        throw new GoogleSheetsInvalidMetadataError('Unable to parse table name.');
    }

    preparePersistentValue(value: any, column: ColumnMetadata)
    {
        if (value === null || value === undefined) return value;
        if (column.type === Date || column.type === 'date')
        {
            if (value instanceof Date) return value.toISOString();

            return value;
        }
        if (column.type === Number || column.type === 'number' || column.type === 'int') return Number(value);
        if (column.type === Boolean || column.type === 'boolean') return Boolean(value);

        return value;
    }

    prepareHydratedValue(value: any, column: ColumnMetadata)
    {
        if (value === null || value === undefined) return value;
        if (column.type === Date || column.type === 'date')
        {
            if (value instanceof Date) return value;

            const date = new Date(value);

            if (!Number.isNaN(date.getTime())) return date;

            return value;
        }
        if (column.type === Number || column.type === 'number' || column.type === 'int') return Number(value);
        if (column.type === Boolean || column.type === 'boolean')
        {
            if (typeof value === 'boolean') return value;

            if (typeof value === 'string') return value.toUpperCase() === 'TRUE';

            return Boolean(value);
        }

        if ((column.type as unknown) === Object)
        {
            const metadata = column as ColumnMetadata & { propertyType?: unknown; };

            if (metadata.propertyType === String || metadata.propertyType === 'string')
            {
                return String(value);
            }

            if (metadata.propertyType === Number || metadata.propertyType === 'number')
            {
                return Number(value);
            }

            if (metadata.propertyType === Boolean || metadata.propertyType === 'boolean')
            {
                if (typeof value === 'boolean') return value;

                if (typeof value === 'string')
                {
                    return value.toUpperCase() === 'TRUE';
                }

                return Boolean(value);
            }

            if (metadata.propertyType === Date || metadata.propertyType === 'date')
            {
                if (value instanceof Date) return value;

                const date = new Date(value);

                if (!Number.isNaN(date.getTime()))
                {
                    return date;
                }
            }

            return value;
        }

        return value;
    }

    normalizeType(column: {
        type?: ColumnType | string;
        length?: number | string;
        precision?: number | null;
        scale?: number;
        isArray?: boolean;
    }): string
    {
        if (column.type === String || column.type === 'string') return 'string';
        if (column.type === Number || column.type === 'number') return 'number';
        if (column.type === 'int') return 'int';
        if (column.type === Boolean || column.type === 'boolean') return 'boolean';
        if (column.type === Date || column.type === 'date') return 'date';
        if (column.type === 'uuid') return 'uuid';
        if (column.type === 'enum') return 'enum';

        return String(column.type ?? 'string');
    }

    normalizeDefault(columnMetadata: ColumnMetadata): string | undefined
    {
        if (columnMetadata.default === undefined) return undefined;

        return String(columnMetadata.default);
    }

    normalizeIsUnique(column: ColumnMetadata): boolean
    {
        return false;
    }

    getColumnLength(column: ColumnMetadata): string
    {
        return '';
    }

    createFullType(column: TableColumn): string
    {
        return column.type;
    }

    async obtainMasterConnection(): Promise<any>
    {
        return this.client
    }

    async obtainSlaveConnection(): Promise<any>
    {
        return this.client
    }

    createGeneratedMap(metadata: EntityMetadata, insertResult: any, entityIndex?: number, entityNum?: number)
        : ObjectLiteral | undefined
    {
        if (!insertResult) return undefined;

        const generatedMap: ObjectLiteral = {};

        for (const column of metadata.generatedColumns)
        {
            const value = insertResult[column.databaseName];

            if (value !== undefined) generatedMap[column.propertyName] = value;
        }

        return generatedMap;
    }

    findChangedColumns(tableColumns: TableColumn[], columnMetadatas: ColumnMetadata[]): ColumnMetadata[]
    {
        return []
    }

    isReturningSqlSupported(returningType: ReturningType): boolean
    {
        return false
    }

    isUUIDGenerationSupported(): boolean
    {
        return true
    }

    isFullTextColumnTypeSupported(): boolean
    {
        return false
    }

    createParameter(parameterName: string, index: number): string
    {
        return `:${parameterName}`;
    }
}
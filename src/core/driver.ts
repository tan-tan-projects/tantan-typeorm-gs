import
{
    DateUtils,
    type ColumnType,
    type DataSource,
    type Driver,
    type EntityMetadata,
    type ObjectLiteral,
    type QueryRunner,
    type ReplicationMode,
    type Table,
    type TableColumn,
    type TableForeignKey,
    type View
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
import { ApplyValueTransformers } from "typeorm/browser/util/ApplyValueTransformers.js";

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
        // Numeric
        "int",
        "integer",
        "tinyint",
        "smallint",
        "mediumint",
        "bigint",
        "unsigned big int",
        "int2",
        "int8",

        "real",
        "double",
        "double precision",
        "float",
        "numeric",
        "decimal",

        // String
        "character",
        "varchar",
        "varying character",
        "nchar",
        "native character",
        "nvarchar",
        "text",
        "clob",

        // Boolean
        "boolean",

        // Date / time
        "date",
        "time",
        "datetime",

        // JSON
        "json",
        "jsonb",

        // TypeORM special types
        "simple-array",
        "simple-json",
        "simple-enum",

        // Generic TypeORM types
        "string",
        "number",
        "boolean",
        "uuid",
        "enum",
    ];
    supportedIsolationLevels: readonly IsolationLevel[] = [];
    supportedUpsertTypes: UpsertType[] = [];
    supportedOnDeleteTypes = [];
    supportedOnUpdateTypes = [];
    dataTypeDefaults: DataTypeDefaults = {};
    spatialTypes: ColumnType[] = [];
    withLengthColumnTypes: ColumnType[] = [
        "character",
        "varchar",
        "varying character",
        "nchar",
        "native character",
        "nvarchar",
        "text",
        "clob",
    ];
    withPrecisionColumnTypes: ColumnType[] = [
        "real",
        "double",
        "double precision",
        "float",
        "numeric",
        "decimal",
        "date",
        "time",
        "datetime",
    ];
    withScaleColumnTypes: ColumnType[] = [
        "real",
        "double",
        "double precision",
        "float",
        "numeric",
        "decimal",
    ];
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

    preparePersistentValue(value: any, columnMetadata: ColumnMetadata): any
    {
        if (columnMetadata.transformer)
            value = ApplyValueTransformers.transformTo(
                columnMetadata.transformer,
                value,
            )

        if (value === null || value === undefined) return value

        if (columnMetadata.type === Boolean || columnMetadata.type === "boolean")
        {
            if (typeof value === "boolean") return value ? "TRUE" : "FALSE"
            if (typeof value === "number") return value !== 0 ? "TRUE" : "FALSE"
            if (typeof value === "string")
            {
                const normalized = value.trim().toLowerCase()

                return (normalized === "true" || normalized === "1") ? "TRUE" : "FALSE"
            }

            return value ? "TRUE" : "FALSE"
        }
        if (columnMetadata.type === "date") return DateUtils.mixedDateToDateString(value, { utc: columnMetadata.utc })
        if (columnMetadata.type === "time") return DateUtils.mixedDateToTimeString(value)
        if (columnMetadata.type === "datetime" || columnMetadata.type === Date)
        {
            return DateUtils.mixedDateToUtcDatetimeString(value)
        }

        if (columnMetadata.type === "json" || columnMetadata.type === "jsonb" || columnMetadata.type === "simple-json")
        {
            return DateUtils.simpleJsonToString(value)
        }
        if (columnMetadata.type === "simple-array") return DateUtils.simpleArrayToString(value)
        if (columnMetadata.type === "simple-enum") return DateUtils.simpleEnumToString(value)

        return value
    }

    prepareHydratedValue(value: any, columnMetadata: ColumnMetadata): any
    {
        if (value === null || value === undefined)
        {
            return columnMetadata.transformer
                ? ApplyValueTransformers.transformFrom(columnMetadata.transformer, value)
                : value
        }

        if (columnMetadata.type === Boolean || columnMetadata.type === "boolean")
        {
            if (typeof value === "boolean") value = value
            else if (typeof value === "number") value = value !== 0
            else if (typeof value === "string")
            {
                const normalized = value.trim().toLowerCase()

                value = normalized === "true" || normalized === "1"
            }
            else value = Boolean(value)
        }
        if (columnMetadata.type === "datetime" || columnMetadata.type === Date)
        {
            if (value && typeof value === "string")
            {
                if (/^\d\d\d\d-\d\d-\d\d \d\d:\d\d/.test(value)) value = value.replace(" ", "T")
                if (/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d(:\d\d(\.\d\d\d)?)?$/.test(value)) value += "Z"
            }

            value = DateUtils.normalizeHydratedDate(value)
        }
        if (columnMetadata.type === "date") value = DateUtils.mixedDateToDateString(value, { utc: columnMetadata.utc })
        if (columnMetadata.type === "time") value = DateUtils.mixedTimeToString(value)

        if (columnMetadata.type === "json" || columnMetadata.type === "jsonb" || columnMetadata.type === "simple-json")
        {
            value = DateUtils.stringToSimpleJson(value)
        }

        if (columnMetadata.type === "simple-array") value = DateUtils.stringToSimpleArray(value)
        if (columnMetadata.type === "simple-enum") value = DateUtils.stringToSimpleEnum(value, columnMetadata)
        if (columnMetadata.type === Number)
        {
            const numeric = Number(value)
            if (!Number.isNaN(numeric)) value = numeric
        }
        if (columnMetadata.transformer) value = ApplyValueTransformers.transformFrom(columnMetadata.transformer, value)

        return value
    }

    normalizeType(column: {
        type?: ColumnType
        length?: number | string
        precision?: number | null
        scale?: number
    }): string
    {
        if (column.type === Number || column.type === "int") return "integer"
        if (column.type === String) return "varchar"
        if (column.type === Date) return "datetime"
        if (column.type === Boolean) return "boolean"
        if (column.type === "uuid") return "varchar"
        if (column.type === "simple-array") return "text"
        if (column.type === "simple-json") return "text"
        if (column.type === "simple-enum") return "varchar"
        return (column.type as string) || ""
    }

    normalizeDefault(columnMetadata: ColumnMetadata): string | undefined
    {
        const defaultValue = columnMetadata.default

        if (defaultValue === null || defaultValue === undefined) return undefined
        if (typeof defaultValue === "number") return "" + defaultValue
        if (typeof defaultValue === "boolean") return defaultValue ? "1" : "0"
        if (typeof defaultValue === "function") return defaultValue()
        if (typeof defaultValue === "string") return `'${defaultValue}'`
        if (Array.isArray(defaultValue) && columnMetadata.type === "simple-enum") return `'${defaultValue.join(",")}'`
        if (typeof defaultValue === "object")
        {
            const jsonString = JSON.stringify(defaultValue).replaceAll("'", "''")

            if (columnMetadata.type === "jsonb") return `jsonb('${jsonString}')`
            return `'${jsonString}'`
        }

        return `${defaultValue}`
    }

    normalizeIsUnique(column: ColumnMetadata): boolean
    {
        return column.entityMetadata.uniques.some(
            (uq) => uq.columns.length === 1 && uq.columns[0] === column,
        )
    }

    getColumnLength(column: ColumnMetadata): string
    {
        return column.length ? column.length.toString() : ""
    }

    createFullType(column: TableColumn): string
    {
        let type = column.type
        if (column.enum) return "varchar"
        if (column.length) type += "(" + column.length + ")"

        if (
            column.precision !== null &&
            column.precision !== undefined &&
            column.scale !== null &&
            column.scale !== undefined
        )
        {
            type += "(" + column.precision + "," + column.scale + ")"
        }

        if (column.precision !== null && column.precision !== undefined) type += "(" + column.precision + ")"
        if (column.isArray) type += " array"

        return type
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
import type {
    ObjectLiteral,
    ReplicationMode,
    Table, TableCheck,
    TableColumn,
    TableExclusion,
    TableForeignKey,
    TableIndex,
    TableUnique,
    View
} from "typeorm";
import { BaseQueryRunner } from "typeorm/query-runner/BaseQueryRunner.js";
import { Broadcaster } from "typeorm/subscriber/Broadcaster.js";
import type { IsolationLevel } from "typeorm/driver/types/IsolationLevel.js";
import type { ReadStream } from "typeorm/platform/PlatformTools.js";
import type { GoogleSheetsDriver } from "../driver.js";
import { GoogleSheetsQueryInterpreter } from "./interpreter.js";
import
{
    GoogleSheetsDuplicatePrimaryKeyError,
    GoogleSheetsGenaralError,
    GoogleSheetsMissingPrimaryKeyError,
    GoogleSheetsParseError,
    GoogleSheetsUnsupportedOperationError
} from "../error.js";
import type { JoinCondition, JoinedRow, JoinOperand, JoinQuery } from "./types.js";
import type { GoogleSheetsRow } from "../types.js";

export class GoogleSheetsQueryRunner extends BaseQueryRunner
{
    private readonly interpreter = new GoogleSheetsQueryInterpreter();
    private distinctParameterValues = new Map<string, unknown[]>();

    constructor(
        private readonly driver: GoogleSheetsDriver,
        mode: ReplicationMode,
    )
    {
        super();

        this.driver = driver;
        this.dataSource = driver.dataSource;
        this.broadcaster = new Broadcaster(this);
        this.mode = mode;
    }

    protected async loadTables(_tablePaths?: string[]): Promise<Table[]>
    {
        return [];
    }

    protected async loadViews(_tablePaths?: string[]): Promise<View[]>
    {
        return [];
    }

    async connect(): Promise<any>
    {
        await this.driver.connect();

        return this.driver.client;
    }

    async release(): Promise<void>
    {
        if (this.isReleased) return;

        this.isReleased = true;
    }

    async query(query: string, parameters?: any[] | ObjectLiteral, useStructuredResult?: boolean): Promise<any>
    {
        try
        {
            if (this.isReleased) throw new GoogleSheetsGenaralError('QueryRunner already released.')

            this.driver.dataSource.logger.logQuery(query, parameters, this);

            const normalizedQuery = query.trim().toUpperCase();

            if (normalizedQuery.startsWith('INSERT INTO')) return this.executeInsert(query, parameters, useStructuredResult);
            if (normalizedQuery.startsWith('UPDATE')) return this.executeUpdate(query, parameters, useStructuredResult);
            if (normalizedQuery.startsWith('DELETE FROM')) return this.executeDelete(query, parameters, useStructuredResult);
            if (/\bWHERE\s+EXISTS\s*\(/i.test(query)) return this.executeExists(query, parameters, useStructuredResult);
            if (/^SELECT\s+DISTINCT\s+"distinctAlias"\./i.test(query.trim()))
            {
                return this.executeDistinctPagination(query, parameters, useStructuredResult);
            }

            const from = this.interpreter.parseFrom(query);
            const rows = await this.driver.client.getRows(from.table);
            const joins = this.interpreter.parseJoins(query);

            let joinedRows: JoinedRow[];

            if (joins.length > 0) joinedRows = await this.executeJoins(rows, from.alias, joins, parameters);
            else joinedRows = rows.map((row) => ({ [from.alias]: row }));

            /**
             * WHERE
             */

            const where = this.interpreter.parseWhereExpression(query);

            let filteredRows = joinedRows;

            if (where)
            {
                filteredRows = joinedRows.filter((row) => this.interpreter.evaluateWhereExpression(where,
                    (tableAlias, column) =>
                    {
                        const value = row[tableAlias]?.[column];

                        const metadata = this.getEntityMetadata(tableAlias === from.alias ? from.table : tableAlias);
                        const columnMetadata = metadata?.columns.find((item) => item.databaseName === column);

                        if (!columnMetadata) return value;

                        return this.driver.prepareHydratedValue(value, columnMetadata);
                    },
                    (parameterName) =>
                    {
                        /**
                         * SQL numeric literal:
                         *
                         * IN (1)
                         * IN (10)
                         * IN (-1)
                         * IN (1.5)
                         */

                        if (/^-?\d+(?:\.\d+)?$/.test(parameterName)) return Number(parameterName);

                        /**
                         * SQL string literal:
                         *
                         * IN ('Basuni')
                         */

                        if (/^'.*'$/.test(parameterName)) return parameterName.slice(1, -1);

                        /**
                         * ORM parameter:
                         *
                         * :orm_param_0
                         */

                        const spreadParameterMatch = parameterName.match(/^:?\.\.\.(.+)$/);

                        if (spreadParameterMatch?.[1])
                        {
                            const values = this.distinctParameterValues.get(spreadParameterMatch[1]);

                            if (values !== undefined) return values;
                        }

                        const parameterIndex = Number(parameterName.match(/\d+$/)?.[0] ?? -1);

                        if (Array.isArray(parameters)) return parameters[parameterIndex];

                        /**
                         * Named parameters.
                         */

                        if (parameters && typeof parameters === 'object')
                        {
                            const parameterNameWithoutPrefix = parameterName.replace(/^:/, '');

                            return parameters[parameterNameWithoutPrefix];
                        }

                        return undefined;
                    })
                );
            }

            /**
             * AGGREGATE
             */
            const aggregates = this.interpreter.parseAggregates(query);

            if (aggregates.length > 0)
            {
                const record: Record<string, unknown> = {};

                for (const aggregate of aggregates)
                {
                    record[aggregate.alias] = this.interpreter.evaluateAggregate(filteredRows, aggregate);
                }

                const result = {
                    raw: [record],
                    records: [record],
                    affected: undefined,
                };

                if (useStructuredResult) return result;

                return result.raw;
            }

            /**
             * SELECT
             */

            const columns = this.interpreter.parseSelectColumns(query);

            let records = filteredRows
                .map(
                    (row) =>
                    {
                        const record: Record<string, unknown> = {};

                        for (const column of columns)
                        {
                            /**
                             * Literal:
                             *
                             * 1 AS "count"
                             */
                            if (/^\d+$/.test(column.column))
                            {
                                record[column.alias] = Number(column.column);

                                continue;
                            }

                            record[column.alias] = row[column.tableAlias]?.[column.column];
                        }

                        return record;
                    },
                );

            /**
             * ORDER BY
             */
            const orderBy = this.interpreter.parseOrderBy(query);

            if (orderBy.length > 0)
            {
                records.sort((left, right) =>
                {
                    for (const order of orderBy)
                    {
                        const key = `${order.tableAlias}_${order.column}`;
                        const leftValue = left[key];
                        const rightValue = right[key];

                        if (leftValue === rightValue) continue;
                        if (leftValue === undefined || leftValue === null) return order.direction === 'ASC' ? -1 : 1;
                        if (rightValue === undefined || rightValue === null) return order.direction === 'ASC' ? 1 : -1;

                        const comparison = leftValue < rightValue ? -1 : 1;

                        return order.direction === 'ASC' ? comparison : -comparison;
                    }

                    return 0;
                });
            }

            /**
             * LIMIT / OFFSET
             */
            const pagination = this.interpreter.parsePagination(query);

            if (pagination.offset !== undefined) records = records.slice(pagination.offset);
            if (pagination.limit !== undefined) records = records.slice(0, pagination.limit);

            const result = {
                raw: records,
                records,
                affected: undefined,
            };

            if (useStructuredResult) return result;

            return result.raw;
        } catch (error)
        {
            this.driver.dataSource.logger.logQueryError(
                error instanceof Error ? error : String(error),
                query,
                parameters,
                this,
            );

            throw error;
        }
    }

    private extractSheetName(sql: string): string
    {
        const match = sql.match(/(?:FROM|INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+"([^"]+)"/i);

        if (!match)
        {
            throw new GoogleSheetsGenaralError(`Unable to determine Google Sheets worksheet from query: ${sql}`)
        }

        return match[1]!;
    }

    private getEntityMetadata(tableName: string)
    {
        return this.connection.entityMetadatas.find(
            (metadata) => metadata.tableName === tableName || metadata.name === tableName
        );
    }

    private resolveParameter(value: string, parameters?: any[] | Record<string, any>): unknown
    {
        const parameterMatch = value.match(/^:(.+)$/);

        if (!parameterMatch?.[1]) throw new GoogleSheetsGenaralError(`Unsupported parameter value: ${value}`);

        const parameterName = parameterMatch[1];

        if (Array.isArray(parameters))
        {
            const parameterIndex = parameterName.match(/^orm_param_(\d+)$/);

            if (!parameterIndex?.[1]) throw new GoogleSheetsGenaralError(`Unable to resolve parameter: ${value}`);

            return parameters[Number(parameterIndex[1])];
        }

        if (parameters) return parameters[parameterName];

        return undefined;
    }

    private async assignIncrementGeneratedIds(sheetName: string, rows: GoogleSheetsRow[], columnName: string)
        : Promise<void>
    {
        const existingRows = await this.driver.client.getRows(sheetName);

        let nextId = existingRows.reduce((max, currentRow) =>
        {
            const value = Number(currentRow[columnName]);

            return Number.isFinite(value) ? Math.max(max, value) : max;
        }, 0) + 1;

        for (const row of rows) row[columnName] = nextId++;
    }

    private assignUuidGeneratedIds(rows: GoogleSheetsRow[], columnName: string): void
    {
        for (const row of rows) row[columnName] = crypto.randomUUID();
    }

    private async executeInsert(query: string, parameters?: any[] | Record<string, any>, useStructuredResult = false)
        : Promise<any>
    {
        const sheetName = this.extractSheetName(query);

        const insert = this.interpreter.parseInsertQuery(query);

        const rows: Record<string, unknown>[] = [];

        for (const values of insert.values)
        {
            const row: Record<string, unknown> = {};

            for (let index = 0; index < insert.columns.length; index++)
            {
                const column = insert.columns[index];
                const value = values[index];

                if (column === undefined || value === undefined)
                {
                    throw new GoogleSheetsGenaralError('INSERT columns and values are inconsistent.');
                }

                if (value.trim().toUpperCase() === 'DEFAULT')
                {
                    row[column] = undefined;

                    continue;
                }

                row[column] = this.resolveParameter(value, parameters);
            }

            rows.push(row);
        }

        const metadata = this.getEntityMetadata(sheetName);

        if (metadata)
        {
            const now = new Date();

            for (const row of rows)
            {
                // Resolve generated/default values first.
                for (const column of metadata.columns)
                {
                    if (row[column.databaseName] !== undefined) continue;

                    if (column.isCreateDate || column.isUpdateDate)
                    {
                        row[column.databaseName] = now;
                        continue;
                    }

                    if (column.default !== undefined)
                    {
                        row[column.databaseName] = typeof column.default === 'function'
                            ? column.default()
                            : column.default;
                    }
                }

                // Validate column constraints.
                for (const column of metadata.columns)
                {
                    const value = row[column.databaseName];

                    if (value !== undefined && value !== null) continue;

                    if (column.isPrimary && !column.isGenerated)
                    {
                        throw new GoogleSheetsMissingPrimaryKeyError();
                    }

                    if (column.isGenerated) continue;

                    if (column.isNullable) continue;

                    throw new GoogleSheetsGenaralError(`Column "${column.databaseName}" cannot be null.`);
                }
            }
        }

        const generatedColumn = metadata?.columns.find((column) => column.isPrimary && column.isGenerated);

        const explicitPrimaryKeyRows = generatedColumn
            ? rows.filter((row) => row[generatedColumn.databaseName] !== undefined)
            : [];

        if (generatedColumn)
        {
            const generationStrategy = generatedColumn.generationStrategy as
                | 'increment'
                | 'uuid'
                | 'identity'
                | 'rowid'
                | undefined;

            switch (generationStrategy)
            {
                case 'increment':
                    {
                        const generatedRows = rows.filter((row) => !explicitPrimaryKeyRows.includes(row));

                        await this.assignIncrementGeneratedIds(sheetName, generatedRows, generatedColumn.databaseName);

                        break;
                    }

                case 'uuid':
                    {
                        const generatedRows = rows.filter((row) => !explicitPrimaryKeyRows.includes(row));

                        this.assignUuidGeneratedIds(generatedRows, generatedColumn.databaseName);

                        break;
                    }

                case 'identity':
                    throw new GoogleSheetsGenaralError(
                        'PrimaryGeneratedColumn("identity") is not supported by Google Sheets driver.'
                    );

                case 'rowid':
                    throw new GoogleSheetsGenaralError(
                        'PrimaryGeneratedColumn("rowid") is not supported by Google Sheets driver.'
                    );

                default:
                    throw new GoogleSheetsGenaralError(
                        `Unsupported generation strategy: ${String(generatedColumn.generationStrategy)}`
                    );
            }
        }

        if (explicitPrimaryKeyRows.length > 0)
        {
            const existingRows = await this.driver.client.getRows(sheetName);

            for (const row of explicitPrimaryKeyRows)
            {
                const duplicate =
                    existingRows.some(
                        (existingRow) => existingRow[generatedColumn!.databaseName] === row[generatedColumn!.databaseName]
                    );

                if (duplicate)
                {
                    throw new GoogleSheetsDuplicatePrimaryKeyError();
                }
            }
        }

        await this.driver.client.insertRows(sheetName, rows);

        const result = {
            raw: rows,
            records: rows,
            affected: rows.length,
        };

        if (useStructuredResult) return result;

        return result.raw;
    }

    private async executeUpdate(query: string, parameters?: any[] | Record<string, any>, useStructuredResult = false)
        : Promise<any>
    {
        const update = this.interpreter.parseUpdateQuery(query);

        const updateValues: Record<string, any> = {};

        for (const assignment of update.assignments)
        {
            if (assignment.value.toUpperCase() === 'CURRENT_TIMESTAMP')
            {
                updateValues[assignment.column] = new Date();

                continue;
            }

            if (assignment.value.toUpperCase() === 'NULL')
            {
                updateValues[assignment.column] = null;

                continue;
            }

            updateValues[assignment.column] = this.resolveParameter(assignment.value, parameters);
        }


        const affected = await this.driver.client.updateRows(update.table, (row) =>
        {
            const result = this.interpreter.evaluateWhereExpression(
                update.where,
                (_tableAlias, column) => row[column],
                (parameter) => this.resolveParameter(parameter, parameters)
            );

            return result;
        },
            updateValues,
        );

        const result = {
            raw: [],
            records: [],
            affected,
        };

        if (useStructuredResult) return result;

        return result.raw;
    }

    private async executeDelete(query: string, parameters?: any[] | Record<string, any>, useStructuredResult = false)
        : Promise<any>
    {
        const deletion = this.interpreter.parseDeleteQuery(query);

        const affected = await this.driver.client.deleteRows(deletion.table,
            (row) =>
                this.interpreter.evaluateWhereExpression(deletion.where,
                    (_tableAlias, column) => row[column],
                    (parameter) => this.resolveParameter(parameter, parameters)
                ),
        );

        const result = {
            raw: [],
            records: [],
            affected,
        };

        if (useStructuredResult) return result;

        return result.raw;
    }

    private async executeExists(query: string, parameters?: any[] | Record<string, any>, useStructuredResult = false)
        : Promise<any>
    {
        const existsMatch = query.match(
            /WHERE\s+EXISTS\s*\(\s*SELECT\s+1\s+FROM\s+"([^"]+)"\s+"([^"]+)"\s+WHERE\s+\(\((.+?)\)\)\s*\)\s+LIMIT\s+1/i,
        );

        if (!existsMatch?.[1] || !existsMatch[2] || !existsMatch[3])
        {
            throw new GoogleSheetsGenaralError(`Unable to parse EXISTS query: ${query}`);
        }

        const sheetName = existsMatch[1];
        const alias = existsMatch[2];
        const whereQuery = existsMatch[3];

        const rows = await this.driver.client.getRows(sheetName);

        const where = this.interpreter.parseWhereExpression(`SELECT * FROM "${sheetName}" "${alias}" WHERE ${whereQuery}`);

        if (!where) throw new GoogleSheetsParseError(`Unable to parse EXISTS WHERE expression: ${whereQuery}`)

        const exists = rows.some((row) =>
            this.interpreter.evaluateWhereExpression(where,
                (column) => row[column],
                (parameterName) =>
                {
                    const parameterIndex = Number(parameterName.match(/\d+$/)?.[0] ?? -1);

                    return Array.isArray(parameters) ? parameters[parameterIndex] : undefined;
                })
        );

        const records = exists ? [{ row_exists: 1 }] : [];

        const result = {
            raw: records,
            records,
            affected: undefined,
        };

        if (useStructuredResult) return result;

        return result.raw;
    }

    private async executeJoins(
        baseRows: GoogleSheetsRow[],
        baseAlias: string,
        joins: JoinQuery[],
        parameters?: any[] | Record<string, any>,
    ): Promise<JoinedRow[]>
    {
        let joinedRows: JoinedRow[] = baseRows.map((row) => ({ [baseAlias]: row }));

        for (const join of joins)
        {
            const joinedData = await this.driver.client.getRows(join.table);

            joinedRows = joinedRows.flatMap((joinedRow) =>
            {
                const matches = joinedData.filter(
                    (candidate) => join.conditions.every(
                        (condition) => this.evaluateJoinCondition(condition, joinedRow, candidate, join.alias, parameters)
                    ),
                );

                if (matches.length === 0)
                {
                    if (join.type === 'LEFT') return [{ ...joinedRow, [join.alias]: undefined }];

                    return [];
                }

                return matches.map((candidate) => ({ ...joinedRow, [join.alias]: candidate }));
            });
        }

        return joinedRows;
    }

    private evaluateJoinCondition(
        condition: JoinCondition,
        joinedRow: JoinedRow,
        candidate: GoogleSheetsRow,
        joinedAlias: string,
        parameters?: any[] | Record<string, any>,
    ): boolean
    {
        const resolveOperand = (operand: JoinOperand): unknown =>
        {
            if (operand.type === 'parameter') return this.resolveParameter(operand.value, parameters);
            if (operand.tableAlias === joinedAlias) return candidate[operand.column];

            return joinedRow[operand.tableAlias]?.[operand.column];
        };

        const left = resolveOperand(condition.left);

        if (condition.operator === 'IS NULL') return left === null || left === undefined;

        if (condition.operator === 'IS NOT NULL') return left !== null && left !== undefined;

        const right = resolveOperand(condition.right!);

        return left === right;
    }

    private async executeDistinctPagination(
        query: string, parameters?: any[] | Record<string, any>, useStructuredResult = false)
        : Promise<any>
    {
        /**
         * Extract inner query:
         *
         * FROM (
         *     SELECT ...
         * ) "distinctAlias"
         */

        const subqueryMatch = query.match(/\bFROM\s*\((SELECT[\s\S]+)\)\s+"distinctAlias"/i);

        if (!subqueryMatch?.[1]) throw new GoogleSheetsParseError('Unable to parse DISTINCT pagination subquery.');

        const innerQuery = subqueryMatch[1];

        /**
         * Execute inner query normally.
         *
         * Example result:
         *
         * [
         *     {
         *         user_id: 1,
         *         user_name: 'Basuni',
         *         post_id: 1,
         *     },
         *     {
         *         user_id: 1,
         *         user_name: 'Basuni',
         *         post_id: 2,
         *     },
         *     {
         *         user_id: 2,
         *         user_name: 'Budi',
         *         post_id: 3,
         *     },
         * ]
         */

        const innerResult = await this.query(innerQuery, parameters, true);
        const innerRows = innerResult.records as Record<string, unknown>[];

        /**
         * Parse outer SELECT.
         *
         * Example:
         *
         * SELECT DISTINCT
         *     "distinctAlias"."user_id" AS "ids_user_id",
         *     "distinctAlias"."user_id",
         *     "distinctAlias"."post_id"
         */

        const selectMatch = query.match(/^SELECT\s+DISTINCT\s+([\s\S]+?)\s+FROM\s*\(/i);

        if (!selectMatch?.[1]) throw new GoogleSheetsParseError('Unable to parse DISTINCT pagination SELECT.');

        const selectExpressions = selectMatch[1].split(',').map((expression) => expression.trim());

        /**
         * Parse selected columns.
         */

        const selectedColumns = selectExpressions.map((expression) =>
        {
            const match = expression.match(/^"distinctAlias"\."([^"]+)"(?:\s+AS\s+"([^"]+)")?$/i);

            if (!match?.[1])
            {
                throw new GoogleSheetsParseError(`Unable to parse DISTINCT pagination expression: ${expression}`);
            }

            return {
                column: match[1],
                alias: match[2] ?? match[1],
            };
        });

        /**
         * TypeORM names the primary ID column:
         *
         * ids_<column>
         *
         * Example:
         *
         * user_id
         * ↓
         * ids_user_id
         *
         * Find the entity ID column from the outer SELECT.
         */

        const primaryColumn = selectedColumns.find((selected) => selected.alias.startsWith('ids_'));

        if (!primaryColumn) throw new GoogleSheetsParseError('Unable to determine DISTINCT pagination primary column.');

        const from = this.interpreter.parseFrom(query);

        const metadata = this.getEntityMetadata(from.table);

        const primaryColumnMetadata =
            metadata?.columns.find(
                (column) => column.databaseName === primaryColumn.column.replace(`${from.alias}_`, ''),
            );

        /**
         * Convert inner rows into outer SELECT records.
         *
         * Example:
         *
         * inner row:
         *
         * {
         *     user_id: 1,
         *     post_id: 1
         * }
         *
         * becomes:
         *
         * {
         *     ids_user_id: 1,
         *     user_id: 1,
         *     post_id: 1
         * }
         */

        const records = innerRows.map((row) =>
        {
            const record: Record<string, unknown> = {};

            for (const selected of selectedColumns) record[selected.alias] = row[selected.column];

            return record;
        });

        /**
         * DISTINCT by primary/entity ID.
         *
         * IMPORTANT:
         *
         * Do NOT use the whole record here.
         *
         * With:
         *
         * user  post
         * 1      1
         * 1      2
         * 2      3
         *
         * DISTINCT must produce:
         *
         * 1
         * 2
         *
         * rather than treating:
         *
         * (1, 1)
         * (1, 2)
         *
         * as two separate entities.
         */

        const distinctRecords: Record<string, unknown>[] = [];
        const seen = new Set<string>();

        for (const record of records)
        {
            const primaryValue = record[primaryColumn.alias];
            const key = JSON.stringify(primaryValue);

            if (seen.has(key)) continue;

            seen.add(key);
            distinctRecords.push(record);
        }

        const distinctValues = distinctRecords.map(
            (record) =>
            {
                const value = record[primaryColumn.alias];

                if (!primaryColumnMetadata) return value;

                return this.driver.prepareHydratedValue(value, primaryColumnMetadata);
            },
        );

        this.distinctParameterValues.set('orm_distinct_ids', distinctValues);

        /**
         * ORDER BY
         *
         * Example:
         *
         * ORDER BY
         *     "distinctAlias"."user_id" ASC,
         *     "distinctAlias"."post_id" ASC,
         *     "user_id" ASC
         */

        const orderByMatch = query.match(/\bORDER\s+BY\s+([\s\S]+?)(?:\s+LIMIT\s+\d+|\s+OFFSET\s+\d+|$)/i);

        if (orderByMatch?.[1])
        {
            const expressions = orderByMatch[1].split(',').map((expression) => expression.trim());

            distinctRecords.sort((left, right) =>
            {
                for (const expression of expressions)
                {
                    /**
                     * Qualified:
                     *
                     * "distinctAlias"."user_id" ASC
                     */

                    const qualifiedMatch = expression.match(/^"distinctAlias"\."([^"]+)"(?:\s+(ASC|DESC))?$/i);

                    /**
                     * Unqualified:
                     *
                     * "user_id" ASC
                     */

                    const unqualifiedMatch = expression.match(/^"([^"]+)"(?:\s+(ASC|DESC))?$/i);
                    const column = qualifiedMatch?.[1] ?? unqualifiedMatch?.[1];

                    if (!column) continue;

                    const direction = (qualifiedMatch?.[2] ?? unqualifiedMatch?.[2] ?? 'ASC').toUpperCase();

                    /**
                     * Outer SELECT may have either:
                     *
                     * user_id
                     *
                     * or:
                     *
                     * ids_user_id
                     */

                    const leftValue = left[column] ?? left[`ids_${column}`];
                    const rightValue = right[column] ?? right[`ids_${column}`];

                    if (leftValue === rightValue) continue;
                    if (leftValue === undefined || leftValue === null) return direction === 'ASC' ? -1 : 1;
                    if (rightValue === undefined || rightValue === null) return direction === 'ASC' ? 1 : -1;

                    const comparison = leftValue < rightValue ? -1 : 1;

                    return direction === 'ASC' ? comparison : -comparison;
                }

                return 0;
            });
        }

        /**
         * OFFSET
         */

        const offsetMatch = query.match(/\bOFFSET\s+(\d+)/i);

        if (offsetMatch?.[1]) distinctRecords.splice(0, Number(offsetMatch[1]));

        /**
         * LIMIT
         */

        const limitMatch = query.match(/\bLIMIT\s+(\d+)/i);

        if (limitMatch?.[1]) distinctRecords.splice(Number(limitMatch[1]));

        const result = {
            raw: distinctRecords,
            records: distinctRecords,
            affected: undefined,
        };

        if (useStructuredResult) return result;

        return result.raw;
    }

    async stream(_query: string, parameters?: any[], _onEnd?: Function, _onError?: Function): Promise<ReadStream>
    {
        return this.unsupported('stream')
    }

    async startTransaction(_isolationLevel?: IsolationLevel): Promise<void>
    {
        return this.unsupported('transactions')
    }

    async commitTransaction(): Promise<void>
    {
        return this.unsupported('transactions')
    }

    async rollbackTransaction(): Promise<void>
    {
        return this.unsupported('transactions')
    }

    async clearDatabase(_database?: string): Promise<void>
    {
        return this.unsupported('clear-database')
    }

    async getDatabases(): Promise<string[]>
    {
        return [];
    }

    async getSchemas(_database?: string): Promise<string[]>
    {
        return [];
    }

    async hasDatabase(_database: string): Promise<boolean>
    {
        return false;
    }

    async getCurrentDatabase(): Promise<string | undefined>
    {
        return undefined;
    }

    async hasSchema(_schema: string): Promise<boolean>
    {
        return false;
    }

    async getCurrentSchema(): Promise<string | undefined>
    {
        return undefined;
    }

    async hasTable(_table: Table | string): Promise<boolean>
    {
        return false;
    }

    async hasColumn(_table: Table | string, _columnName: string): Promise<boolean>
    {
        return false;
    }

    async createDatabase(_database: string, _ifNotExists?: boolean): Promise<void>
    {
        return this.unsupported('create-database');
    }

    async dropDatabase(_database: string, _ifExists?: boolean): Promise<void>
    {
        return this.unsupported('drop-databse');
    }

    async createSchema(_schemaPath: string, _ifNotExists?: boolean): Promise<void>
    {
        return this.unsupported('create-schema');
    }

    async dropSchema(
        _schemaPath: string,
        _ifExists?: boolean,
        _isCascade?: boolean,
    ): Promise<void>
    {
        return this.unsupported('drop-schema');
    }

    async createTable(
        _table: Table,
        _ifNotExists?: boolean,
        _createForeignKeys?: boolean,
        _createIndices?: boolean,
    ): Promise<void>
    {
        return this.unsupported('create-table');
    }

    async dropTable(_table: Table | string, _ifExists?: boolean, _dropForeignKeys?: boolean, _dropIndices?: boolean)
        : Promise<void>
    {
        return this.unsupported('drop-table');
    }

    async createView(_view: View, _syncWithMetadata?: boolean, _oldView?: View): Promise<void>
    {
        return this.unsupported('create-view');
    }

    async dropView(_view: View | string, _ifExists?: boolean): Promise<void>
    {
        return this.unsupported('drop-view');
    }

    async renameTable(_oldTableOrName: Table | string, _newTableName: string): Promise<void>
    {
        return this.unsupported('rename-table');
    }

    async changeTableComment(_tableOrName: Table | string, _comment?: string): Promise<void>
    {
        return this.unsupported('change=table-comment');
    }

    async addColumn(_table: Table | string, _column: TableColumn): Promise<void>
    {
        return this.unsupported('add-column');
    }

    async addColumns(_table: Table | string, _columns: TableColumn[]): Promise<void>
    {
        return this.unsupported('add-columns');
    }

    async renameColumn(_table: Table | string, _oldColumnOrName: TableColumn | string, _newColumnOrName: TableColumn | string)
        : Promise<void>
    {
        return this.unsupported('rename-column');
    }

    async changeColumn(_table: Table | string, _oldColumn: TableColumn | string, _newColumn: TableColumn): Promise<void>
    {
        return this.unsupported('change-column');
    }

    async changeColumns(_table: Table | string, _changedColumns: { oldColumn: TableColumn; newColumn: TableColumn; }[])
        : Promise<void>
    {
        return this.unsupported('change-columns');
    }

    async dropColumn(_table: Table | string, _column: TableColumn | string, _ifExists?: boolean): Promise<void>
    {
        return this.unsupported('drop-column');
    }

    async dropColumns(_table: Table | string, _columns: TableColumn[] | string[], _ifExists?: boolean): Promise<void>
    {
        return this.unsupported('drop-columns');
    }

    async createPrimaryKey(_table: Table | string, _columnNames: string[], _constraintName?: string): Promise<void>
    {
        return this.unsupported('create=primary-key');
    }

    async updatePrimaryKeys(_table: Table | string, _columns: TableColumn[]): Promise<void>
    {
        return this.unsupported('update-primary-keys');
    }

    async dropPrimaryKey(_table: Table | string, _constraintName?: string, _ifExists?: boolean): Promise<void>
    {
        return this.unsupported('drop=-pimary-key');
    }

    async createUniqueConstraint(_table: Table | string, _uniqueConstraint: TableUnique): Promise<void>
    {
        return this.unsupported('create-unique-constraint');
    }

    async createUniqueConstraints(_table: Table | string, _uniqueConstraints: TableUnique[]): Promise<void>
    {
        return this.unsupported('createunique-constraints');
    }

    async dropUniqueConstraint(_table: Table | string, _uniqueOrName: TableUnique | string, _ifExists?: boolean)
        : Promise<void>
    {
        return this.unsupported('drop-unique-constraint');
    }

    async dropUniqueConstraints(_table: Table | string, _uniqueConstraints: TableUnique[], _ifExists?: boolean,)
        : Promise<void>
    {
        return this.unsupported('drop-unique-constraints');
    }

    async createCheckConstraint(_table: Table | string, _checkConstraint: TableCheck): Promise<void>
    {
        return this.unsupported('create-check-constraint');
    }

    async createCheckConstraints(_table: Table | string, _checkConstraints: TableCheck[]): Promise<void>
    {
        return this.unsupported('create-check-constraints');
    }

    async dropCheckConstraint(_table: Table | string, _checkOrName: TableCheck | string, _ifExists?: boolean)
        : Promise<void>
    {
        return this.unsupported('drop-check-constraint');
    }

    async dropCheckConstraints(_table: Table | string, _checkConstraints: TableCheck[], _ifExists?: boolean)
        : Promise<void>
    {
        return this.unsupported('drop-check-constraints');
    }

    async createExclusionConstraint(_table: Table | string, _exclusionConstraint: TableExclusion): Promise<void>
    {
        return this.unsupported('create-exclusion-constraint');
    }

    async createExclusionConstraints(_table: Table | string, _exclusionConstraints: TableExclusion[]): Promise<void>
    {
        return this.unsupported('create-exclusion-constraints');
    }

    async dropExclusionConstraint(_table: Table | string, _exclusionOrName: TableExclusion | string, _ifExists?: boolean)
        : Promise<void>
    {
        return this.unsupported('drop-exclusion-constraint');
    }

    async dropExclusionConstraints(_table: Table | string, _exclusionConstraints: TableExclusion[], _ifExists?: boolean)
        : Promise<void>
    {
        return this.unsupported('drop-exclusion-constraints');
    }

    async createForeignKey(_table: Table | string, _foreignKey: TableForeignKey): Promise<void>
    {
        return this.unsupported('create-foreign-key');
    }

    async createForeignKeys(_table: Table | string, _foreignKeys: TableForeignKey[]): Promise<void>
    {
        return this.unsupported('create-foreign-keys');
    }

    async dropForeignKey(_table: Table | string, _foreignKeyOrName: TableForeignKey | string, _ifExists?: boolean)
        : Promise<void>
    {
        return this.unsupported('drop-foreign-key');
    }

    async dropForeignKeys(_table: Table | string, _foreignKeys: TableForeignKey[], _ifExists?: boolean): Promise<void>
    {
        return this.unsupported('drop-foreign-keys');
    }

    async createIndex(_table: Table | string, _index: TableIndex): Promise<void>
    {
        return this.unsupported('create-index');
    }

    async createIndices(_table: Table | string, _indices: TableIndex[]): Promise<void>
    {
        return this.unsupported('create-indeices');
    }

    async dropIndex(_table: Table | string, _index: TableIndex | string, _ifExists?: boolean): Promise<void>
    {
        return this.unsupported('drop-index');
    }

    async dropIndices(_table: Table | string, _indices: TableIndex[], _ifExists?: boolean): Promise<void>
    {
        return this.unsupported('drop-indices');
    }

    async clearTable(_tableName: string, _options?: { cascade?: boolean }): Promise<void>
    {
        return this.unsupported('clear-table');
    }

    private unsupported(operation: string): never
    {
        throw new GoogleSheetsUnsupportedOperationError(operation);
    }
}
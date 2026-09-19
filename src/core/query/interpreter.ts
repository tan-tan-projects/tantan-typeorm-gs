import type {
    AggregateColumn,
    AggregateFunction,
    DeleteQuery,
    FromQuery,
    InsertQuery,
    JoinCondition,
    JoinQuery,
    JoinType,
    OrderBy,
    OrderDirection,
    Pagination,
    SelectColumn,
    UpdateQuery,
    WhereExpression,
    WhereOperator
} from "./types.js";
import { GoogleSheetsParseError, GoogleSheetsUnsupportedOperationError } from "../error.js";

export class GoogleSheetsQueryInterpreter
{
    parseInsertQuery(query: string): InsertQuery
    {
        const match = query.match(/^INSERT\s+INTO\s+"([^"]+)"\s*\((.+?)\)\s*VALUES\s*(.+)$/i);

        if (!match?.[1] || !match[2] || !match[3])
        {
            throw new GoogleSheetsParseError(`Unable to parse INSERT query: ${query}`);
        }

        const columns = match[2].split(',').map((column) => column.trim().replace(/^"|"$/g, ''));
        const valuesPart = match[3].trim();
        const rows: string[][] = [];

        for (const rowMatch of valuesPart.matchAll(/\(([^()]*)\)/g))
        {
            const row = rowMatch[1];

            if (row === undefined) continue;

            rows.push(row.split(',').map((value) => value.trim()));
        }

        if (rows.length === 0) throw new GoogleSheetsParseError(`Unable to parse INSERT query: ${query}`);

        for (const values of rows)
        {
            if (columns.length !== values.length)
            {
                throw new GoogleSheetsParseError('INSERT columns and values count do not match.')
            }
        }

        return { columns, values: rows };
    }

    parseUpdateQuery(query: string): UpdateQuery
    {
        const match = query.match(/^UPDATE\s+"([^"]+)"\s+SET\s+(.+?)\s+WHERE\s+([\s\S]+)$/i);

        if (!match?.[1] || !match[2] || !match[3])
        {
            throw new GoogleSheetsParseError(`Unable to parse UPDATE query: ${query}`)
        }

        const assignments =
            match[2]
                .split(',')
                .map(
                    (assignment) =>
                    {
                        const assignmentMatch =
                            assignment
                                .match(/^\s*"([^"]+)"\s*=\s*(CURRENT_TIMESTAMP|NULL|:[a-zA-Z_][a-zA-Z0-9_]*)\s*$/i);

                        if (!assignmentMatch?.[1] || !assignmentMatch[2])
                        {
                            throw new GoogleSheetsParseError(`Unable to parse UPDATE assignment: ${assignment}`)
                        }

                        return { column: assignmentMatch[1], value: assignmentMatch[2] };
                    },
                );

        return {
            table: match[1],
            assignments,
            where: this.parseWhereExpressionPart(match[3].trim()),
        };
    }

    parseDeleteQuery(query: string): DeleteQuery
    {
        const match = query.match(/^DELETE\s+FROM\s+"([^"]+)"\s+WHERE\s+([\s\S]+)$/i);

        if (!match?.[1] || !match[2]) throw new GoogleSheetsParseError(`Unable to parse DELETE query: ${query}`)

        return { table: match[1], where: this.parseWhereExpressionPart(match[2].trim()) };
    }

    parseSelectColumns(query: string): SelectColumn[]
    {
        const selectMatch = query.match(/^SELECT\s+(.+?)\s+FROM\s+/i);

        if (!selectMatch?.[1]) throw new GoogleSheetsParseError('Unable to parse SELECT clause.')

        const selectColumns = selectMatch[1]
            .split(',')
            .map(
                (expression) =>
                {
                    const normalizedExpression = expression.trim();

                    /**
                     * Literal:
                     *
                     * 1 AS "count"
                     */
                    const literalMatch = normalizedExpression.match(/^(\d+)\s+AS\s+"([^"]+)"$/i);

                    if (literalMatch?.[1] && literalMatch[2])
                    {
                        return {
                            tableAlias: '',
                            column: literalMatch[1],
                            alias: literalMatch[2],
                        };
                    }

                    /**
                     * COUNT(DISTINCT(...))
                     *
                     * Example:
                     *
                     * COUNT(DISTINCT("Projects"."id" || '|;|' || "Projects"."title"))
                     * AS "cnt"
                     */

                    const countDistinctMatch =
                        normalizedExpression.match(
                            /^COUNT\s*\(\s*DISTINCT\s*\(([\s\S]+)\)\s*\)\s+AS\s+"([^"]+)"$/i,
                        );

                    if (countDistinctMatch?.[1] && countDistinctMatch[2])
                    {
                        return {
                            tableAlias: '',
                            column: countDistinctMatch[1],
                            alias: countDistinctMatch[2],
                            aggregate: 'COUNT' as SelectColumn['aggregate'],
                            distinct: true,
                        };
                    }

                    /**
                     * Aggregate:
                     *
                     * COUNT(*)
                     * COUNT("product"."category")
                     * SUM("product"."price")
                     * AVG("product"."price")
                     * MIN("product"."price")
                     * MAX("product"."price")
                     *
                     * AS "alias"
                     */
                    const aggregateMatch =
                        normalizedExpression.match(
                            /^(COUNT|SUM|AVG|MIN|MAX)\s*\(\s*(\*|"[^"]+"\."[^"]+")\s*\)\s+AS\s+"([^"]+)"$/i,
                        );

                    if (aggregateMatch?.[1] && aggregateMatch[2] && aggregateMatch[3])
                    {
                        let tableAlias = '';

                        const argumentMatch = aggregateMatch[2].match(/^"([^"]+)"\."([^"]+)"$/i);

                        if (argumentMatch?.[1]) tableAlias = argumentMatch[1];

                        return {
                            tableAlias,
                            column: aggregateMatch[2],
                            alias: aggregateMatch[3],
                            aggregate: aggregateMatch[1].toUpperCase() as SelectColumn['aggregate'],
                        };
                    }

                    /**
                     * DISTINCT column without alias:
                     *
                     * DISTINCT "distinctAlias"."user_id"
                     */

                    const distinctMatch = normalizedExpression.match(/^DISTINCT\s+"([^"]+)"\."([^"]+)"$/i);

                    if (distinctMatch?.[1] && distinctMatch[2])
                    {
                        return {
                            tableAlias: distinctMatch[1],
                            column: distinctMatch[2],
                            alias: distinctMatch[2],
                        };
                    }

                    /**
                     * Column without alias:
                     *
                     * "distinctAlias"."user_id"
                     */

                    const columnMatch = normalizedExpression.match(/^"([^"]+)"\."([^"]+)"$/i);

                    if (columnMatch?.[1] && columnMatch[2])
                    {
                        return {
                            tableAlias: columnMatch[1],
                            column: columnMatch[2],
                            alias: columnMatch[2],
                        };
                    }

                    /**
                     * Normal column:
                     *
                     * "product"."id" AS "id"
                     *
                     * DISTINCT "product"."id" AS "id"
                     */

                    const match = normalizedExpression.match(/^(?:DISTINCT\s+)?"([^"]+)"\."([^"]+)"\s+AS\s+"([^"]+)"$/i);

                    if (!match?.[1] || !match[2] || !match[3])
                    {
                        throw new GoogleSheetsParseError(`Unable to parse SELECT expression: ${expression}`)
                    }

                    return {
                        tableAlias: match[1],
                        column: match[2],
                        alias: match[3],
                    };
                },
            );

        return selectColumns
    }

    parseFrom(query: string): FromQuery
    {
        const match = query.match(/\bFROM\s+"([^"]+)"\s+"([^"]+)"/i);

        if (!match?.[1] || !match[2]) throw new GoogleSheetsParseError(`Unable to parse FROM clause: ${query}`)

        return { table: match[1], alias: match[2] };
    }

    parseJoins(query: string): JoinQuery[]
    {
        const joins: JoinQuery[] = [];

        const regex =
            /\b(LEFT|INNER)\s+JOIN\s+"([^"]+)"\s+"([^"]+)"\s+ON\s+([\s\S]*?)(?=\s+(?:LEFT|INNER)\s+JOIN\b|\s+WHERE\b|\s+ORDER\s+BY\b|\s+LIMIT\b|\s+OFFSET\b|$)/gi;

        let match: RegExpExecArray | null;

        while ((match = regex.exec(query)) !== null)
        {
            const [, type, table, alias, onExpression] = match;

            if (!type || !table || !alias || !onExpression) continue;

            const conditions = this.parseJoinConditions(onExpression);

            if (conditions.length === 0) continue;

            joins.push({
                type: type.toUpperCase() as JoinType,
                table,
                alias,
                conditions,
            });
        }

        return joins;
    }

    private parseJoinConditions(expression: string): JoinCondition[]
    {
        let normalized = expression.trim();

        /**
         * Remove wrapping parentheses.
         *
         * (
         *   "a"."x" = :param
         *   AND
         *   "a"."y" = "b"."y"
         * )
         */
        while (normalized.startsWith('(') && normalized.endsWith(')'))
        {
            normalized = normalized.slice(1, -1).trim();
        }

        const parts = normalized.split(/\s+AND\s+/i);
        const conditions: JoinCondition[] = [];

        for (const part of parts)
        {
            const condition = part.trim();

            /**
             * Column = Column
             *
             * "a"."x" = "b"."y"
             */

            const columnMatch = condition.match(/^"([^"]+)"\."([^"]+)"\s*=\s*"([^"]+)"\."([^"]+)"$/i);

            if (columnMatch?.[1] && columnMatch[2] && columnMatch[3] && columnMatch[4])
            {
                conditions.push({
                    left: {
                        type: 'column',
                        tableAlias: columnMatch[1],
                        column: columnMatch[2],
                    },
                    operator: '=',
                    right: {
                        type: 'column',
                        tableAlias: columnMatch[3],
                        column: columnMatch[4],
                    },
                });

                continue;
            }

            /**
             * Column = Parameter
             *
             * "a"."x" = :orm_param_0
             */
            const parameterMatch = condition.match(/^"([^"]+)"\."([^"]+)"\s*=\s*(:[a-zA-Z_][a-zA-Z0-9_]*)$/i);

            if (parameterMatch?.[1] && parameterMatch[2] && parameterMatch[3])
            {
                conditions.push({
                    left: {
                        type: 'column',
                        tableAlias: parameterMatch[1],
                        column: parameterMatch[2],
                    },
                    operator: '=',
                    right: {
                        type: 'parameter',
                        value: parameterMatch[3],
                    },
                });

                continue;
            }

            /**
            * Column IS NULL
            *
            * ("a"."deletedAt" IS NULL)
            */
            const nullMatch =
                condition.match(
                    /^\("([^"]+)"\."([^"]+)"\s+IS\s+(NOT\s+)?NULL\)$/i,
                );

            if (nullMatch?.[1] && nullMatch[2])
            {
                conditions.push({
                    left: {
                        type: 'column',
                        tableAlias: nullMatch[1],
                        column: nullMatch[2],
                    },
                    operator: nullMatch[3]
                        ? 'IS NOT NULL'
                        : 'IS NULL',
                });

                continue;
            }


            throw new GoogleSheetsParseError(`Unable to parse JOIN condition: ${condition}`)
        }

        return conditions;
    }

    parseAggregate(query: string): AggregateColumn | undefined
    {
        const match =
            query.match(/^SELECT\s+(COUNT|SUM|AVG|MIN|MAX)\s*\(\s*([^)]+)\s*\)\s+AS\s+"([^"]+)"\s+FROM\s+/i);

        if (!match?.[1] || !match[2] || !match[3]) return undefined;

        return {
            function: match[1].toUpperCase() as AggregateFunction,
            argument: match[2].trim(),
            alias: match[3],
        };
    }

    parseAggregates(query: string): AggregateColumn[]
    {
        const selectMatch = query.match(/^SELECT\s+(.+?)\s+FROM\s+/i);

        if (!selectMatch?.[1]) return [];

        const expressions = selectMatch[1].split(',').map((expression) => expression.trim());

        const aggregates: AggregateColumn[] = [];

        for (const expression of expressions)
        {
            /**
         * COUNT(DISTINCT(...))
         *
         * Example:
         *
         * COUNT(DISTINCT(
         *     "Projects"."id" || '|;|' ||
         *     "Projects"."title" || '|;|' ||
         *     ...
         * )) AS "cnt"
         */

            const distinctMatch =
                expression.match(
                    /^(COUNT|SUM|AVG|MIN|MAX)\s*\(\s*DISTINCT\s*\(([\s\S]+)\)\s*\)\s+AS\s+"([^"]+)"$/i,
                );

            if (distinctMatch?.[1] && distinctMatch[2] && distinctMatch[3])
            {
                aggregates.push({
                    function: distinctMatch[1].toUpperCase() as AggregateFunction,
                    argument: distinctMatch[2].trim(),
                    alias: distinctMatch[3],
                    distinct: true,
                });

                continue;
            }

            /**
                   * Normal aggregate.
                   *
                   * COUNT(*)
                   * COUNT(1)
                   * COUNT("Projects"."id")
                   * SUM("Projects"."age")
                   * etc.
                   */

            const match =
                expression.match(
                    /^(COUNT|SUM|AVG|MIN|MAX)\s*\(\s*([\s\S]+?)\s*\)\s+AS\s+"([^"]+)"$/i,
                );

            if (!match?.[1] || !match[2] || !match[3]) continue;

            aggregates.push({
                function: match[1].toUpperCase() as AggregateFunction,
                argument: match[2].trim(),
                alias: match[3],
                distinct: false,
            });
        }

        return aggregates;
    }

    parseWhereExpression(query: string): WhereExpression | undefined
    {
        const whereMatch = query.match(/\bWHERE\s+(.+?)(?=\s+ORDER\s+BY|\s+LIMIT\s+\d+|\s+OFFSET\s+\d+|$)/i);

        if (!whereMatch?.[1]) return undefined;

        return this.parseWhereExpressionPart(whereMatch[1].trim());
    }

    private parseWhereExpressionPart(expression: string): WhereExpression
    {
        const normalizedExpression = this.unwrapOuterParentheses(expression.trim());
        const orExpressions = this.splitLogicalExpression(normalizedExpression, 'OR');

        if (orExpressions.length > 1)
        {
            return {
                type: 'or',
                expressions: orExpressions.map((part) => this.parseWhereAndExpression(part)),
            };
        }

        return this.parseWhereAndExpression(normalizedExpression);
    }

    private parseWhereAndExpression(expression: string): WhereExpression
    {
        const normalizedExpression = this.unwrapOuterParentheses(expression.trim());

        const notMatch = normalizedExpression.match(/^NOT\s*(\(.*\))$/is);

        if (notMatch?.[1])
        {
            return {
                type: 'not',
                expression: this.parseWhereExpressionPart(notMatch[1])
            };
        }

        const andExpressions = this.splitLogicalExpression(normalizedExpression, 'AND');

        if (andExpressions.length === 1) return this.parseSingleWhereCondition(andExpressions[0]!);

        return {
            type: 'and',
            expressions: andExpressions.map((part) => this.parseWhereExpressionPart(part))
        };
    }

    private parseSingleWhereCondition(expression: string): WhereExpression
    {
        const normalizedExpression = this.unwrapOuterParentheses(expression.trim());

        /**
         * IS NULL / IS NOT NULL
         */
        const nullMatch = normalizedExpression.match(/^(?:"([^"]+)"\.)?"([^"]+)"\s+IS\s+(NOT\s+)?NULL$/i);

        if (nullMatch?.[2])
        {
            return {
                type: 'condition',
                condition: {
                    tableAlias: nullMatch[1] ?? '',
                    column: nullMatch[2],
                    operator: nullMatch[3] ? 'IS NOT NULL' : 'IS NULL',
                    parameters: [],
                },
            };
        }

        /**
         * IN / NOT IN
         */
        const inMatch = normalizedExpression.match(/^(?:"([^"]+)"\.)?"([^"]+)"\s+(NOT\s+)?IN\s*\((.+)\)$/i);

        if (inMatch?.[2] && inMatch[4])
        {
            return {
                type: 'condition',
                condition: {
                    tableAlias: inMatch[1] ?? '',
                    column: inMatch[2],
                    operator: inMatch[3] ? 'NOT IN' : 'IN',
                    parameters: inMatch[4].split(',').map(parameter => parameter.trim()),
                },
            };
        }

        /**
         * BETWEEN
         */
        const betweenMatch =
            normalizedExpression.match(
                /^(?:"([^"]+)"\.)?"([^"]+)"\s+BETWEEN\s+(:[a-zA-Z_][a-zA-Z0-9_]*)\s+AND\s+(:[a-zA-Z_][a-zA-Z0-9_]*)$/i
            );

        if (betweenMatch?.[2] && betweenMatch[3] && betweenMatch[4])
        {
            return {
                type: 'condition',
                condition: {
                    tableAlias: betweenMatch[1] ?? '',
                    column: betweenMatch[2],
                    operator: 'BETWEEN',
                    parameters: [
                        betweenMatch[3],
                        betweenMatch[4],
                    ],
                },
            };
        }

        /**
         * ANY
         *
         * "User"."id" = ANY(:orm_param_0)
         */
        const anyMatch =
            normalizedExpression.match(
                /^(?:"([^"]+)"\.)?"([^"]+)"\s*=\s*ANY\s*\(\s*(:[a-zA-Z_][a-zA-Z0-9_]*)\s*\)$/i
            );

        if (anyMatch?.[2] && anyMatch[3])
        {
            return {
                type: 'condition',
                condition: {
                    tableAlias: anyMatch[1] ?? '',
                    column: anyMatch[2],
                    operator: 'ANY',
                    parameters: [anyMatch[3]],
                },
            };
        }

        const castLikeMatch =
            normalizedExpression.match(
                /^CAST\(\s*(?:"([^"]+)"\.)?"([^"]+)"\s+AS\s+(?:CHAR|TEXT)\s*\)\s+(NOT\s+)?(I?LIKE)\s+(:[a-zA-Z_][a-zA-Z0-9_]*)$/i,
            );

        if (castLikeMatch?.[2] && castLikeMatch?.[4] && castLikeMatch?.[5])
        {
            const likeOperator = castLikeMatch[4].toUpperCase();
            let operator: WhereOperator;

            if (likeOperator === 'LIKE')
            {
                operator = castLikeMatch[3] ? 'NOT LIKE' : 'LIKE';
            } else
            {
                operator = castLikeMatch[3] ? 'NOT ILIKE' : 'ILIKE';
            }

            return {
                type: 'condition',
                condition: {
                    tableAlias: castLikeMatch[1] ?? '',
                    column: castLikeMatch[2],
                    operator,
                    parameters: [
                        castLikeMatch[5],
                    ],
                }
            };
        }

        /**
         * LIKE / NOT LIKE
         *
         * ILIKE / NOT ILIKE
         */
        const likeMatch =
            normalizedExpression.match(
                /^(?:"([^"]+)"\.)?"([^"]+)"\s+(NOT\s+)?(I?LIKE)\s+(:[a-zA-Z_][a-zA-Z0-9_]*)$/i
            );

        if (likeMatch?.[2] && likeMatch[4] && likeMatch[5])
        {
            const likeOperator = likeMatch[4].toUpperCase();

            let operator: WhereOperator;

            if (likeOperator === 'LIKE') operator = likeMatch[3] ? 'NOT LIKE' : 'LIKE';
            else operator = likeMatch[3] ? 'NOT ILIKE' : 'ILIKE';

            return {
                type: 'condition',
                condition: {
                    tableAlias: likeMatch[1] ?? '',
                    column: likeMatch[2],
                    operator,
                    parameters: [likeMatch[5]],
                },
            };
        }

        /**
         * =, !=, <>, >, >=, <, <=
         */
        const comparisonMatch =
            normalizedExpression.match(
                /^(?:"([^"]+)"\.)?"([^"]+)"\s*(>=|<=|!=|<>|=|>|<)\s*(:[a-zA-Z_][a-zA-Z0-9_]*)$/i,
            );

        if (comparisonMatch?.[2] && comparisonMatch[3] && comparisonMatch[4])
        {
            return {
                type: 'condition',
                condition: {
                    tableAlias: comparisonMatch[1] ?? '',
                    column: comparisonMatch[2],
                    operator: comparisonMatch[3] as WhereOperator,
                    parameters: [comparisonMatch[4]],
                },
            };
        }

        throw new GoogleSheetsParseError(`Unable to parse WHERE expression: ${expression}`)
    }

    private splitLogicalExpression(expression: string, operator: 'AND' | 'OR'): string[]
    {
        const parts: string[] = [];

        let depth = 0;
        let start = 0;

        for (let index = 0; index < expression.length; index++)
        {
            const character = expression[index];

            if (character === '(')
            {
                depth++;
                continue;
            }

            if (character === ')')
            {
                depth--;
                continue;
            }

            if (depth !== 0) continue;

            const remaining = expression.slice(index);

            const match = remaining.match(new RegExp(`^${operator}\\b`, 'i'));

            if (!match) continue;

            /**
             * BETWEEN contains its own AND:
             *
             * id BETWEEN :min AND :max
             *
             * That AND is not a logical AND.
             */

            if (operator === 'AND')
            {
                const before = expression.slice(start, index).trim();

                if (/\bBETWEEN\s+:[a-zA-Z_][a-zA-Z0-9_]*$/i.test(before)) continue;
            }

            parts.push(expression.slice(start, index).trim(),
            );

            index += match[0].length - 1;
            start = index + 1;
        }

        parts.push(expression.slice(start).trim());

        return parts.filter((part) => part.length > 0);
    }

    private unwrapOuterParentheses(expression: string): string
    {
        let result = expression.trim();

        while (result.startsWith('(') && result.endsWith(')') && this.isWrappedByOuterParentheses(result))
        {
            result = result.slice(1, -1).trim();
        }

        return result;
    }

    private isWrappedByOuterParentheses(expression: string): boolean
    {
        let depth = 0;

        for (let index = 0; index < expression.length; index++)
        {
            const character = expression[index];

            if (character === '(') depth++;
            else if (character === ')')
            {
                depth--;

                if (depth === 0 && index !== expression.length - 1) return false;
            }
        }

        return depth === 0;
    }

    extractColumnName(expression: string): string
    {
        const match = expression.match(/^"[^"]+"\."([^"]+)"$/i);

        if (match?.[1]) return match[1];

        return expression.replace(/^"|"$/g, '');
    }

    private evaluateSelectExpression(row: Record<string, unknown>, expression: string): unknown
    {
        const parts = expression.split(/\s*\|\|\s*/).map((part) => part.trim());

        if (parts.length === 1)
        {
            const part = parts[0]!;

            const columnMatch = part.match(/^"?([^".]+)"?\."?([^".]+)"?$/);

            if (columnMatch?.[1] && columnMatch[2])
            {
                const tableRow = row[columnMatch[1]];

                if (tableRow && typeof tableRow === 'object')
                {
                    return (tableRow as Record<string, unknown>)[columnMatch[2]];
                }

                return undefined;
            }

            const literalMatch = part.match(/^'(.*)'$/s);

            if (literalMatch) return literalMatch[1];

            return undefined;
        }

        const values = parts.map((part) => this.evaluateSelectExpression(row, part));

        /**
         * SQL concatenation:
         *
         * 'foo' || NULL
         * => NULL
         */
        if (values.some((value) => value === null || value === undefined)) return null;

        return values.map((value) => String(value)).join('');
    }

    private evaluateDistinctExpression(row: Record<string, unknown>, expression: string): unknown[]
    {
        return expression.split(/\s*\|\|\s*/).map((part) => this.evaluateSelectExpression(row, part.trim()));
    }

    evaluateAggregate(rows: Record<string, unknown>[], aggregate: AggregateColumn): number | null
    {
        if (aggregate.function === 'COUNT')
        {
            /**
             * COUNT(*) / COUNT(1)
             */
            if (aggregate.argument === '*' || /^\d+$/.test(aggregate.argument))
            {
                if (!aggregate.distinct) return rows.length;
            }

            /**
             * COUNT(DISTINCT expression)
             */
            if (aggregate.distinct)
            {
                const values = rows.map((row) =>
                    this.evaluateDistinctExpression(row, aggregate.argument))
                    .filter((value) => value !== null && value !== undefined);

                const distinctValues = new Set(values.map((value) => JSON.stringify(value)));

                return distinctValues.size;
            }
        }

        const columnMatch = aggregate.argument.match(/^"?([^".]+)"?\."?([^".]+)"?$/);
        const tableAlias = columnMatch?.[1];
        const column = columnMatch?.[2] ?? this.extractColumnName(aggregate.argument);

        const getValue = (row: Record<string, unknown>): unknown =>
        {
            if (tableAlias)
            {
                const tableRow = row[tableAlias];

                if (tableRow && typeof tableRow === 'object')
                {
                    return (tableRow as Record<string, unknown>)[column];
                }

                return undefined;
            }

            return row[column];
        };

        const values = rows.map((row) => getValue(row))
            .filter((value): value is string | number => value !== null && value !== undefined);

        if (aggregate.function === 'COUNT') return values.length;

        if (values.length === 0) return null;

        const numericValues = values.map((value) => typeof value === 'number' ? value : Number(value))
            .filter((value) => Number.isFinite(value));

        if (numericValues.length === 0) return null;

        switch (aggregate.function)
        {
            case 'SUM': return numericValues.reduce((sum, value) => sum + value, 0);
            case 'AVG': return numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length;
            case 'MIN': return Math.min(...numericValues);
            case 'MAX': return Math.max(...numericValues);
            default:
                throw new GoogleSheetsUnsupportedOperationError(
                    `Unsupported aggregate function: ${aggregate.function}`,
                );
        }
    }

    evaluateWhere(value: unknown, operator: WhereOperator, parameters: unknown[]): boolean
    {
        switch (operator)
        {
            case '=': return this.compareValues(value, parameters[0]);
            case '!=':
            case '<>':
                return !this.compareValues(value, parameters[0]);
            case '>':
                return value !== undefined &&
                    value !== null &&
                    parameters[0] !== undefined &&
                    parameters[0] !== null &&
                    value > parameters[0];
            case '>=':
                return value !== undefined &&
                    value !== null &&
                    parameters[0] !== undefined &&
                    parameters[0] !== null &&
                    value >= parameters[0];
            case '<':
                return value !== undefined &&
                    value !== null &&
                    parameters[0] !== undefined &&
                    parameters[0] !== null &&
                    value < parameters[0];
            case '<=':
                return value !== undefined &&
                    value !== null &&
                    parameters[0] !== undefined &&
                    parameters[0] !== null &&
                    value <= parameters[0];
            case 'IS NULL': return (value === null || value === undefined);
            case 'IS NOT NULL': return (value !== null && value !== undefined);
            case 'IN': return parameters.some((parameter) => this.compareValues(value, parameter));
            case 'NOT IN': return !parameters.some((parameter) => this.compareValues(value, parameter));
            case 'ANY':
                {
                    const values = parameters[0];

                    if (!Array.isArray(values)) return false;

                    return values.some(
                        (parameter) => this.compareValues(value, parameter),
                    );
                }
            case 'LIKE': return this.evaluateLike(value, parameters[0], false);
            case 'NOT LIKE': return !this.evaluateLike(value, parameters[0], false);
            case 'ILIKE': return this.evaluateLike(value, parameters[0], true);
            case 'NOT ILIKE': return !this.evaluateLike(value, parameters[0], true);
            case 'BETWEEN':
                return value !== undefined &&
                    value !== null &&
                    parameters[0] !== undefined &&
                    parameters[0] !== null &&
                    parameters[1] !== undefined &&
                    parameters[1] !== null &&
                    value >= parameters[0] &&
                    value <= parameters[1];
            default: throw new GoogleSheetsUnsupportedOperationError(`Unsupported operator: ${operator}`)
        }
    }

    private evaluateLike(value: unknown, pattern: unknown, caseInsensitive: boolean): boolean
    {
        if (typeof value !== 'string' || typeof pattern !== 'string') return false;

        const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        const regexPattern = `^${escapedPattern.replaceAll('%', '.*').replaceAll('_', '.')}$`;

        return new RegExp(regexPattern, caseInsensitive ? 'i' : '').test(value);
    }

    evaluateWhereExpression(
        expression: WhereExpression,
        resolveValue: (
            tableAlias: string,
            column: string,
        ) => unknown,
        resolveParameter: (
            parameter: string,
        ) => unknown,
    ): boolean
    {
        switch (expression.type)
        {
            case 'condition':
                {
                    const condition = expression.condition;

                    const parameters = condition.parameters.map((parameter) => resolveParameter(parameter)).flat();

                    return this.evaluateWhere(
                        resolveValue(
                            condition.tableAlias,
                            condition.column,
                        ),
                        condition.operator,
                        parameters,
                    );
                }

            case 'and':
                return expression.expressions.every(
                    (expression) => this.evaluateWhereExpression(expression, resolveValue, resolveParameter)
                );

            case 'or':
                return expression.expressions.some(
                    (expression) => this.evaluateWhereExpression(expression, resolveValue, resolveParameter)
                );

            case 'not': return !this.evaluateWhereExpression(expression.expression, resolveValue, resolveParameter);
            default: throw new GoogleSheetsUnsupportedOperationError(`Unsupported operator: ${expression}`)
        }
    }

    private compareValues(left: unknown, right: unknown): boolean
    {
        if (left === null || left === undefined || right === null || right === undefined)
        {
            return left === right;
        }

        if (left instanceof Date && right instanceof Date)
        {
            return left.getTime() === right.getTime();
        }

        if (left instanceof Date && typeof right === 'string')
        {
            const rightDate = new Date(right);

            if (Number.isNaN(rightDate.getTime())) return false;

            return left.getTime() === rightDate.getTime();
        }

        if (typeof left === 'string' && right instanceof Date)
        {
            const leftDate = new Date(left);

            if (Number.isNaN(leftDate.getTime())) return false;

            return leftDate.getTime() === right.getTime();
        }

        if (typeof left === 'number' && typeof right === 'string')
        {
            return left === Number(right);
        }

        if (typeof left === 'string' && typeof right === 'number')
        {
            return Number(left) === right;
        }

        return left === right;
    }

    parseOrderBy(query: string): OrderBy[]
    {
        const match = query.match(/\bORDER\s+BY\s+(.+?)(?:\s+LIMIT\s+\d+|\s+OFFSET\s+\d+|$)/i);

        if (!match?.[1]) return [];

        return match[1]
            .split(',')
            .map(
                (expression) =>
                {
                    const trimmedExpression = expression.trim();

                    // ORDER BY "table"."column" ASC
                    const columnMatch = trimmedExpression.match(/^"([^"]+)"\."([^"]+)"(?:\s+(ASC|DESC))?$/i);

                    if (columnMatch?.[1] && columnMatch[2])
                    {
                        return {
                            tableAlias: columnMatch[1],
                            column: columnMatch[2],
                            direction: (columnMatch[3]?.toUpperCase() ?? 'ASC') as OrderDirection,
                        };
                    }

                    // ORDER BY "table_column" ASC
                    const aliasMatch = trimmedExpression.match(/^"([^"]+)"(?:\s+(ASC|DESC))?$/i);

                    if (aliasMatch?.[1])
                    {
                        const alias = aliasMatch[1];
                        const separatorIndex = alias.lastIndexOf('_');

                        if (separatorIndex > 0)
                        {
                            return {
                                tableAlias: alias.slice(0, separatorIndex),
                                column: alias.slice(separatorIndex + 1),
                                direction: (aliasMatch[2]?.toUpperCase() ?? 'ASC') as OrderDirection
                            };
                        }
                    }

                    throw new GoogleSheetsParseError(`Unable to parse ORDER BY expression: ${expression}`)
                },
            );
    }

    parsePagination(query: string): Pagination
    {
        const limitMatch = query.match(/\bLIMIT\s+(\d+)/i);
        const offsetMatch = query.match(/\bOFFSET\s+(\d+)/i);

        return {
            limit: limitMatch ? Number(limitMatch[1]) : undefined,
            offset: offsetMatch ? Number(offsetMatch[1]) : undefined,
        };
    }
}
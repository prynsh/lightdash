import { DimensionType } from '@lightdash/common';
import { createConnection } from 'snowflake-sdk';
import { Readable } from 'stream';
import {
    mapFieldType,
    SnowflakeWarehouseClient,
} from './SnowflakeWarehouseClient';
import {
    columns,
    credentials,
    expectedFields,
    expectedRow,
    expectedWarehouseSchema,
    queryColumnsMock,
} from './SnowflakeWarehouseClient.mock';
import { config } from './WarehouseClient.mock';

const mockStreamRows = () =>
    new Readable({
        objectMode: true,
        read() {
            this.push(expectedRow);
            this.push(null);
        },
    });

const executeMock = jest.fn(({ sqlText, complete }) => {
    complete(
        undefined,
        {
            streamRows: mockStreamRows,
            getColumns: () => queryColumnsMock,
            getQueryId: () => 'queryId',
            getSqlText: () => sqlText,
        },
        [],
    );
});

const getResultsFromQueryIdMock = jest.fn(({ sqlText, queryId }) => ({
    streamRows: mockStreamRows,
    getColumns: () => queryColumnsMock,
    getQueryId: () => queryId,
    getNumRows: () => 1,
}));

jest.mock('snowflake-sdk', () => ({
    ...jest.requireActual('snowflake-sdk'),
    createConnection: jest.fn(() => ({
        connect: jest.fn((callback) => callback(null, {})),
        execute: executeMock,
        destroy: jest.fn((callback) => callback(null, {})),
        getResultsFromQueryId: getResultsFromQueryIdMock,
    })),
}));

describe('SnowflakeWarehouseClient', () => {
    it('expect query rows', async () => {
        const warehouse = new SnowflakeWarehouseClient(credentials);
        const results = await warehouse.runQuery('fake sql');

        expect(results.fields).toEqual(expectedFields);
        expect(results.rows[0]).toEqual(expectedRow);
    });
    it('expect schema with snowflake types mapped to dimension types', async () => {
        (createConnection as jest.Mock).mockImplementationOnce(() => ({
            connect: jest.fn((callback) => callback(null, {})),
            execute: jest.fn(({ sqlText, complete }) => {
                complete(
                    undefined,
                    { getColumns: () => queryColumnsMock },
                    columns,
                );
            }),
            destroy: jest.fn((callback) => callback(null, {})),
        }));
        const warehouse = new SnowflakeWarehouseClient(credentials);
        expect(await warehouse.getCatalog(config)).toEqual(
            expectedWarehouseSchema,
        );
    });
    describe('getPaginatedResults', () => {
        it('should return raw results', async () => {
            const client = new SnowflakeWarehouseClient(credentials);

            // Execute test
            const result = await client.getPaginatedResults({
                sql: 'SELECT * FROM test',
                page: 1,
                pageSize: 10,
                tags: {},
                timezone: 'UTC',
                values: [],
            });

            // Assertions

            expect(executeMock).toHaveBeenLastCalledWith({
                sqlText: 'SELECT * FROM test',
                asyncExec: true,
                binds: undefined,
                complete: expect.any(Function),
            });

            expect(getResultsFromQueryIdMock).toHaveBeenCalledWith({
                sqlText: '',
                queryId: 'queryId',
            });

            expect(result).toEqual({
                fields: expectedFields,
                rows: [expectedRow],
                queryId: 'queryId',
                pageCount: 1,
                totalRows: 1,
            });
        });

        it('should return formatted results when using a formatter', async () => {
            const client = new SnowflakeWarehouseClient(credentials);

            function formatter(row: Record<string, unknown>) {
                return Object.fromEntries(
                    Object.entries(row).map(([key, value]) => [
                        key,
                        {
                            raw: value,
                            formatted: `formatted_${value}`,
                        },
                    ]),
                );
            }

            const result = await client.getPaginatedResults(
                {
                    sql: 'SELECT * FROM test',
                    page: 1,
                    pageSize: 10,
                    tags: {},
                    timezone: 'UTC',
                    values: [],
                },
                formatter,
            );

            const expectedFormattedRow = formatter(expectedRow);

            // Assertions
            expect(executeMock).toHaveBeenLastCalledWith({
                sqlText: 'SELECT * FROM test',
                asyncExec: true,
                binds: undefined,
                complete: expect.any(Function),
            });

            expect(getResultsFromQueryIdMock).toHaveBeenCalledWith({
                sqlText: '',
                queryId: 'queryId',
            });

            expect(result).toEqual({
                fields: expectedFields,
                rows: [expectedFormattedRow],
                queryId: 'queryId',
                pageCount: 1,
                totalRows: 1,
            });
        });

        it('should not execute any query when using queryId', async () => {
            const client = new SnowflakeWarehouseClient(credentials);

            const result = await client.getPaginatedResults({
                queryId: 'queryId',
                page: 1,
                pageSize: 10,
                tags: {},
                timezone: 'UTC',
                values: [],
            });

            // Assertions

            // Ensure that in this case we don't execute any query, we just fetch results
            expect(executeMock).toHaveBeenLastCalledWith({
                sqlText:
                    'ALTER SESSION SET QUOTED_IDENTIFIERS_IGNORE_CASE = FALSE;',
                complete: expect.any(Function),
            });

            expect(getResultsFromQueryIdMock).toHaveBeenCalledWith({
                sqlText: '',
                queryId: 'queryId',
            });

            expect(result).toEqual({
                fields: expectedFields,
                rows: [expectedRow],
                queryId: 'queryId',
                pageCount: 1,
                totalRows: 1,
            });
        });
    });
});

describe('SnowflakeTypeParsing', () => {
    it('expect NUMBER(x,x) to be a number', () => {
        expect(mapFieldType('NUMBER(12,10)')).toEqual(DimensionType.NUMBER);
    });
    it('expect VARCHAR(x) to be a string', () => {
        expect(mapFieldType('VARCHAR(12)')).toEqual(DimensionType.STRING);
    });
});

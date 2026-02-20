import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { expect } from "chai"

describe("driver > postgres-js > connection options", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                enabledDrivers: ["postgres-js", "postgres"],
                driverSpecific: {
                    applicationName: "typeorm-postgres-js-test",
                },
            })),
    )
    beforeEach(async () => {
        await reloadTestingDatabases(connections)
        // Clean up any leftover extensions from previous test runs
        await Promise.all(
            connections.map(async (connection) => {
                try {
                    await connection.query(
                        "DROP EXTENSION IF EXISTS tablefunc CASCADE",
                    )
                    await connection.query(
                        "DROP EXTENSION IF EXISTS xml2 CASCADE",
                    )
                } catch (e) {
                    // Ignore if extensions don't exist
                }
            }),
        )
    })
    after(() => closeTestingConnections(connections))

    it("should successfully establish connection", () =>
        Promise.all(
            connections.map(async (connection) => {
                expect(connection.isInitialized).to.be.true
            }),
        ))

    it("should set session variable application_name", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection.query(
                    "select current_setting('application_name') as application_name",
                )
                expect(result.length).equals(1)
                expect(result[0].application_name).equals(
                    "typeorm-postgres-js-test",
                )
            }),
        ))

    it("should not install custom extensions when none are specified", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection.query(
                    "SELECT extname FROM pg_extension WHERE extname IN ('tablefunc', 'xml2')",
                )
                expect(result.length).equals(0)
            }),
        ))
})

describe("driver > postgres-js > connection options > custom extension installation", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                enabledDrivers: ["postgres-js"],
                driverSpecific: {
                    extensions: ["tablefunc", "xml2"],
                },
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should install specified extensions after connection", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection.query(
                    "SELECT extname FROM pg_extension WHERE extname IN ('tablefunc', 'xml2')",
                )
                expect(result.length).equals(2)
                const installedExtensions = result.map((r: any) => r.extname)
                expect(installedExtensions).to.include("tablefunc")
                expect(installedExtensions).to.include("xml2")
            }),
        ))
})

describe("driver > postgres-js > basic queries", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                enabledDrivers: ["postgres-js"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should execute SELECT query", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection.query(
                    "SELECT 1 as test_number, 'hello' as test_string",
                )
                expect(result.length).equals(1)
                expect(result[0].test_number).equals(1)
                expect(result[0].test_string).equals("hello")
            }),
        ))

    it("should execute parameterized query", () =>
        Promise.all(
            connections.map(async (connection) => {
                // Use connection.query which handles parameter mapping through the driver
                const result = await connection.query(
                    "SELECT $1 as param1, $2 as param2",
                    ["test", 42],
                )
                expect(result.length).equals(1)
                expect(result[0].param1).equals("test")
                // postgres.js might return bigint, so convert for comparison
                expect(Number(result[0].param2)).equals(42)
            }),
        ))

    it("should execute multiple queries in sequence", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result1 = await connection.query("SELECT 1 as num")
                const result2 = await connection.query("SELECT 2 as num")
                const result3 = await connection.query("SELECT 3 as num")

                expect(result1[0].num).equals(1)
                expect(result2[0].num).equals(2)
                expect(result3[0].num).equals(3)
            }),
        ))

    it("should get server version", () =>
        Promise.all(
            connections.map(async (connection) => {
                expect(connection.driver.version).to.be.a("string")
                expect(connection.driver.version).to.match(/\d+\.\d+/)
            }),
        ))

    it("should get current database name", () =>
        Promise.all(
            connections.map(async (connection) => {
                expect(connection.driver.database).to.be.a("string")
                expect(connection.driver.database!.length).to.be.greaterThan(0)
            }),
        ))

    it("should get schema information", () =>
        Promise.all(
            connections.map(async (connection) => {
                expect(connection.driver.schema).to.be.a("string")
                // searchSchema is postgres-specific, check via query instead
                const result = await connection.query(
                    "SELECT current_schema() as schema",
                )
                expect(result[0].schema).to.be.a("string")
            }),
        ))
})

describe("driver > postgres-js > transaction handling", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                enabledDrivers: ["postgres-js"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should execute transaction with commit", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                try {
                    await queryRunner.startTransaction()
                    await queryRunner.query("SELECT 1")
                    await queryRunner.commitTransaction()
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("should execute transaction with rollback", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                try {
                    await queryRunner.startTransaction()
                    await queryRunner.query("SELECT 1")
                    await queryRunner.rollbackTransaction()
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("should support nested transactions via savepoints", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                try {
                    await queryRunner.startTransaction()
                    await queryRunner.query("SELECT 1")

                    // Nested transaction (savepoint)
                    await queryRunner.startTransaction()
                    await queryRunner.query("SELECT 2")
                    await queryRunner.commitTransaction()

                    await queryRunner.commitTransaction()
                } finally {
                    await queryRunner.release()
                }
            }),
        ))
})

describe("driver > postgres-js > query runner", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                enabledDrivers: ["postgres-js"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should create and release query runner", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                expect(queryRunner.isReleased).to.be.false

                await queryRunner.release()
                expect(queryRunner.isReleased).to.be.true
            }),
        ))

    it("should reuse query runner for multiple queries", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                try {
                    const result1 = await queryRunner.query("SELECT 1 as num")
                    const result2 = await queryRunner.query("SELECT 2 as num")
                    const result3 = await queryRunner.query("SELECT 3 as num")

                    expect(result1[0].num).equals(1)
                    expect(result2[0].num).equals(2)
                    expect(result3[0].num).equals(3)
                } finally {
                    await queryRunner.release()
                }
            }),
        ))

    it("should support isolation levels in transactions", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()

                try {
                    await queryRunner.startTransaction("READ COMMITTED")
                    await queryRunner.query("SELECT 1")
                    await queryRunner.commitTransaction()
                } finally {
                    await queryRunner.release()
                }
            }),
        ))
})

describe("driver > postgres-js > data types", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                enabledDrivers: ["postgres-js"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should handle various data types", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection.query(`
                    SELECT
                        1::INTEGER as int_val,
                        'text'::TEXT as text_val,
                        TRUE::BOOLEAN as bool_val,
                        3.14::NUMERIC as numeric_val,
                        now()::TIMESTAMP as timestamp_val
                `)

                expect(result.length).equals(1)
                const row = result[0]
                expect(row.int_val).to.equal(1)
                expect(row.text_val).to.equal("text")
                expect(row.bool_val).to.be.true
                expect(row.numeric_val).to.equal("3.14")
                expect(row.timestamp_val).to.be.instanceOf(Date)
            }),
        ))

    it("should handle NULL values", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection.query(`
                    SELECT
                        NULL::INTEGER as null_int,
                        NULL::TEXT as null_text
                `)

                expect(result.length).equals(1)
                const row = result[0]
                expect(row.null_int).to.be.null
                expect(row.null_text).to.be.null
            }),
        ))

    it("should handle arrays", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection.query(
                    "SELECT ARRAY[1, 2, 3] as arr",
                )

                expect(result.length).equals(1)
                expect(result[0].arr).to.be.an("array")
            }),
        ))

    it("should handle JSON/JSONB types", () =>
        Promise.all(
            connections.map(async (connection) => {
                const result = await connection.query(
                    'SELECT \'{"key": "value"}\'::JSON as json_val',
                )

                expect(result.length).equals(1)
                const jsonVal = result[0].json_val
                expect(jsonVal).to.have.property("key")
                expect(jsonVal.key).to.equal("value")
            }),
        ))
})

describe("driver > postgres-js > driver properties", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                enabledDrivers: ["postgres-js"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should have correct driver metadata", () =>
        Promise.all(
            connections.map(async (connection) => {
                const driver = connection.driver

                expect(driver.treeSupport).to.be.true
                expect(driver.transactionSupport).to.equal("nested")
                expect(driver.parametersPrefix).to.equal("$")
                expect(driver.supportedDataTypes.length).to.be.greaterThan(0)
            }),
        ))

    it("should have correct supported upsert types", () =>
        Promise.all(
            connections.map(async (connection) => {
                const driver = connection.driver

                expect(driver.supportedUpsertTypes).to.include(
                    "on-conflict-do-update",
                )
            }),
        ))

    it("should support CTE capabilities", () =>
        Promise.all(
            connections.map(async (connection) => {
                const driver = connection.driver

                expect(driver.cteCapabilities).to.have.property("enabled", true)
                expect(driver.cteCapabilities).to.have.property(
                    "writable",
                    true,
                )
            }),
        ))

    it("should not be replicated by default", () =>
        Promise.all(
            connections.map(async (connection) => {
                const driver = connection.driver

                expect(driver.isReplicated).to.be.false
            }),
        ))
})

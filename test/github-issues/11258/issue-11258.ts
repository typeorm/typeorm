import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Parent as Parent0 } from "./entity-0/Parent"
import { Child as Child0 } from "./entity-0/Child"
import { Parent as Parent6 } from "./entity-6/Parent"
import { Child as Child6 } from "./entity-6/Child"
import { scheduler } from "node:timers/promises"

describe("github issues > #11258 Fix issue with CURRENT_TIMESTAMP(6) being used in relation updates", () => {
    let connections: DataSource[]

    /**
     * Main test for GitHub issue #11258 - Fix issue with CURRENT_TIMESTAMP(6) being used in relation updates.
     * This test primarily focuses on MySQL/MariaDB timestamp precision handling.
     *
     * For SQL Server support, see the companion test file: issue-11258-sqlserver.ts
     *
     * The issue was that TypeORM was incorrectly using CURRENT_TIMESTAMP(6) for all timestamp columns
     * in relation updates, regardless of the actual precision defined in the entity.
     *
     * This test verifies that:
     * 1. Precision 0 columns use CURRENT_TIMESTAMP (no precision specifier)
     * 2. Precision 6 columns use CURRENT_TIMESTAMP(6)
     * 3. Both relation updates and direct entity updates respect the precision
     * 4. The SQL generated contains the correct timestamp function
     */

    before(async () => {
        connections = await createTestingConnections({
            entities: [Parent0, Child0, Parent6, Child6],
            enabledDrivers: ["mariadb", "mysql", "oracle", "postgres"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    const createEntities = async <
        P extends Parent0 | Parent6,
        C extends Child0 | Child6,
    >(
        connection: DataSource,
        Parent: new () => P,
        Child: new () => C,
        id: number,
        nameSuffix: string,
    ): Promise<{ parent: P; child: C }> => {
        const parent = new Parent()
        parent.id = id
        parent.name = `Parent ${nameSuffix}`
        const savedParent = await connection.manager.save(parent)

        const child = new Child()
        child.id = id
        child.name = `Child ${nameSuffix}`
        const savedChild = await connection.manager.save(child)

        return { parent: savedParent, child: savedChild }
    }

    // Helper function to get the appropriate entity classes based on database type
    const getEntityClasses = (connection: DataSource, precision: 0 | 6) => {
        // For now, use the regular entities since SQL Server support is complex
        return precision === 0
            ? { Parent: Parent0, Child: Child0 }
            : { Parent: Parent6, Child: Child6 }
    }

    describe("Precision 0 (CURRENT_TIMESTAMP) tests", () => {
        it("should use CURRENT_TIMESTAMP (precision 0) when updating relations", async () => {
            for (const connection of connections) {
                const { Parent, Child } = getEntityClasses(connection, 0)
                const { parent, child } = await createEntities(
                    connection,
                    Parent,
                    Child,
                    1,
                    "Precision 0",
                )
                const childBefore = await connection.manager.findOne(Child, {
                    where: { id: 1 },
                    relations: ["parent"],
                })
                expect(childBefore).to.not.equal(null)
                expect(childBefore!.updated_date!.getMilliseconds()).to.equal(0)
                await scheduler.wait(1100)
                await connection.manager
                    .createQueryBuilder()
                    .relation(Parent, "entities")
                    .of(parent)
                    .add(child)
                const childAfter = await connection.manager.findOne(Child, {
                    where: { id: 1 },
                    relations: ["parent"],
                })
                expect(childAfter).to.not.equal(null)
                expect(childAfter!.parent?.id).to.equal(1)
                expect(childAfter!.updated_date!.getMilliseconds()).to.equal(0)
            }
        })

        it("should use CURRENT_TIMESTAMP (precision 0) in SQL for relation updates", async () => {
            for (const connection of connections) {
                const { Parent, Child } = getEntityClasses(connection, 0)
                const { parent, child } = await createEntities(
                    connection,
                    Parent,
                    Child,
                    2,
                    "Precision 0",
                )
                const queryRunner = connection.createQueryRunner()
                let lastQuery = ""
                const originalQuery = queryRunner.query
                queryRunner.query = function (sql: string, parameters?: any[]) {
                    lastQuery = sql
                    return originalQuery.call(this, sql, parameters)
                }
                try {
                    await connection
                        .createQueryBuilder(queryRunner)
                        .relation(Parent, "entities")
                        .of(parent)
                        .add(child)

                    // For MySQL/MariaDB and other databases, check CURRENT_TIMESTAMP usage
                    expect(lastQuery.toLowerCase()).to.include(
                        "current_timestamp",
                    )
                    expect(lastQuery.toLowerCase()).to.not.include(
                        "current_timestamp(6)",
                    )
                    expect(
                        /\bCURRENT_TIMESTAMP\b(?!\s*\()/i.test(lastQuery),
                    ).to.equal(true)
                } finally {
                    await queryRunner.release()
                }
            }
        })
    })

    describe("Precision 6 (CURRENT_TIMESTAMP(6)) tests", () => {
        it("should use CURRENT_TIMESTAMP(6) (precision 6) when updating relations", async () => {
            for (const connection of connections) {
                const { Parent, Child } = getEntityClasses(connection, 6)
                const { parent, child } = await createEntities(
                    connection,
                    Parent,
                    Child,
                    10,
                    "Precision 6",
                )
                const childBefore = await connection.manager.findOne(Child, {
                    where: { id: 10 },
                })
                await scheduler.wait(10)
                await connection.manager
                    .createQueryBuilder()
                    .relation(Parent, "entities")
                    .of(parent)
                    .add(child)
                const childAfter = await connection.manager.findOne(Child, {
                    where: { id: 10 },
                    relations: ["parent"],
                })
                expect(childAfter).to.not.equal(null)
                expect(childAfter!.parent?.id).to.equal(10)
                expect(childAfter!.updated_date!.getTime()).to.be.greaterThan(
                    childBefore!.updated_date!.getTime(),
                )
            }
        })

        it("should use CURRENT_TIMESTAMP(6) in SQL for relation updates", async () => {
            for (const connection of connections) {
                const { parent, child } = await createEntities(
                    connection,
                    Parent6,
                    Child6,
                    11,
                    "Precision 6",
                )
                const queryRunner = connection.createQueryRunner()
                let lastQuery = ""
                const originalQuery = queryRunner.query
                queryRunner.query = function (sql: string, parameters?: any[]) {
                    lastQuery = sql
                    return originalQuery.call(this, sql, parameters)
                }
                try {
                    await connection
                        .createQueryBuilder(queryRunner)
                        .relation(Parent6, "entities")
                        .of(parent)
                        .add(child)
                    expect(lastQuery.toLowerCase()).to.include(
                        "current_timestamp(6)",
                    )
                    expect(/\bCURRENT_TIMESTAMP\(6\)/i.test(lastQuery)).to.be
                        .true
                } finally {
                    await queryRunner.release()
                }
            }
        })

        it("should preserve microsecond precision when using CURRENT_TIMESTAMP(6) with relation updates", async () => {
            for (const connection of connections) {
                const { parent, child } = await createEntities(
                    connection,
                    Parent6,
                    Child6,
                    12,
                    "Precision Test",
                )
                const before = await connection.manager.findOne(Child6, {
                    where: { id: 12 },
                })
                await connection.manager
                    .createQueryBuilder()
                    .relation(Parent6, "entities")
                    .of(parent)
                    .add(child)
                const updatedChild = await connection.manager.findOne(Child6, {
                    where: { id: 12 },
                })
                const dbTimestamp = updatedChild!.updated_date!.getTime()
                expect(dbTimestamp).to.be.at.least(
                    before!.updated_date!.getTime(),
                )
                // For precision 6, verify microsecond precision is preserved
                // The timestamp should not be rounded to the nearest second
                const timestampMs = dbTimestamp % 1000
                expect(timestampMs).to.not.equal(
                    0,
                    "Timestamp should preserve microsecond precision",
                )
            }
        })
    })

    describe("Relation removal tests", () => {
        it("should handle removal of relations with proper timestamp updates (precision 0)", async () => {
            for (const connection of connections) {
                // Skip SQL Server as it doesn't support timestamp precision 0 in the same way
                if (connection.options.type === "mssql") {
                    continue
                }
                const { parent, child } = await createEntities(
                    connection,
                    Parent0,
                    Child0,
                    20,
                    "Precision 0",
                )
                child.parent = parent
                await connection.manager.save(child)
                const childBefore = await connection.manager.findOne(Child0, {
                    where: { id: 20 },
                })
                await scheduler.wait(1100)
                await connection.manager
                    .createQueryBuilder()
                    .relation(Parent0, "entities")
                    .of(parent)
                    .remove(child)
                const childAfter = await connection.manager.findOne(Child0, {
                    where: { id: 20 },
                    relations: ["parent"],
                })
                expect(childAfter).to.not.equal(null)
                expect(childAfter!.parent).to.equal(null)
                expect(
                    childAfter!.updated_date!.getTime() -
                        childBefore!.updated_date!.getTime(),
                ).to.be.greaterThanOrEqual(0)
            }
        })

        it("should handle removal of relations with proper timestamp updates (precision 6)", async () => {
            for (const connection of connections) {
                const { parent, child } = await createEntities(
                    connection,
                    Parent6,
                    Child6,
                    21,
                    "Precision 6",
                )
                child.parent = parent
                await connection.manager.save(child)
                const childBefore = await connection.manager.findOne(Child6, {
                    where: { id: 21 },
                })
                await scheduler.wait(10)
                await connection.manager
                    .createQueryBuilder()
                    .relation(Parent6, "entities")
                    .of(parent)
                    .remove(child)
                const childAfter = await connection.manager.findOne(Child6, {
                    where: { id: 21 },
                    relations: ["parent"],
                })
                expect(childAfter).to.not.equal(null)
                expect(childAfter!.parent).to.equal(null)
                expect(childAfter!.updated_date!.getTime()).to.be.greaterThan(
                    childBefore!.updated_date!.getTime(),
                )
            }
        })
    })

    describe("Backward compatibility and configuration tests", () => {
        it("should respect the default value configuration from UpdateDateColumn decorator (precision 0)", async () => {
            for (const connection of connections) {
                // Skip SQL Server as it doesn't support timestamp precision 0 in the same way
                if (connection.options.type === "mssql") {
                    continue
                }
                const { parent, child } = await createEntities(
                    connection,
                    Parent0,
                    Child0,
                    30,
                    "Config 0",
                )
                const queryRunner = connection.createQueryRunner()
                const queries: string[] = []
                const originalQuery = queryRunner.query.bind(queryRunner)
                queryRunner.query = function (sql: string, parameters?: any[]) {
                    queries.push(sql)
                    return originalQuery(sql, parameters)
                }
                try {
                    await connection
                        .createQueryBuilder(queryRunner)
                        .relation(Parent0, "entities")
                        .of(parent)
                        .add(child)
                    const updateQuery = queries.find(
                        (q) =>
                            q.toLowerCase().includes("update") &&
                            q.toLowerCase().includes("updated_date"),
                    )
                    expect(updateQuery).to.not.be.undefined
                    expect(updateQuery!.toLowerCase()).to.include(
                        "current_timestamp",
                    )
                    expect(updateQuery!.toLowerCase()).to.not.include(
                        "current_timestamp(6)",
                    )
                    expect(
                        /\bCURRENT_TIMESTAMP\b(?!\s*\()/i.test(updateQuery!),
                    ).to.equal(true)
                } finally {
                    await queryRunner.release()
                }
            }
        })

        it("should respect the default value configuration from UpdateDateColumn decorator (precision 6)", async () => {
            for (const connection of connections) {
                const { parent, child } = await createEntities(
                    connection,
                    Parent6,
                    Child6,
                    31,
                    "Config 6",
                )
                const queryRunner = connection.createQueryRunner()
                const queries: string[] = []
                const originalQuery = queryRunner.query.bind(queryRunner)
                queryRunner.query = function (sql: string, parameters?: any[]) {
                    queries.push(sql)
                    return originalQuery(sql, parameters)
                }
                try {
                    await connection
                        .createQueryBuilder(queryRunner)
                        .relation(Parent6, "entities")
                        .of(parent)
                        .add(child)
                    const updateQuery = queries.find(
                        (q) =>
                            q.toLowerCase().includes("update") &&
                            q.toLowerCase().includes("updated_date"),
                    )
                    expect(updateQuery).to.not.be.undefined
                    expect(updateQuery!.toLowerCase()).to.include(
                        "current_timestamp(6)",
                    )
                    expect(/\bCURRENT_TIMESTAMP\(6\)/i.test(updateQuery!)).to.be
                        .true
                } finally {
                    await queryRunner.release()
                }
            }
        })
    })

    describe("Table creation verification (MySQL/MariaDB only)", () => {
        it("should create tables with correct timestamp precision", async () => {
            for (const connection of connections) {
                // Only test on MySQL/MariaDB since issue #11258 was specific to these databases
                if (!["mysql", "mariadb"].includes(connection.options.type)) {
                    continue
                }

                const queryRunner = connection.createQueryRunner()
                try {
                    // Test precision 0 table
                    const child0TableName =
                        connection.getMetadata(Child0).tableName
                    const showCreateChild0 = await queryRunner.query(
                        `SHOW CREATE TABLE \`${child0TableName}\``,
                    )
                    const createTableSql0 =
                        showCreateChild0[0]?.["Create Table"] ?? ""

                    // For precision 0, we expect timestamp without precision specifier
                    // Accept both "timestamp" and "timestamp()" (some MySQL versions add empty parens)
                    const hasCorrectPrecision0 =
                        /`updated_date`\s+timestamp(\(\))?\s+not\s+null/i.test(
                            createTableSql0,
                        ) &&
                        !/`updated_date`\s+timestamp\(\d+\)/i.test(
                            createTableSql0,
                        )

                    expect(
                        hasCorrectPrecision0,
                        `Precision 0 table should use 'timestamp' without precision, got: ${createTableSql0}`,
                    ).to.equal(true)

                    // Test precision 6 table
                    const child6TableName =
                        connection.getMetadata(Child6).tableName
                    const showCreateChild6 = await queryRunner.query(
                        `SHOW CREATE TABLE \`${child6TableName}\``,
                    )
                    const createTableSql6 =
                        showCreateChild6[0]?.["Create Table"] ?? ""

                    // For precision 6, we expect timestamp(6)
                    const hasCorrectPrecision6 =
                        /`updated_date`\s+timestamp\(6\)/i.test(createTableSql6)
                    expect(
                        hasCorrectPrecision6,
                        `Precision 6 table should use 'timestamp(6)', got: ${createTableSql6}`,
                    ).to.equal(true)
                } finally {
                    await queryRunner.release()
                }
            }
        })
    })

    describe("Parent entity update tests", () => {
        it("should use CURRENT_TIMESTAMP (precision 0) when updating parent entities directly", async () => {
            for (const connection of connections) {
                // Skip SQL Server as it doesn't support timestamp precision 0 in the same way
                if (connection.options.type === "mssql") {
                    continue
                }
                const { parent } = await createEntities(
                    connection,
                    Parent0,
                    Child0,
                    40,
                    "Parent Update 0",
                )
                const parentBefore = await connection.manager.findOne(Parent0, {
                    where: { id: 40 },
                })
                expect(parentBefore).to.not.equal(null)
                expect(parentBefore!.updated_date!.getMilliseconds()).to.equal(
                    0,
                )

                await scheduler.wait(1100)

                // Update parent directly
                parent.name = "Updated Parent Precision 0"
                await connection.manager.save(parent)

                const parentAfter = await connection.manager.findOne(Parent0, {
                    where: { id: 40 },
                })
                expect(parentAfter).to.not.equal(null)
                expect(parentAfter!.name).to.equal("Updated Parent Precision 0")
                expect(parentAfter!.updated_date!.getMilliseconds()).to.equal(0)
                expect(parentAfter!.updated_date!.getTime()).to.be.greaterThan(
                    parentBefore!.updated_date!.getTime(),
                )
            }
        })

        it("should use CURRENT_TIMESTAMP(6) (precision 6) when updating parent entities directly", async () => {
            for (const connection of connections) {
                const { parent } = await createEntities(
                    connection,
                    Parent6,
                    Child6,
                    41,
                    "Parent Update 6",
                )
                const parentBefore = await connection.manager.findOne(Parent6, {
                    where: { id: 41 },
                })
                expect(parentBefore).to.not.equal(null)

                await scheduler.wait(10)

                // Update parent directly
                parent.name = "Updated Parent Precision 6"
                await connection.manager.save(parent)

                const parentAfter = await connection.manager.findOne(Parent6, {
                    where: { id: 41 },
                })
                expect(parentAfter).to.not.equal(null)
                expect(parentAfter!.name).to.equal("Updated Parent Precision 6")
                expect(parentAfter!.updated_date!.getTime()).to.be.greaterThan(
                    parentBefore!.updated_date!.getTime(),
                )
            }
        })

        it("should use CURRENT_TIMESTAMP in SQL for parent entity updates (precision 0)", async () => {
            for (const connection of connections) {
                // Skip SQL Server as it doesn't support timestamp precision 0 in the same way
                if (connection.options.type === "mssql") {
                    continue
                }
                const { parent } = await createEntities(
                    connection,
                    Parent0,
                    Child0,
                    42,
                    "Parent SQL 0",
                )
                const queryRunner = connection.createQueryRunner()
                let lastQuery = ""
                const originalQuery = queryRunner.query
                queryRunner.query = function (sql: string, parameters?: any[]) {
                    lastQuery = sql
                    return originalQuery.call(this, sql, parameters)
                }
                try {
                    // Use query builder to update the entity directly
                    await connection.manager
                        .createQueryBuilder(queryRunner)
                        .update(Parent0)
                        .set({ name: "Updated Parent SQL 0" })
                        .where("id = :id", { id: parent.id })
                        .execute()

                    // Check that the update query uses CURRENT_TIMESTAMP without precision
                    expect(lastQuery.toLowerCase()).to.include("update")
                    expect(lastQuery.toLowerCase()).to.include("updated_date")
                    expect(lastQuery.toLowerCase()).to.include(
                        "current_timestamp",
                    )
                    expect(lastQuery.toLowerCase()).to.not.include(
                        "current_timestamp(6)",
                    )
                    expect(
                        /\bCURRENT_TIMESTAMP\b(?!\s*\()/i.test(lastQuery),
                    ).to.equal(true)
                } finally {
                    await queryRunner.release()
                }
            }
        })

        it("should use CURRENT_TIMESTAMP(6) in SQL for parent entity updates (precision 6)", async () => {
            for (const connection of connections) {
                const { parent } = await createEntities(
                    connection,
                    Parent6,
                    Child6,
                    43,
                    "Parent SQL 6",
                )
                const queryRunner = connection.createQueryRunner()
                let lastQuery = ""
                const originalQuery = queryRunner.query
                queryRunner.query = function (sql: string, parameters?: any[]) {
                    lastQuery = sql
                    return originalQuery.call(this, sql, parameters)
                }
                try {
                    // Use query builder to update the entity directly
                    await connection.manager
                        .createQueryBuilder(queryRunner)
                        .update(Parent6)
                        .set({ name: "Updated Parent SQL 6" })
                        .where("id = :id", { id: parent.id })
                        .execute()

                    // Check that the update query uses CURRENT_TIMESTAMP(6)
                    expect(lastQuery.toLowerCase()).to.include("update")
                    expect(lastQuery.toLowerCase()).to.include("updated_date")
                    expect(lastQuery.toLowerCase()).to.include(
                        "current_timestamp(6)",
                    )
                    expect(/\bCURRENT_TIMESTAMP\(6\)/i.test(lastQuery)).to.be
                        .true
                } finally {
                    await queryRunner.release()
                }
            }
        })

        it("should handle bulk updates with correct timestamp precision (precision 0)", async () => {
            for (const connection of connections) {
                // Skip SQL Server as it doesn't support timestamp precision 0 in the same way
                if (connection.options.type === "mssql") {
                    continue
                }
                await createEntities(connection, Parent0, Child0, 44, "Bulk 0")
                await createEntities(connection, Parent0, Child0, 45, "Bulk 0")

                const queryRunner = connection.createQueryRunner()
                let lastQuery = ""
                const originalQuery = queryRunner.query
                queryRunner.query = function (sql: string, parameters?: any[]) {
                    lastQuery = sql
                    return originalQuery.call(this, sql, parameters)
                }
                try {
                    await connection.manager
                        .createQueryBuilder(queryRunner)
                        .update(Parent0)
                        .set({ name: "Bulk Updated 0" })
                        .where("id IN (:...ids)", { ids: [44, 45] })
                        .execute()

                    expect(lastQuery.toLowerCase()).to.include("update")
                    expect(lastQuery.toLowerCase()).to.include("updated_date")
                    expect(lastQuery.toLowerCase()).to.include(
                        "current_timestamp",
                    )
                    expect(lastQuery.toLowerCase()).to.not.include(
                        "current_timestamp(6)",
                    )
                    expect(
                        /\bCURRENT_TIMESTAMP\b(?!\s*\()/i.test(lastQuery),
                    ).to.equal(true)
                } finally {
                    await queryRunner.release()
                }
            }
        })

        it("should handle bulk updates with correct timestamp precision (precision 6)", async () => {
            for (const connection of connections) {
                await createEntities(connection, Parent6, Child6, 46, "Bulk 6")
                await createEntities(connection, Parent6, Child6, 47, "Bulk 6")

                const queryRunner = connection.createQueryRunner()
                let lastQuery = ""
                const originalQuery = queryRunner.query
                queryRunner.query = function (sql: string, parameters?: any[]) {
                    lastQuery = sql
                    return originalQuery.call(this, sql, parameters)
                }
                try {
                    await connection.manager
                        .createQueryBuilder(queryRunner)
                        .update(Parent6)
                        .set({ name: "Bulk Updated 6" })
                        .where("id IN (:...ids)", { ids: [46, 47] })
                        .execute()

                    expect(lastQuery.toLowerCase()).to.include("update")
                    expect(lastQuery.toLowerCase()).to.include("updated_date")
                    expect(lastQuery.toLowerCase()).to.include(
                        "current_timestamp(6)",
                    )
                    expect(/\bCURRENT_TIMESTAMP\(6\)/i.test(lastQuery)).to.be
                        .true
                } finally {
                    await queryRunner.release()
                }
            }
        })
    })

    describe("Child entity update tests", () => {
        it("should use CURRENT_TIMESTAMP (precision 0) when updating child entities directly", async () => {
            for (const connection of connections) {
                // Skip SQL Server as it doesn't support timestamp precision 0 in the same way
                if (connection.options.type === "mssql") {
                    continue
                }
                const { child } = await createEntities(
                    connection,
                    Parent0,
                    Child0,
                    50,
                    "Child Update 0",
                )
                const childBefore = await connection.manager.findOne(Child0, {
                    where: { id: 50 },
                })
                expect(childBefore).to.not.equal(null)
                expect(childBefore!.updated_date!.getMilliseconds()).to.equal(0)

                await scheduler.wait(1100)

                // Update child directly
                child.name = "Updated Child Precision 0"
                await connection.manager.save(child)

                const childAfter = await connection.manager.findOne(Child0, {
                    where: { id: 50 },
                })
                expect(childAfter).to.not.equal(null)
                expect(childAfter!.name).to.equal("Updated Child Precision 0")
                expect(childAfter!.updated_date!.getMilliseconds()).to.equal(0)
                expect(childAfter!.updated_date!.getTime()).to.be.greaterThan(
                    childBefore!.updated_date!.getTime(),
                )
            }
        })

        it("should use CURRENT_TIMESTAMP(6) (precision 6) when updating child entities directly", async () => {
            for (const connection of connections) {
                const { child } = await createEntities(
                    connection,
                    Parent6,
                    Child6,
                    51,
                    "Child Update 6",
                )
                const childBefore = await connection.manager.findOne(Child6, {
                    where: { id: 51 },
                })
                expect(childBefore).to.not.equal(null)

                await scheduler.wait(10)

                // Update child directly
                child.name = "Updated Child Precision 6"
                await connection.manager.save(child)

                const childAfter = await connection.manager.findOne(Child6, {
                    where: { id: 51 },
                })
                expect(childAfter).to.not.equal(null)
                expect(childAfter!.name).to.equal("Updated Child Precision 6")
                expect(childAfter!.updated_date!.getTime()).to.be.greaterThan(
                    childBefore!.updated_date!.getTime(),
                )
            }
        })
    })
})

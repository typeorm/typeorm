import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../../../src"
import { Table, TableForeignKey, TableUnique } from "../../../../../../src"
import { DriverUtils } from "../../../../../../src/driver/DriverUtils"
import type { TestingOptions } from "../../../../../utils/test-utils"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../../../../utils/test-utils"
import { Activity } from "./entity/Activity"
import { Book } from "./entity/Book"
import { Code } from "./entity/Code"
import { Pair } from "./entity/Pair"
import { Reservation } from "./entity/Reservation"
import { Shelf } from "./entity/Shelf"
import { Slot } from "./entity/Slot"
import { Usage } from "./entity/Usage"
import { Visit } from "./entity/Visit"

const connect = (entities: TestingOptions["entities"]): Promise<DataSource[]> =>
    createTestingConnections({
        entities,
        enabledDrivers: [
            "better-sqlite3",
            "cockroachdb",
            "mssql",
            "oracle",
            "postgres",
            "sqljs",
        ],
        schemaCreate: false,
        dropSchema: true,
    })

const createTablesBefore = async (
    dataSource: DataSource,
    tables: Table[],
): Promise<void> => {
    const queryRunner = dataSource.createQueryRunner()
    try {
        for (const table of [...tables].reverse())
            await queryRunner.dropTable(table.name, true)
        for (const table of tables) await queryRunner.createTable(table)
    } finally {
        await queryRunner.release()
    }
}

const loadTable = async (
    dataSource: DataSource,
    tableName: string,
): Promise<Table> => {
    const queryRunner = dataSource.createQueryRunner()
    try {
        return (await queryRunner.getTable(tableName))!
    } finally {
        await queryRunner.release()
    }
}

const synchronizeAndLoad = async (
    dataSource: DataSource,
    tableName: string,
): Promise<Table> => {
    await dataSource.synchronize()
    return loadTable(dataSource, tableName)
}

const expectNoPendingQueries = async (
    dataSource: DataSource,
): Promise<void> => {
    const sqlInMemory = await dataSource.driver.createSchemaBuilder().log()
    expect(sqlInMemory.upQueries).to.eql([])
    expect(sqlInMemory.downQueries).to.eql([])
}

// https://github.com/typeorm/typeorm/issues/12986
describe("schema builder > constraint > unique > named unique columns", () => {
    describe("dropped column", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await connect([Activity])
        })
        after(() => closeTestingConnections(dataSources))

        it("should recreate a named composite unique when one of its columns is dropped", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const table = Table.create(
                        dataSource.getMetadata(Activity),
                        dataSource.driver,
                    )
                    const actor = table.findColumnByName("target")!.clone()
                    actor.name = "actor"
                    table.addColumn(actor)
                    table.uniques = [
                        new TableUnique({
                            name: "activity_once",
                            columnNames: ["kind", "target", "actor"],
                        }),
                    ]
                    await createTablesBefore(dataSource, [table])

                    const synchronized = await synchronizeAndLoad(
                        dataSource,
                        "activity",
                    )

                    expect(synchronized.findColumnByName("actor")).to.be
                        .undefined
                    expect(synchronized.uniques).to.have.length(1)
                    expect(synchronized.uniques[0].name).to.equal(
                        "activity_once",
                    )
                    expect(synchronized.uniques[0].columnNames).to.have.members(
                        ["kind", "target"],
                    )
                    await expectNoPendingQueries(dataSource)
                }),
            ))
    })

    describe("changed columns", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await connect([Pair])
        })
        after(() => closeTestingConnections(dataSources))

        it("should recreate a named composite unique when its columns change", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const table = Table.create(
                        dataSource.getMetadata(Pair),
                        dataSource.driver,
                    )
                    table.uniques = [
                        new TableUnique({
                            name: "pair_once",
                            columnNames: ["first", "second"],
                        }),
                    ]
                    await createTablesBefore(dataSource, [table])

                    const synchronized = await synchronizeAndLoad(
                        dataSource,
                        "pair",
                    )

                    expect(synchronized.uniques).to.have.length(1)
                    expect(synchronized.uniques[0].name).to.equal("pair_once")
                    expect(synchronized.uniques[0].columnNames).to.have.members(
                        ["first", "third"],
                    )
                    await expectNoPendingQueries(dataSource)
                }),
            ))
    })

    describe("changed columns referenced by a foreign key", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await connect([Code, Usage])
        })
        after(() => closeTestingConnections(dataSources))

        it("should recreate a named composite unique and the foreign key that references it when their columns change", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const code = Table.create(
                        dataSource.getMetadata(Code),
                        dataSource.driver,
                    )
                    code.uniques = [
                        new TableUnique({
                            name: "code_once",
                            columnNames: ["tenant", "former"],
                        }),
                    ]
                    const usageMetadata = dataSource.getMetadata(Usage)
                    const usage = Table.create(usageMetadata, dataSource.driver)
                    const foreignKey = TableForeignKey.create(
                        usageMetadata.foreignKeys[0],
                        dataSource.driver,
                    )
                    foreignKey.referencedColumnNames = ["tenant", "former"]
                    usage.foreignKeys = [foreignKey]
                    await createTablesBefore(dataSource, [code, usage])

                    const synchronized = await synchronizeAndLoad(
                        dataSource,
                        "code",
                    )
                    const usageTable = await loadTable(dataSource, "usage")

                    expect(synchronized.uniques).to.have.length(1)
                    expect(synchronized.uniques[0].name).to.equal("code_once")
                    expect(synchronized.uniques[0].columnNames).to.have.members(
                        ["tenant", "latest"],
                    )
                    expect(usageTable.foreignKeys).to.have.length(1)
                    expect(
                        usageTable.foreignKeys[0].referencedColumnNames,
                    ).to.have.members(["tenant", "latest"])
                    await expectNoPendingQueries(dataSource)
                }),
            ))
    })

    describe("replaced unique next to another unique on the same columns", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await createTestingConnections({
                entities: [Shelf, Book],
                // Oracle rejects a second unique key on the same columns
                enabledDrivers: [
                    "better-sqlite3",
                    "cockroachdb",
                    "mssql",
                    "postgres",
                    "sqljs",
                ],
                schemaCreate: false,
                dropSchema: true,
            })
        })
        after(() => closeTestingConnections(dataSources))

        it("should drop and recreate the foreign key that depends on the replaced unique", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const shelf = Table.create(
                        dataSource.getMetadata(Shelf),
                        dataSource.driver,
                    )
                    shelf.uniques = [
                        new TableUnique({
                            name: "shelf_pair",
                            columnNames: ["room", "slot"],
                        }),
                    ]
                    const bookMetadata = dataSource.getMetadata(Book)
                    const book = Table.create(bookMetadata, dataSource.driver)
                    book.foreignKeys = [
                        TableForeignKey.create(
                            bookMetadata.foreignKeys[0],
                            dataSource.driver,
                        ),
                    ]
                    const queryRunner = dataSource.createQueryRunner()
                    try {
                        await queryRunner.dropTable(book.name, true)
                        await queryRunner.dropTable(shelf.name, true)
                        await queryRunner.createTable(shelf)
                        await queryRunner.createTable(book)
                        await queryRunner.createUniqueConstraint(
                            shelf,
                            new TableUnique({
                                name: "shelf_spot",
                                columnNames: ["room", "slot"],
                            }),
                        )
                    } finally {
                        await queryRunner.release()
                    }
                    expect(
                        (await loadTable(dataSource, "book")).foreignKeys,
                    ).to.have.length(1)

                    const synchronized = await synchronizeAndLoad(
                        dataSource,
                        "shelf",
                    )
                    const bookTable = await loadTable(dataSource, "book")

                    const uniques = Object.fromEntries(
                        synchronized.uniques.map((unique) => [
                            unique.name,
                            [...unique.columnNames].sort(),
                        ]),
                    )
                    expect(uniques).to.eql({
                        shelf_pair: ["level", "room"],
                        shelf_spot: ["room", "slot"],
                    })
                    expect(bookTable.foreignKeys).to.have.length(1)
                    expect(
                        bookTable.foreignKeys[0].referencedColumnNames,
                    ).to.have.members(["room", "slot"])
                    await expectNoPendingQueries(dataSource)
                }),
            ))
    })

    describe("renamed column", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await connect([Visit])
        })
        after(() => closeTestingConnections(dataSources))

        it("should keep a named composite unique when one of its columns is renamed", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const table = Table.create(
                        dataSource.getMetadata(Visit),
                        dataSource.driver,
                    )
                    table.findColumnByName("goal")!.name = "target"
                    table.uniques = [
                        new TableUnique({
                            name: "visit_once",
                            columnNames: ["kind", "target"],
                        }),
                    ]
                    await createTablesBefore(dataSource, [table])

                    const synchronized = await synchronizeAndLoad(
                        dataSource,
                        "visit",
                    )

                    expect(synchronized.findColumnByName("target")).to.be
                        .undefined
                    expect(synchronized.uniques).to.have.length(1)
                    expect(synchronized.uniques[0].name).to.equal("visit_once")
                    expect(synchronized.uniques[0].columnNames).to.have.members(
                        ["kind", "goal"],
                    )
                    await expectNoPendingQueries(dataSource)
                }),
            ))
    })

    describe("renamed column referenced by a foreign key", () => {
        let dataSources: DataSource[]
        before(async () => {
            dataSources = await connect([Slot, Reservation])
        })
        after(() => closeTestingConnections(dataSources))

        it("should keep a named composite unique that a foreign key references when one of its columns is renamed", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const slot = Table.create(
                        dataSource.getMetadata(Slot),
                        dataSource.driver,
                    )
                    slot.findColumnByName("start")!.name = "begin"
                    slot.uniques = [
                        new TableUnique({
                            name: "slot_once",
                            columnNames: ["room", "begin"],
                        }),
                    ]
                    const reservationMetadata =
                        dataSource.getMetadata(Reservation)
                    const reservation = Table.create(
                        reservationMetadata,
                        dataSource.driver,
                    )
                    const foreignKey = TableForeignKey.create(
                        reservationMetadata.foreignKeys[0],
                        dataSource.driver,
                    )
                    foreignKey.referencedColumnNames = ["room", "begin"]
                    reservation.foreignKeys = [foreignKey]
                    await createTablesBefore(dataSource, [slot, reservation])

                    const synchronized = await synchronizeAndLoad(
                        dataSource,
                        "slot",
                    )

                    expect(synchronized.findColumnByName("begin")).to.be
                        .undefined
                    expect(synchronized.uniques).to.have.length(1)
                    expect(synchronized.uniques[0].name).to.equal("slot_once")
                    expect(synchronized.uniques[0].columnNames).to.have.members(
                        ["room", "start"],
                    )
                    if (DriverUtils.isSQLiteFamily(dataSource.driver)) {
                        // the SQLite runner renames a column by recreating the table and
                        // leaves the keys of the referencing tables on the old column name
                        const repair = await dataSource.driver
                            .createSchemaBuilder()
                            .log()
                        expect(repair.upQueries).to.not.eql([])
                        await dataSource.synchronize()
                    }
                    await expectNoPendingQueries(dataSource)
                    expect(
                        (await loadTable(dataSource, "reservation"))
                            .foreignKeys[0].referencedColumnNames,
                    ).to.have.members(["room", "start"])
                }),
            ))
    })
})

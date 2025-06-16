import "reflect-metadata"
import { Foo1Entity } from "./entity/Foo1"
import { Foo2Entity } from "./entity/Foo2"
import { Foo3Entity } from "./entity/Foo3"
import { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { expect } from "chai"

describe("mysql > tree tables > closure-table", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [Foo1Entity, Foo2Entity, Foo3Entity],
                enabledDrivers: ["mysql"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("foo1 should create closure columns unsigned", () =>
        Promise.all(
            connections.map(async (dataSource) => {
                const fooMetadata = dataSource.entityMetadatas.find(
                    (el) => el.tableName === "foo1",
                )!

                expect(fooMetadata).to.exist

                const fooClosureMetadata = dataSource.entityMetadatas.find(
                    (el) => el.tableName === "foo1_closure",
                )!

                expect(fooClosureMetadata).to.exist

                const ancestorCol = fooClosureMetadata.columns.find(
                    (col) => col.databaseName === "ancestor_id",
                )!

                expect(ancestorCol).to.exist

                const descendantCol = fooClosureMetadata.columns.find(
                    (col) => col.databaseName === "descendant_id",
                )!

                expect(descendantCol).to.exist

                expect(ancestorCol.unsigned).to.be.true
                expect(descendantCol.unsigned).to.be.true
            }),
        ))

    it("foo2 should create closure columns with specified zerofill, width, precision and scale", () =>
        Promise.all(
            connections.map(async (dataSource) => {
                const fooMetadata = dataSource.entityMetadatas.find(
                    (el) => el.tableName === "foo2",
                )!

                expect(fooMetadata).to.exist

                const fooClosureMetadata = dataSource.entityMetadatas.find(
                    (el) => el.tableName === "foo2_closure",
                )!

                expect(fooClosureMetadata).to.exist

                const ancestorCol = fooClosureMetadata.columns.find(
                    (col) => col.databaseName === "ancestor_id",
                )!

                expect(ancestorCol).to.exist

                const descendantCol = fooClosureMetadata.columns.find(
                    (col) => col.databaseName === "descendant_id",
                )!

                expect(descendantCol).to.exist

                expect(ancestorCol.zerofill).to.be.true
                expect(descendantCol.zerofill).to.be.true

                expect(ancestorCol.width).to.be.eq(13)
                expect(descendantCol.width).to.be.eq(13)

                expect(ancestorCol.precision).to.be.eq(9)
                expect(descendantCol.precision).to.be.eq(9)

                expect(ancestorCol.scale).to.be.eq(3)
                expect(descendantCol.scale).to.be.eq(3)
            }),
        ))

    it("foo3 should create closure columns with specified length, charset and collation", () =>
        Promise.all(
            connections.map(async (dataSource) => {
                const fooMetadata = dataSource.entityMetadatas.find(
                    (el) => el.tableName === "foo3",
                )!

                expect(fooMetadata).to.exist

                const fooClosureMetadata = dataSource.entityMetadatas.find(
                    (el) => el.tableName === "foo3_closure",
                )!

                expect(fooClosureMetadata).to.exist

                const ancestorCol = fooClosureMetadata.columns.find(
                    (col) => col.databaseName === "ancestor_id",
                )!

                expect(ancestorCol).to.exist

                const descendantCol = fooClosureMetadata.columns.find(
                    (col) => col.databaseName === "descendant_id",
                )!

                expect(descendantCol).to.exist

                expect(ancestorCol.length).to.be.eq("201")
                expect(descendantCol.length).to.be.eq("201")

                expect(ancestorCol.charset).to.be.eq("latin1")
                expect(descendantCol.charset).to.be.eq("latin1")

                expect(ancestorCol.collation).to.be.eq("latin1_bin")
                expect(descendantCol.collation).to.be.eq("latin1_bin")
            }),
        ))
})

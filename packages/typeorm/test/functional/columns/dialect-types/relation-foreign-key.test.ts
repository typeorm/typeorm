import "reflect-metadata"

import { expect } from "chai"

import type { DataSource } from "../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DialectChild } from "./entity-relation-fk/DialectChild"
import { DialectParent } from "./entity-relation-fk/DialectParent"

describe("columns > dialect types > explicit relation foreign keys", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [DialectParent, DialectChild],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("inherits the referenced column's physical type for explicit foreign-key columns", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const parentMetadata = dataSource.getMetadata(DialectParent)
                const childMetadata = dataSource.getMetadata(DialectChild)
                const referencedId =
                    parentMetadata.findColumnWithPropertyName("id")!
                const parentId =
                    childMetadata.findColumnWithPropertyName("parentId")!
                const alternateParentId =
                    childMetadata.findColumnWithPropertyName(
                        "alternateParentId",
                    )!

                expect(parentId.type).to.equal("tinyint")
                expect(parentId.dialectTypes).to.deep.equal({
                    postgres: "smallint",
                })
                expect(alternateParentId.type).to.equal("tinyint")
                expect(alternateParentId.dialectTypes).to.deep.equal(
                    referencedId.dialectTypes,
                )

                const queryRunner = dataSource.createQueryRunner()
                const parentTable =
                    await queryRunner.getTable("dialect_fk_parent")
                const childTable =
                    await queryRunner.getTable("dialect_fk_child")
                await queryRunner.release()

                expect(parentTable!.findColumnByName("id")!.type).to.equal(
                    "smallint",
                )
                expect(
                    childTable!.findColumnByName("parent_id")!.type,
                ).to.equal("smallint")
                expect(
                    childTable!.findColumnByName("alternate_parent_id")!.type,
                ).to.equal("smallint")

                const parent = await dataSource
                    .getRepository(DialectParent)
                    .save({ id: 7, name: "parent" })
                const child = await dataSource
                    .getRepository(DialectChild)
                    .save({
                        parentId: parent.id,
                        alternateParentId: parent.id,
                    })
                const found = await dataSource
                    .getRepository(DialectChild)
                    .findOne({
                        where: { id: child.id },
                        relations: {
                            parent: true,
                            alternateParent: true,
                        },
                    })

                expect(found?.parent.id).to.equal(parent.id)
                expect(found?.alternateParent?.id).to.equal(parent.id)

                const schemaLog = await dataSource.driver
                    .createSchemaBuilder()
                    .log()
                expect(schemaLog.upQueries).to.be.empty
                expect(schemaLog.downQueries).to.be.empty
            }),
        )
    })
})

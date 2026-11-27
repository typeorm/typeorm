import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"
import { expect } from "chai"

describe("relations > many-to-many > junction foreign keys default to CASCADE (#11738)", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post, Category],
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("both junction foreign keys fall back to onDelete/onUpdate CASCADE for bidirectional relations", () => {
        dataSources.forEach((dataSource) => {
            const junctionMetadata = dataSource.entityMetadatas.find(
                (metadata) => metadata.foreignKeys.length === 2,
            )
            expect(junctionMetadata, "junction entity metadata").to.not.be
                .undefined

            const foreignKeys = junctionMetadata!.foreignKeys
            expect(foreignKeys).to.have.length(2)

            // Spanner does not support UPDATE/DELETE CASCADE and Oracle does
            // not support UPDATE CASCADE, so the junction builder falls back
            // to NO ACTION for those drivers. Everywhere else, both the
            // owning-side and inverse-side FKs must default to CASCADE when
            // no explicit onDelete/onUpdate is specified.
            const type = dataSource.driver.options.type
            const expectedOnDelete =
                type === "spanner" ? "NO ACTION" : "CASCADE"
            const expectedOnUpdate =
                type === "spanner" || type === "oracle"
                    ? "NO ACTION"
                    : "CASCADE"

            foreignKeys.forEach((foreignKey) => {
                expect(foreignKey.onDelete).to.be.equal(expectedOnDelete)
                expect(foreignKey.onUpdate).to.be.equal(expectedOnUpdate)
            })
        })
    })
})

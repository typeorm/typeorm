import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"
import { expect } from "chai"

describe("github issues > #11738 many-to-many inverse-side junction FK should default to CASCADE", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Post, Category],
            enabledDrivers: ["better-sqlite3"],
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("both junction foreign keys default to onDelete/onUpdate CASCADE", () => {
        dataSources.forEach((dataSource) => {
            const junctionMetadata = dataSource.entityMetadatas.find(
                (metadata) => metadata.foreignKeys.length === 2,
            )
            expect(junctionMetadata, "junction entity metadata").to.not.be
                .undefined

            const foreignKeys = junctionMetadata!.foreignKeys
            expect(foreignKeys).to.have.length(2)

            // Owning-side FK and inverse-side FK must both fall back to CASCADE
            // when no explicit onDelete/onUpdate is specified.
            foreignKeys.forEach((foreignKey) => {
                expect(foreignKey.onDelete).to.be.equal("CASCADE")
                expect(foreignKey.onUpdate).to.be.equal("CASCADE")
            })
        })
    })
})

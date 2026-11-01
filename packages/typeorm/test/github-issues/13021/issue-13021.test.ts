import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { Parent } from "./entity/Parent"
import { Comp } from "./entity/Comp"

describe("github issues > #13021 relationLoadStrategy 'query' returns one-to-many relations empty on SQL Server: duplicated select aliases in the relation-id query", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Parent, Comp],
            schemaCreate: true,
            dropSchema: true,
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should load one-to-many relations with query strategy when child primary key includes join column", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const parent = new Parent()
                parent.id = "A"
                await dataSource.manager.save(parent)

                const comp1 = new Comp()
                comp1.parentId = "A"
                await dataSource.manager.save(comp1)

                const found = await dataSource.manager.find(Parent, {
                    relations: { comp: true },
                    relationLoadStrategy: "query",
                })

                expect(found).to.have.length(1)
                expect(found[0].comp).to.have.length(1)
                expect(found[0].comp[0].parentId).to.equal("A")
            }),
        ))
})

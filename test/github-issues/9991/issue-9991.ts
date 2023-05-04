import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { ExampleEntity } from "./entity/ExampleEntity"
import { expect } from "chai"

describe("github issues > #9991", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [ExampleEntity],
            enabledDrivers: ["mysql"],
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("add table comment", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const sql =
                    'SELECT table_comment FROM information_schema.tables WHERE table_name = "example"'
                const rst = await dataSource.manager.query(sql)
                expect(rst[0] && rst[0].TABLE_COMMENT).to.be.eq(
                    "this is table comment",
                )
            }),
        )
    })
})

import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { ExampleEntity } from "./entity/ExampleEntity"

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

    it("create table comment", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                const rst = await dataSource.manager.query(`SELECT table_comment FROM information_schema.tables WHERE table_name = 'example';`);
                console.log('rst===', rst);
            }),
        )
    })
})

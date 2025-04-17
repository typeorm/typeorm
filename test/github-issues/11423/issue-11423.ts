import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"

describe("github issues > #9895", () => {
    let dataSources: DataSource[]

    before(async () => {
        const dataSource = new DataSource({
            type: "postgres",
            replication: undefined,
            entities: [Post],
        })
        await dataSource.initialize()
        dataSources = [
            dataSource,
        ]
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("allow undefined replication", async () => {
        await Promise.all(
            dataSources.map(async (dataSource) => {
                await dataSource.manager.find(Post, {
                    order: {
                        title: "DESC",
                    },
                })
            }),
        )
    })
})

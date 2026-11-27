import { expect } from "chai"
import type { Repository } from "../../../src"
import { DataSource } from "../../../src"
import type { PostgresDataSourceOptions } from "../../../src/driver/postgres/PostgresDataSourceOptions"
import {
    closeTestingConnections,
    reloadTestingDatabases,
    setupSingleTestingConnection,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"

describe("github issues > #11423", () => {
    let dataSource: DataSource
    let repository: Repository<Post>

    before(async () => {
        const options = setupSingleTestingConnection("postgres", {
            entities: [Post],
        }) as PostgresDataSourceOptions
        if (!options) return

        dataSource = new DataSource({
            ...options,
            replication: undefined,
        })
        await dataSource.initialize()
    })

    beforeEach(async () => {
        if (!dataSource) return
        await reloadTestingDatabases([dataSource])
    })
    after(() => closeTestingConnections([dataSource]))

    it("allow replication to be undefined", async () => {
        if (!dataSource) return
        repository = dataSource.getRepository(Post)
        const posts = await repository.find({
            order: {
                title: "DESC",
            },
        })
        expect(posts).to.be.an("array")
    })
})

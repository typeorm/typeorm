import "reflect-metadata"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"

describe("github issues > #3663 Eager loading recursive relation causes infinite loop", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("the post should be loaded correctly", () =>
        Promise.all(
            dataSources.map(async function (dataSource) {
                const repository = dataSource.getRepository(Post)
                const post = new Post()
                await repository.save(post)
                await repository.findOneBy({ id: post.id })
            }),
        ))
})

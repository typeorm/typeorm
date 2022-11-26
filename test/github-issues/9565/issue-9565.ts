import "reflect-metadata"
import { expect } from "chai"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import path from "path"
import { User } from "./entity/User"
import { UserId } from "./model/UserId"
import { Post } from "./entity/Post"
import { PostId } from "./model/PostId"

describe("github issues > #9565 Foreign key property transformation processes undefined value upon save", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [path.join(__dirname, "entity", "*.{ts,js}")],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should save entity constructed with object foreign key property", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const user = dataSource.manager.create(User, {
                    id: new UserId("1234"),
                    name: "Tom",
                })
                await dataSource.manager.save(user)

                const post = dataSource.manager.create(Post, {
                    id: new PostId("first"),
                    authorId: new UserId("1234"), // specifying `authorId` but not `author`
                })

                return expect(dataSource.manager.save(post)).to.eventually.be
                    .fulfilled
            }),
        ))
})

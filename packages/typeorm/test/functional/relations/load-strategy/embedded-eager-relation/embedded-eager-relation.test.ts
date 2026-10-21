import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { Image } from "./entity/Image"
import { Post } from "./entity/Post"
import { User } from "./entity/User"

describe("relations > load-strategy > query > eager relation inside an embedded", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            disabledDrivers: ["spanner"],
            entities: [__dirname + "/entity/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    async function seed(dataSource: DataSource) {
        const user = await dataSource
            .getRepository(User)
            .save({ name: "Ann" } as User)
        const image = await dataSource
            .getRepository(Image)
            .save({ url: "a.png" } as Image)
        await dataSource.getRepository(Post).save({
            title: "Hello",
            image,
            meta: { owner: user },
        } as Post)
    }

    it("should load an eager relation inside an embedded when the find options name another relation", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seed(dataSource)

                const posts = await dataSource.getRepository(Post).find({
                    relationLoadStrategy: "query",
                    relations: { image: true },
                })

                expect(posts).to.have.length(1)
                expect(posts[0].image!.url).to.be.equal("a.png")
                expect(posts[0].meta.owner!.name).to.be.equal("Ann")
            }),
        ))

    it("should load an eager relation inside an embedded when the find options only select columns", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                await seed(dataSource)

                const posts = await dataSource.getRepository(Post).find({
                    relationLoadStrategy: "query",
                    select: { id: true, title: true },
                })

                expect(posts).to.have.length(1)
                expect(posts[0].meta.owner!.name).to.be.equal("Ann")
            }),
        ))
})

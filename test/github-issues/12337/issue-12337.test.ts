import { expect } from "chai"
import "reflect-metadata"

import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Category } from "./entity/Category"
import { Post } from "./entity/Post"

describe("github issues > #12337 bigint precision loss in single JoinColumn", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [Category, Post],
            enabledDrivers: [
                "mysql",
                "mariadb",
                "postgres",
                "sqlite",
                "better-sqlite3",
            ],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should preserve bigint string value when loading relation via single JoinColumn", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const categoryRepo = dataSource.getRepository(Category)
                const postRepo = dataSource.getRepository(Post)

                // Value exceeding Number.MAX_SAFE_INTEGER (2^53 - 1 = 9007199254740991)
                const bigintId = "9007199254740993"

                const category = categoryRepo.create({
                    id: bigintId,
                    name: "test",
                })
                await categoryRepo.save(category)

                const post = postRepo.create({ category })
                await postRepo.save(post)

                const loadedPost = await postRepo.findOne({
                    where: { id: post.id },
                    relations: { category: true },
                })

                expect(loadedPost).to.not.be.null
                expect(loadedPost!.category).to.not.be.null
                expect(loadedPost!.category.id).to.equal(bigintId)
            }),
        ))
})

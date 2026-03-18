import { expect } from "chai"
import "reflect-metadata"
import { Category } from "./entity/Category"
import type { DataSource } from "../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { Post } from "./entity/Post"
import { PostCategory } from "./entity/PostCategory"

describe("view entity > mssql", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["mssql"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should create entity view from string definition", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const postCategory = await queryRunner.getView("post_category")
                expect(postCategory).to.be.exist
                await queryRunner.release()
            }),
        ))

    it("should correctly return data from View", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const category1 = new Category()
                category1.name = "Cars"
                await dataSource.manager.save(category1)

                const category2 = new Category()
                category2.name = "Airplanes"
                await dataSource.manager.save(category2)

                const post1 = new Post()
                post1.name = "About BMW"
                post1.categoryId = category1.id
                await dataSource.manager.save(post1)

                const post2 = new Post()
                post2.name = "About Boeing"
                post2.categoryId = category2.id
                await dataSource.manager.save(post2)

                const postCategories =
                    await dataSource.manager.find(PostCategory)
                postCategories.length.should.be.equal(2)

                postCategories[0].id.should.be.equal(1)
                postCategories[0].postName.should.be.equal("About BMW")
                postCategories[0].categoryName.should.be.equal("CARS")

                postCategories[1].id.should.be.equal(2)
                postCategories[1].postName.should.be.equal("About Boeing")
                postCategories[1].categoryName.should.be.equal("AIRPLANES")
            }),
        ))
})

import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"
import { ConnectionMetadataBuilder } from "../../../../src/connection/ConnectionMetadataBuilder"
import { EntityMetadataValidator } from "../../../../src/metadata-builder/EntityMetadataValidator"
import { expect } from "chai"

describe("persistence > order of persistence execution operations", () => {
    describe("should throw exception when non-resolvable circular relations found", function () {
        it("should throw CircularRelationsError", async () => {
            const dataSource = new DataSource({
                // dummy connection options, connection won't be established anyway
                type: "mysql",
                host: "localhost",
                username: "test",
                password: "test",
                database: "test",
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })
            const connectionMetadataBuilder = new ConnectionMetadataBuilder(
                dataSource,
            )
            const entityMetadatas =
                await connectionMetadataBuilder.buildEntityMetadatas([
                    __dirname + "/entity/*{.js,.ts}",
                ])
            const entityMetadataValidator = new EntityMetadataValidator()
            expect(() =>
                entityMetadataValidator.validateMany(
                    entityMetadatas,
                    dataSource.driver,
                ),
            ).to.throw(Error)
        })
    })

    describe.skip("should persist all entities in correct order", function () {
        let dataSources: DataSource[]
        beforeAll(async () => {
            dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
            })
        })
        beforeEach(() => reloadTestingDatabases(dataSources))
        afterAll(() => closeTestingConnections(dataSources))
        it("", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    // create first category and post and save them
                    const category1 = new Category()
                    category1.name = "Category saved by cascades #1"

                    const post1 = new Post()
                    post1.title = "Hello Post #1"
                    post1.category = category1

                    await dataSource.manager.save(post1)

                    // now check
                    /*const posts = await dataSource.manager.find(Post, {
             alias: "post",
             innerJoinAndSelect: {
             category: "post.category"
             },
             orderBy: {
             "post.id": "ASC"
             }
             });

             posts.should.be.eql([{
             id: 1,
             title: "Hello Post #1",
             category: {
             id: 1,
             name: "Category saved by cascades #1"
             }
             }, {
             id: 2,
             title: "Hello Post #2",
             category: {
             id: 2,
             name: "Category saved by cascades #2"
             }
             }]);*/
                }),
            ))
    })
})

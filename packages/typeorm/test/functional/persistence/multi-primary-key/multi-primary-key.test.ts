import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { expect } from "chai"
import { Post } from "./entity/Post"
import { Category } from "./entity/Category"
import { Dependency } from "./entity/Dependency"
import { Example } from "./entity/Example"

describe("persistence > multi primary keys", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    describe("insert", function () {
        it("should insert entity when there are multi column primary keys", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const post1 = new Post()
                    post1.title = "Hello Post #1"
                    post1.firstId = 1
                    post1.secondId = 2

                    await dataSource.manager.save(post1)

                    post1.should.be.eql({
                        firstId: 1,
                        secondId: 2,
                        title: "Hello Post #1",
                    })

                    // create first category and post and save them
                    const category1 = new Category()
                    category1.categoryId = 1
                    category1.name = "Category saved by cascades #1"
                    category1.posts = [post1]

                    await dataSource.manager.save(category1)

                    // now check
                    const posts = await dataSource.manager.find(Post, {
                        relations: {
                            category: true,
                        },
                        order: {
                            firstId: "ASC",
                        },
                    })

                    posts.should.be.eql([
                        {
                            firstId: 1,
                            secondId: 2,
                            title: "Hello Post #1",
                            category: {
                                categoryId: 1,
                                name: "Category saved by cascades #1",
                            },
                        },
                    ])
                }),
            ))
    })

    // GitHub issue #10952 - Incorrect entity identification and persistence on composite foreign primary key endorelation entities
    it("should persist cascaded endo-relations with composite foreign primary keys", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const example1 = new Example()
                example1.id = 1
                example1.name = "example1"
                await dataSource.manager.save(example1)

                const dependency = new Dependency()
                dependency.to = example1
                dependency.label = "dependency"

                const example2 = new Example()
                example2.id = 2
                example2.name = "example2"
                example2.dependencies = [dependency]
                await dataSource.manager.save(example2)

                let reloadedExample2 = await dataSource.manager.findOneByOrFail(
                    Example,
                    { id: 2 },
                )
                expect(reloadedExample2.dependencies).to.have.length(1)
                expect(reloadedExample2.dependencies[0]).to.include({
                    fromId: 2,
                    toId: 1,
                    label: "dependency",
                })

                reloadedExample2.dependencies[0].label = "updated"
                await dataSource.manager.save(reloadedExample2)

                reloadedExample2 = await dataSource.manager.findOneByOrFail(
                    Example,
                    { id: 2 },
                )
                expect(reloadedExample2.dependencies).to.have.length(1)
                expect(reloadedExample2.dependencies[0]).to.include({
                    fromId: 2,
                    toId: 1,
                    label: "updated",
                })

                reloadedExample2.dependencies = []
                await dataSource.manager.save(reloadedExample2)

                reloadedExample2 = await dataSource.manager.findOneByOrFail(
                    Example,
                    { id: 2 },
                )
                expect(reloadedExample2.dependencies).to.have.length(0)
            }),
        ))
})

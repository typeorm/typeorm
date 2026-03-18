import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { Post } from "./entity/Post"
import { expect } from "chai"

describe("transaction > single query runner", () => {
    let dataSources: DataSource[]
    beforeAll(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    afterAll(() => closeTestingConnections(dataSources))

    it("should execute all operations in the method in a transaction", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                return dataSource.transaction(
                    async (transactionalEntityManager) => {
                        const originalQueryRunner =
                            transactionalEntityManager.queryRunner

                        expect(originalQueryRunner).to.exist
                        expect(
                            transactionalEntityManager.getRepository(Post)
                                .queryRunner,
                        ).to.exist
                        transactionalEntityManager
                            .getRepository(Post)
                            .queryRunner!.should.be.equal(originalQueryRunner)
                        transactionalEntityManager
                            .getRepository(Post)
                            .manager.should.be.equal(transactionalEntityManager)
                    },
                )
            }),
        ))

    it("should execute all operations in the method in a transaction (#804)", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const entityManager = dataSource.createQueryRunner().manager
                entityManager.should.not.be.equal(dataSource.manager)
                entityManager.queryRunner!.should.be.equal(
                    entityManager.queryRunner,
                )

                await entityManager.save(new Post(undefined, "Hello World"))

                await entityManager.queryRunner!.startTransaction()
                const loadedPost1 = await entityManager.findOneBy(Post, {
                    title: "Hello World",
                })
                expect(loadedPost1).to.be.eql({ id: 1, title: "Hello World" })
                await entityManager.remove(loadedPost1!)
                const loadedPost2 = await entityManager.findOneBy(Post, {
                    title: "Hello World",
                })
                expect(loadedPost2).to.be.null
                await entityManager.queryRunner!.rollbackTransaction()

                const loadedPost3 = await entityManager.findOneBy(Post, {
                    title: "Hello World",
                })
                expect(loadedPost3).to.be.eql({ id: 1, title: "Hello World" })

                await entityManager.queryRunner!.startTransaction()
                const loadedPost4 = await entityManager.findOneBy(Post, {
                    title: "Hello World",
                })
                expect(loadedPost4).to.be.eql({ id: 1, title: "Hello World" })

                // in Spanner DELETE must have a WHERE clause
                if (dataSource.driver.options.type === "spanner") {
                    await entityManager.query(
                        `DELETE FROM ${dataSource.driver.escape(
                            "post",
                        )} WHERE true`,
                    )
                } else {
                    await entityManager.query(
                        `DELETE FROM ${dataSource.driver.escape("post")}`,
                    )
                }
                const loadedPost5 = await entityManager.findOneBy(Post, {
                    title: "Hello World",
                })
                expect(loadedPost5).to.be.null
                await entityManager.queryRunner!.rollbackTransaction()

                const loadedPost6 = await entityManager.findOneBy(Post, {
                    title: "Hello World",
                })
                expect(loadedPost6).to.be.eql({ id: 1, title: "Hello World" })
                await entityManager.queryRunner!.release()
            }),
        ))
})

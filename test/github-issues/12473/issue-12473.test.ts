import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { MyEntity } from "./entity/MyEntity"
import { MyEntitySubscriber } from "./subscriber/MyEntitySubscriber"

describe("github issues > #12473 select: false columns are stripped from the entity after save()", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            subscribers: [__dirname + "/subscriber/*{.js,.ts}"],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should keep select: false columns on the entity returned by save()", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repo = dataSource.getRepository(MyEntity)
                const entity = repo.create({
                    normalCol: "foo",
                    selectFalseCol: "secret",
                })

                const saved = await repo.save(entity)

                expect(saved.selectFalseCol).to.be.equal("secret")
            }),
        ))

    it("should not mutate the original entity reference passed to save()", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repo = dataSource.getRepository(MyEntity)
                const entity = repo.create({
                    normalCol: "foo",
                    selectFalseCol: "secret",
                })

                await repo.save(entity)

                expect(entity).to.have.property("selectFalseCol")
                expect(entity.selectFalseCol).to.be.equal("secret")
            }),
        ))

    it("should expose select: false columns to afterInsert subscribers", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repo = dataSource.getRepository(MyEntity)
                const subscriber = dataSource.subscribers.find(
                    (s) => s instanceof MyEntitySubscriber,
                ) as MyEntitySubscriber
                subscriber.lastAfterInsertEntity = undefined

                await repo.save(
                    repo.create({
                        normalCol: "foo",
                        selectFalseCol: "secret",
                    }),
                )

                expect(subscriber.lastAfterInsertEntity).to.not.be.undefined
                expect(
                    subscriber.lastAfterInsertEntity!.selectFalseCol,
                ).to.be.equal("secret")
            }),
        ))

    it("should expose select: false columns to afterUpdate subscribers", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repo = dataSource.getRepository(MyEntity)
                const subscriber = dataSource.subscribers.find(
                    (s) => s instanceof MyEntitySubscriber,
                ) as MyEntitySubscriber

                const saved = await repo.save(
                    repo.create({
                        normalCol: "foo",
                        selectFalseCol: "secret",
                    }),
                )

                subscriber.lastAfterUpdateEntity = undefined

                saved.normalCol = "bar"
                saved.selectFalseCol = "new-secret"
                await repo.save(saved)

                expect(subscriber.lastAfterUpdateEntity).to.not.be.undefined
                expect(
                    subscriber.lastAfterUpdateEntity!.selectFalseCol,
                ).to.be.equal("new-secret")
            }),
        ))
})

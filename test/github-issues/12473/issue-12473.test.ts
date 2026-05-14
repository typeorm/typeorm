import { expect } from "chai"
import type {
    DataSource,
    EntitySubscriberInterface,
    InsertEvent,
    UpdateEvent,
} from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { MyEntity } from "./entity/MyEntity"

describe("github issues > #12473 > select:false columns should be present in subscriber events", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            entities: [MyEntity],
            schemaCreate: true,
            dropSchema: true,
            subscribers: [],
        })
    })

    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should include select:false columns in afterInsert event entity", async () =>
        await Promise.all(
            dataSources.map(async (dataSource) => {
                let capturedEntity: any = null

                dataSource.subscribers.push({
                    listenTo: () => MyEntity,
                    afterInsert(event: InsertEvent<MyEntity>) {
                        capturedEntity = event.entity
                    },
                } as EntitySubscriberInterface<MyEntity>)

                const repo = dataSource.getRepository(MyEntity)
                await repo.save({
                    id: 1,
                    normalCol: "normal",
                    selectFalseCol: "secret",
                })

                expect(capturedEntity.selectFalseCol).to.not.be.undefined
                expect(capturedEntity.selectFalseCol).to.equal("secret")
            }),
        ))

    it("should include select:false columns in afterUpdate event entity", async () =>
        await Promise.all(
            dataSources.map(async (dataSource) => {
                let capturedEntity: any = null

                dataSource.subscribers.push({
                    listenTo: () => MyEntity,
                    afterUpdate(event: UpdateEvent<MyEntity>) {
                        capturedEntity = event.entity
                    },
                } as EntitySubscriberInterface<MyEntity>)

                const repo = dataSource.getRepository(MyEntity)
                await repo.insert({
                    id: 1,
                    normalCol: "normal",
                    selectFalseCol: "secret",
                })

                await repo.save({
                    id: 1,
                    normalCol: "updated",
                    selectFalseCol: "secret-updated",
                })

                expect(capturedEntity.selectFalseCol).to.not.be.undefined
                expect(capturedEntity.selectFalseCol).to.equal("secret-updated")
            }),
        ))
})

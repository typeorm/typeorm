import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"
import { Post } from "./entity/Post"

describe("github issues > #6327 softRemove DeleteDateColumn is null at Susbscriber's AfterUpdate method", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                subscribers: [__dirname + "/subscriber/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should send correct update and delete date columns to after update subscriber", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const manager = connection.manager

                const entity = new Post()
                await manager.save(entity)

                const deletedEntity = await manager.softRemove(entity, {
                    data: { action: "soft-delete" },
                })

                await manager.recover(deletedEntity, {
                    data: { action: "restore" },
                })
            }),
        ))
})

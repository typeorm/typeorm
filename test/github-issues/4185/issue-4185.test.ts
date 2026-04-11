import { assert } from "chai"
import type { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Post } from "./entity/Post"

describe("github issues > #4185 afterLoad() subscriber interface missing additional info available on other events", () => {
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

    it("should invoke afterLoad() with LoadEvent", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const post1 = new Post()
                post1.id = 1
                const post2 = new Post()
                post2.id = 2
                await dataSource.manager.save([post1, post2])

                const entities = await dataSource.getRepository(Post).find()
                assert.strictEqual(entities.length, 2)
                for (const entity of entities) {
                    assert.isDefined(entity.simpleSubscriberSaw)
                    const event = entity.extendedSubscriberSaw
                    assert.isDefined(event)
                    assert.strictEqual(event.dataSource, dataSource)
                    assert.isDefined(event.queryRunner)
                    assert.isDefined(event.manager)
                    assert.strictEqual(event.entity, entity)
                    assert.isDefined(event.metadata)
                }
            }),
        ))
})

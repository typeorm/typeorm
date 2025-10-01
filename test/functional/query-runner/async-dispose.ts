import { expect } from "chai"
import "reflect-metadata"
import { DataSource } from "../../../src/data-source/DataSource"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { EntityManager } from "../../../src"

describe("query runner > async dispose", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [__dirname + "/entity/*{.js,.ts}"],
            enabledDrivers: ["postgres"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should release query runner", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                let entityManager: EntityManager
                {
                    await using queryRunner = dataSource.createQueryRunner()
                    await queryRunner.connect()
                    entityManager = queryRunner.manager
                }

                expect(entityManager.queryRunner?.isReleased).to.be.true
            }),
        ))
})

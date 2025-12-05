import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { PersonSchema } from "./entity/Person"
import {
    expect,
    describe,
    afterAll,
    it,
    beforeAll as before,
    beforeEach,
    afterAll as after,
    afterEach,
} from "vitest"

describe("entity-schema > indices > mysql", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [<any>PersonSchema],
                enabledDrivers: ["mysql"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should correctly create SPATIAL and FULLTEXT indices", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("person")
                await queryRunner.release()

                const spatialIndex = table!.indices.find(
                    (index) => !!index.isSpatial,
                )
                spatialIndex!.should.be.exist
                const fulltextIndex = table!.indices.find(
                    (index) => !!index.isFulltext,
                )
                fulltextIndex!.should.be.exist
            }),
        ))
})

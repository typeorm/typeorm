import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { PersonSchema } from "./entity/Person"

describe("entity-schema > indices > mysql", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [<any>PersonSchema],
                enabledDrivers: ["mysql"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should correctly create SPATIAL and FULLTEXT indices", () =>
        Promise.all(
            dataSources.map(async (connection) => {
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

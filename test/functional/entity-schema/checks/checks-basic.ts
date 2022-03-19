import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import { DataSource } from "../../../../src/data-source/DataSource"
import { PersonSchema } from "./entity/Person"
import { DriverUtils } from "../../../../src/driver/DriverUtils"

describe("entity-schema > checks", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [<any>PersonSchema],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should create a check constraints", () =>
        Promise.all(
            connections.map(async (connection) => {
                // Mysql does not support check constraints.
                if (DriverUtils.isMySQLFamily(connection.driver)) return

                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("person")
                await queryRunner.release()

                table!.checks.length.should.be.equal(2)
            }),
        ))
})

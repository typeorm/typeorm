import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { DataSource } from "../../../../../src/data-source/DataSource"
import { PersonSchema } from "./entity/Person"
import { DriverUtils } from "../../../../../src/driver/DriverUtils"

describe("entity-schema > columns > mysql", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [PersonSchema],
                enabledDrivers: ["mysql"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should create columns with different options", () =>
        Promise.all(
            connections.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("person")
                await queryRunner.release()

                table!.findColumnByName("Id")!.unsigned.should.equal(true)
                table!.findColumnByName("PostCode")!.zerofill.should.equal(true)
                table!.findColumnByName("PostCode")!.unsigned.should.equal(true)

                if (
                    connection.driver.options.type !== "mysql" ||
                    !DriverUtils.isReleaseVersionOrGreater(
                        connection.driver,
                        "8.0",
                    )
                ) {
                    table!
                        .findColumnByName("PostCode")!
                        .width!.should.be.equal(9)
                }

                table!
                    .findColumnByName("VirtualFullName")!
                    .asExpression!.should.be.equal(
                        "concat(`FirstName`,' ',`LastName`)",
                    )
                table!
                    .findColumnByName("VirtualFullName")!
                    .generatedType!.should.be.equal("VIRTUAL")
                table!
                    .findColumnByName("StoredFullName")!
                    .asExpression!.should.be.equal(
                        "concat(`FirstName`,' ',`LastName`)",
                    )
                table!
                    .findColumnByName("StoredFullName")!
                    .generatedType!.should.be.equal("STORED")
                table!
                    .findColumnByName("LastVisitDate")!
                    .onUpdate!.should.be.equal("CURRENT_TIMESTAMP(3)")
            }),
        ))
})

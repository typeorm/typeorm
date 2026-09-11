import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import type { DataSource } from "../../../../../src/data-source/DataSource"
import { PersonSchema } from "./entity/Person"

describe("entity-schema > columns > mysql", () => {
    let dataSources: DataSource[]
    before(async () => {
        dataSources = await createTestingConnections({
            entities: [PersonSchema],
            enabledDrivers: ["mysql"],
        })
    })
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should create columns with different options", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const queryRunner = dataSource.createQueryRunner()
                const table = await queryRunner.getTable("person")
                await queryRunner.release()

                table!.findColumnByName("Id")!.unsigned.should.equal(true)

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

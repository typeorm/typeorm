import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../utils/test-utils"
import type { DataSource } from "../../../../src/data-source/DataSource"
import { expect } from "chai"
import { PersonSchema } from "./entity/Person"
import { DriverUtils } from "../../../../src/driver/DriverUtils"

describe("entity-schema > uniques", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [<any>PersonSchema],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should create a unique constraint with 2 columns", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const queryRunner = connection.createQueryRunner()
                const table = await queryRunner.getTable("person")
                await queryRunner.release()

                if (
                    DriverUtils.isMySQLFamily(connection.driver) ||
                    connection.driver.options.type === "sap" ||
                    connection.driver.options.type === "spanner"
                ) {
                    expect(table!.indices.length).to.be.equal(1)
                    expect(table!.indices[0].name).to.be.equal("UNIQUE_TEST")
                    expect(table!.indices[0].isUnique).to.be.true
                    expect(table!.indices[0].columnNames.length).to.be.equal(2)
                    expect(
                        table!.indices[0].columnNames,
                    ).to.deep.include.members(["FirstName", "LastName"])
                } else if (DriverUtils.isSQLiteFamily(connection.driver)) {
                    expect(table!.uniques.length).to.be.equal(1)
                    expect(table!.uniques[0].columnNames.length).to.be.equal(2)
                    expect(
                        table!.uniques[0].columnNames,
                    ).to.deep.include.members(["FirstName", "LastName"])
                } else {
                    expect(table!.uniques.length).to.be.equal(1)
                    expect(table!.uniques[0].name).to.be.equal("UNIQUE_TEST")
                    expect(table!.uniques[0].columnNames.length).to.be.equal(2)
                    expect(
                        table!.uniques[0].columnNames,
                    ).to.deep.include.members(["FirstName", "LastName"])
                }
            }),
        ))
})

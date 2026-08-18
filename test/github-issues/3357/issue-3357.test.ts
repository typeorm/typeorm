import "reflect-metadata"
import { expect } from "chai"
import type { DataSource } from "../../../src"
import {
    createTestingConnections,
    closeTestingConnections,
} from "../../utils/test-utils"
import { User } from "./entity/User"

describe("github issues > #3357 Migration generation drops and creates columns instead of altering resulting in data loss", () => {
    let dataSources: DataSource[]

    before(async () => {
        dataSources = await createTestingConnections({
            enabledDrivers: ["postgres"],
            schemaCreate: true,
            dropSchema: true,
            entities: [User],
        })
    })
    after(() => closeTestingConnections(dataSources))

    it("should preserve data when a varchar column length is increased", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const repository = connection.getRepository(User)

                // insert a row with a value that fits in varchar(50)
                await repository.save(
                    repository.create({ name: "existing-data" }),
                )

                // change the column length from 50 to 51
                const metadata = connection.getMetadata(User)
                const column = metadata.columns.find(
                    (c) => c.propertyName === "name",
                )!
                column.length = "51"

                // run schema sync so the column change is applied
                await connection.synchronize()

                // the previously inserted row must still exist (data preserved)
                const rows = await repository.find()
                expect(rows.length).to.equal(1)
                expect(rows[0].name).to.equal("existing-data")
            }),
        ))
})

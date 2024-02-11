import { expect } from "chai"
import "reflect-metadata"

import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { User } from "./entity"

describe("github issues > #10638 Validate that virtual columns are being returned correctly", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [User],
                schemaCreate: true,
                dropSchema: true,
                enabledDrivers: ["postgres", "mysql", "mariadb", "sqlite"],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should return 1 to requested with @VirtualColumn definitions", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const repository = dataSource.getRepository(User)

                await repository.save({ id: 1, name: "admin" })
                const userAdmins = await repository.findOne({
                    where: { name: "admin" },
                })

                expect(userAdmins?.name).eq("admin")
                expect(userAdmins?.randomVirtualColumn).eql(1)
            }),
        ))
})

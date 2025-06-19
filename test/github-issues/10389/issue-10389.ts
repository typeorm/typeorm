import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { User } from "./entity/User"

describe("github issues > #10389 softDelete should not update already deleted rows", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should only soft delete rows that are not soft deleted previously", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                // tests go here
                const manager = dataSource.manager

                // create test users
                const batch1UsersData = [
                    { name: "Hassan", company: "test1" },
                    { name: "Nav", company: "test1" },
                ]
                const batch1Users = batch1UsersData.map(
                    ({ name, company }, idx) => {
                        const user = new User()
                        user.id = idx + 1
                        user.name = name
                        user.company = company
                        return user
                    },
                )
                await manager.save(batch1Users)

                // soft delete users with company test1
                const del1 = await manager.softDelete(User, {
                    company: "test1",
                })
                expect(del1.affected).to.be.eql(2)

                // create more users with the same company test1
                const batch2UsersData = [
                    { name: "Omer", company: "test1" },
                    { name: "Daniyal", company: "test1" },
                    { name: "Salman", company: "test1" },
                    { name: "Shahzaib", company: "test1" },
                ]
                const batch2Users = batch2UsersData.map(
                    ({ name, company }, idx) => {
                        const user = new User()
                        user.id = idx + 3
                        user.name = name
                        user.company = company
                        return user
                    },
                )
                await manager.save(batch2Users)

                // soft delete users again with company test1
                const del2 = await manager.softDelete(User, {
                    company: "test1",
                })
                // now affected rows should be equal to 4 and not 6, since 2 were already soft deleted before
                expect(del2.affected).to.be.eql(batch2Users.length)
            }),
        ))
})

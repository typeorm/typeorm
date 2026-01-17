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

    it("should correctly handle OR conditions in softDelete and not update already deleted rows", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager

                // create test users
                const batch1UsersData = [
                    { id: 10, name: "User 10", company: "comp1" },
                    { id: 11, name: "User 11", company: "comp1" },
                ]
                const batch1Users = batch1UsersData.map((data) => {
                    const user = new User()
                    user.id = data.id
                    user.name = data.name
                    user.company = data.company
                    return user
                })
                await manager.save(batch1Users)

                // soft delete users with ID 10 OR 11
                const del1 = await manager.softDelete(User, [
                    { id: 10 },
                    { id: 11 },
                ])
                expect(del1.affected).to.be.eql(2)

                // create more users
                const batch2UsersData = [
                    { id: 12, name: "User 12", company: "comp1" },
                    { id: 13, name: "User 13", company: "comp1" },
                ]
                const batch2Users = batch2UsersData.map((data) => {
                    const user = new User()
                    user.id = data.id
                    user.name = data.name
                    user.company = data.company
                    return user
                })
                await manager.save(batch2Users)

                // soft delete users again with ID 10 OR 11 OR 12 OR 13
                const del2 = await manager.softDelete(User, [
                    { id: 10 },
                    { id: 11 },
                    { id: 12 },
                    { id: 13 },
                ])

                // now affected rows should be equal to 2 (batch2) and not 4, since 2 were already soft deleted before
                expect(del2.affected).to.be.eql(batch2Users.length)

                const softDeletedUsers = await manager.find(User, {
                    where: [{ id: 10 }, { id: 11 }, { id: 12 }, { id: 13 }],
                    withDeleted: true,
                })
                expect(softDeletedUsers.length).to.be.eql(4)
                softDeletedUsers.forEach((user) => {
                    expect(user.deletedAt).to.be.instanceOf(Date)
                })
            }),
        ))
})

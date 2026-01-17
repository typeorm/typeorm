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

    it("should correctly handle OR conditions in softDelete", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const manager = dataSource.manager

                const usersData = [
                    { id: 10, name: "User 10", company: "comp1" },
                    { id: 11, name: "User 11", company: "comp1" },
                    { id: 12, name: "User 12", company: "comp2" },
                ]
                const users = usersData.map((data) => {
                    const user = new User()
                    user.id = data.id
                    user.name = data.name
                    user.company = data.company
                    return user
                })
                await manager.save(users)

                const result = await manager.softDelete(User, [
                    { id: 10 },
                    { id: 11 },
                ])

                expect(result.affected).to.be.eql(2)

                const softDeletedUsers = await manager.find(User, {
                    where: [{ id: 10 }, { id: 11 }],
                    withDeleted: true,
                })
                expect(softDeletedUsers.length).to.be.eql(2)
                softDeletedUsers.forEach((user) => {
                    expect(user.deletedAt).to.be.instanceOf(Date)
                })

                const notSoftDeletedUser = await manager.findOne(User, {
                    where: { id: 12 },
                })
                expect(notSoftDeletedUser).to.not.be.null
                expect(notSoftDeletedUser!.deletedAt).to.be.null
            }),
        ))
})

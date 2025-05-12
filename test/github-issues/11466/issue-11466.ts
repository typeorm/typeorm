import "reflect-metadata"
import { expect } from "chai"

import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Or, And, DataSource, IsNull, Not, In } from "../../../src/index.js"
import { User } from "./entity/user"

describe("github issues > #11466 Find conditions with array broken for mssql", () => {
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

    const prepareUsers = async (dataSource: DataSource) => {
        const user1 = new User()
        user1.id = 1
        user1.memberId = "test-member-id-1"

        const user2 = new User()
        user2.id = 2
        user2.memberId = "test-member-id-2"

        const user3 = new User()
        user3.id = 3

        const user4 = new User()
        user4.id = 4
        user4.memberId = "test-member-id-4"

        await dataSource.manager.save([user1, user2, user3, user4])

        return { user1, user2, user3, user4 }
    }

    it("should work with And", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const { user1, user2, user4 } = await prepareUsers(dataSource)

                const users = await dataSource.getRepository(User).find({
                    select: ["id"],
                    where: {
                        memberId: And(Not(IsNull()), Not(user2.memberId)),
                    },
                })

                expect(users).to.have.length(2)
                expect(users).to.deep.include({ id: user1.id })
                expect(users).to.deep.include({ id: user4.id })
            }),
        ))

    it("should work with Or", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const { user1, user2, user4 } = await prepareUsers(dataSource)

                const users = await dataSource.getRepository(User).find({
                    select: ["id"],
                    where: {
                        memberId: Or(Not(IsNull()), Not(user2.memberId)),
                    },
                })

                expect(users).to.have.length(3)
                expect(users).to.deep.include({ id: user1.id })
                expect(users).to.deep.include({ id: user2.id })
                expect(users).to.deep.include({ id: user4.id })
            }),
        ))

    it("should work with In", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const { user1, user2 } = await prepareUsers(dataSource)

                const users = await dataSource.getRepository(User).find({
                    select: ["id"],
                    where: {
                        memberId: In([user1.memberId, user2.memberId]),
                    },
                })

                expect(users).to.have.length(2)
                expect(users).to.deep.include({ id: user1.id })
                expect(users).to.deep.include({ id: user2.id })
            }),
        ))

    it("should work with In with wrapped Not", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const { user1, user2, user4 } = await prepareUsers(dataSource)

                const users = await dataSource.getRepository(User).find({
                    select: ["id"],
                    where: {
                        memberId: Not(In([user1.memberId, user2.memberId])),
                    },
                })

                expect(users).to.have.length(1)
                expect(users).to.deep.include({ id: user4.id })
            }),
        ))
})

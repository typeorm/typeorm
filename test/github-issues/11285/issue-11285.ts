import "reflect-metadata"
import { expect } from "chai"
import sinon from "sinon"

import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import {
    And,
    DataSource,
    In,
    MssqlParameter,
    Not,
    Raw,
} from "../../../src/index.js"
import { SqlServerQueryRunner } from "../../../src/driver/sqlserver/SqlServerQueryRunner"
import { User } from "./entity/user"
import { PostgresQueryRunner } from "../../../src/driver/postgres/PostgresQueryRunner"

describe("github issues > #11285 Missing MSSQL input type", () => {
    describe("mssql connection", () => {
        let dataSources: DataSource[]
        before(
            async () =>
                (dataSources = await createTestingConnections({
                    entities: [User],
                    enabledDrivers: ["mssql"],
                    schemaCreate: true,
                    dropSchema: true,
                })),
        )

        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))
        afterEach(() => sinon.restore())

        it("should convert input parameter to MssqlParameter", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const user = new User()
                    user.memberId = "test-member-id"

                    await dataSource.manager.save([user])

                    const selectSpy = sinon.spy(
                        SqlServerQueryRunner.prototype,
                        "query",
                    )

                    const users = await dataSource.getRepository(User).find({
                        where: {
                            memberId: user.memberId,
                        },
                    })

                    expect(users).to.have.length(1)
                    expect(users[0].memberId).to.be.equal(user.memberId)
                    expect(selectSpy.calledOnce).to.be.true

                    sinon.assert.calledWithMatch(
                        selectSpy,
                        sinon.match.any,
                        sinon.match((value) => {
                            return (
                                Array.isArray(value) &&
                                value.length === 1 &&
                                value[0] instanceof MssqlParameter &&
                                value[0].value === user.memberId &&
                                value[0].type === "varchar"
                            )
                        }),
                    )
                }),
            ))

        it("should convert input parameter with FindOperator to MssqlParameter", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const user = new User()
                    user.memberId = "test-member-id"

                    const user2 = new User()
                    user2.memberId = "test-member-id-2"

                    await dataSource.manager.save([user, user2])

                    const selectSpy = sinon.spy(
                        SqlServerQueryRunner.prototype,
                        "query",
                    )

                    const users = await dataSource.getRepository(User).find({
                        where: {
                            memberId: Not(user2.memberId),
                        },
                    })

                    expect(users).to.have.length(1)
                    expect(users[0].memberId).to.be.equal(user.memberId)

                    expect(selectSpy.calledOnce).to.be.true

                    sinon.assert.calledWithMatch(
                        selectSpy,
                        sinon.match.any,
                        sinon.match((value) => {
                            return (
                                Array.isArray(value) &&
                                value.length === 1 &&
                                value[0] instanceof MssqlParameter &&
                                value[0].value === user2.memberId &&
                                value[0].type === "varchar"
                            )
                        }),
                    )
                }),
            ))

        it("should not convert input parameter with raw FindOperator", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const user = new User()
                    user.memberId = "test-member-id"

                    await dataSource.manager.save([user])

                    const selectSpy = sinon.spy(
                        SqlServerQueryRunner.prototype,
                        "query",
                    )

                    const users = await dataSource.getRepository(User).find({
                        where: {
                            memberId: Raw(`'${user.memberId}'`),
                        },
                    })

                    expect(users).to.have.length(1)
                    expect(users[0].memberId).to.be.equal(user.memberId)
                    expect(selectSpy.calledOnce).to.be.true

                    sinon.assert.calledWithMatch(
                        selectSpy,
                        sinon.match.any,
                        sinon.match((value) => {
                            return Array.isArray(value) && value.length === 0
                        }),
                    )
                }),
            ))

        it("should convert input parameter with FindOperator with array to MssqlParameter", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const user = new User()
                    user.memberId = "test-member-id"

                    const user2 = new User()
                    user2.memberId = "test-member-id-2"

                    await dataSource.manager.save([user, user2])

                    const selectSpy = sinon.spy(
                        SqlServerQueryRunner.prototype,
                        "query",
                    )

                    const excludedUserIds = [user2.memberId]

                    const users = await dataSource.getRepository(User).find({
                        where: {
                            memberId: And(Not(In(excludedUserIds))),
                        },
                    })

                    expect(users).to.have.length(1)
                    expect(users[0].memberId).to.be.equal(user.memberId)

                    expect(excludedUserIds).to.eql([user2.memberId])

                    expect(selectSpy.calledOnce).to.be.true

                    sinon.assert.calledWithMatch(
                        selectSpy,
                        sinon.match.any,
                        sinon.match((value) => {
                            return (
                                Array.isArray(value) &&
                                value.length === 1 &&
                                value[0] instanceof MssqlParameter &&
                                value[0].value === user2.memberId &&
                                value[0].type === "varchar"
                            )
                        }),
                    )
                }),
            ))
    })

    describe("other connections", () => {
        let dataSources: DataSource[]
        before(
            async () =>
                (dataSources = await createTestingConnections({
                    entities: [User],
                    enabledDrivers: ["postgres"],
                    schemaCreate: true,
                    dropSchema: true,
                })),
        )

        beforeEach(() => reloadTestingDatabases(dataSources))
        after(() => closeTestingConnections(dataSources))
        afterEach(() => sinon.restore())

        it("should used the input parameter as it is", () =>
            Promise.all(
                dataSources.map(async (dataSource) => {
                    const user = new User()
                    user.memberId = "test-member-id"

                    await dataSource.manager.save([user])

                    const selectSpy = sinon.spy(
                        PostgresQueryRunner.prototype,
                        "query",
                    )

                    const users = await dataSource.getRepository(User).find({
                        where: {
                            memberId: user.memberId,
                        },
                    })

                    expect(users).to.have.length(1)
                    expect(users[0].memberId).to.be.equal(user.memberId)
                    expect(selectSpy.calledOnce).to.be.true

                    sinon.assert.calledWithMatch(
                        selectSpy,
                        sinon.match.any,
                        sinon.match((value) => {
                            return value[0] === user.memberId
                        }),
                    )
                }),
            ))
    })
})

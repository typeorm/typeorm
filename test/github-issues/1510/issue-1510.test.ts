import "reflect-metadata"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { EntitySchema, InsertResult } from "../../../src"

describe("github issues > #1510 entity schema does not support mode=objectId", () => {
    const UserEntity = new EntitySchema<{
        _id: number
        name: string
    }>({
        name: "User",
        tableName: "test_1510_users",
        columns: {
            _id: {
                type: "int",
                objectId: true,
                primary: true,
                generated: true,
            },
            name: {
                type: String,
            },
        },
    })

    const UserWithoutObjectIdEntity = new EntitySchema<{
        _id: number
        name: string
    }>({
        name: "UserWithoutObjectId",
        tableName: "test_1510_users2",
        columns: {
            _id: {
                type: "int",
                primary: true,
                generated: true,
            },
            name: {
                type: String,
            },
        },
    })

    let connections: DataSource[]
    before(async () => {
        return (connections = await createTestingConnections({
            entities: [
                __dirname + "/entity/*{.js,.ts}",
                UserEntity,
                UserWithoutObjectIdEntity,
            ],
            enabledDrivers: ["mongodb"],
        }))
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("throws an error because there is no object id defined", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(UserWithoutObjectIdEntity)

                try {
                    await repo.insert({
                        name: "Dotan",
                    })

                    expect(true).to.be.false
                } catch (e) {
                    expect(e.message).to.contain("createValueMap")
                }
            }),
        ))

    it("should create entities without throwing an error when objectId is defined", () =>
        Promise.all(
            connections.map(async (connection) => {
                const repo = connection.getRepository(UserEntity)

                const result: InsertResult = await repo.insert({
                    name: "Dotan",
                })

                const insertedId = result.identifiers[0]

                expect(insertedId).not.to.be.undefined
            }),
        ))
})

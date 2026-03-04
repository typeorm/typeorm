import "reflect-metadata"
import { expect } from "chai"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import type { DataSource } from "../../../src/data-source/DataSource"
import { User } from "../../functional/query-builder/update/entity/User"
import { EntityPropertyNotFoundError } from "../../../src/error/EntityPropertyNotFoundError"

describe("github issues > #3416 Unknown fields are stripped from WHERE clause", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [User],
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    describe("should throw FindCriteriaNotFoundError when supplying unknown property in where criteria", () => {
        it("find", () =>
            Promise.all(
                dataSources.map(async (connection) => {
                    let error: Error | undefined
                    try {
                        await connection.manager.findOneBy(User, {
                            // @ts-expect-error
                            unknownProp: "John Doe",
                        })
                    } catch (err) {
                        error = err
                    }
                    expect(error).to.be.an.instanceof(
                        EntityPropertyNotFoundError,
                    )
                }),
            ))
        it("update", () =>
            Promise.all(
                dataSources.map(async (connection) => {
                    let error: Error | undefined
                    try {
                        await connection.manager.update(
                            User,
                            { unknownProp: "Something" },
                            { name: "John doe " },
                        )
                    } catch (err) {
                        error = err
                    }
                    expect(error).to.be.an.instanceof(
                        EntityPropertyNotFoundError,
                    )
                }),
            ))
        it("delete", () =>
            Promise.all(
                dataSources.map(async (connection) => {
                    let error: Error | undefined
                    try {
                        await connection.manager.delete(User, {
                            unknownProp: "Something",
                        })
                    } catch (err) {
                        error = err
                    }
                    expect(error).to.be.an.instanceof(
                        EntityPropertyNotFoundError,
                    )
                }),
            ))
    })
})

import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { User } from "./entity/user"

describe("github issues > #10839 Entity instance is not correctly initialized inside .save() method", () => {
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

    it("should return a entity instance when save is called before create with entity instance", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const userInstance = new User()
                userInstance.name = "John Doe"
                const user = dataSource.getRepository(User).create(userInstance)
                const savedUser = await dataSource
                    .getRepository(User)
                    .save(user)
                expect(savedUser).to.be.instanceOf(User)
            }),
        ))

    it("should return an entity instance when save is called with plain object", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                const savedUser = await dataSource
                    .getRepository(User)
                    .save({ name: "John Doe" })
                expect(savedUser).to.be.instanceOf(User)
            }),
        ))
})

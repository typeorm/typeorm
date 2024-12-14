import "reflect-metadata"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src/data-source/DataSource"
import { expect } from "chai"
import { User } from "./entity/user"

describe("github issues > #10685 Regression in 0.3.11: postgres number arrays with < 2 items are converted to type Number", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["postgres"],
                schemaCreate: true,
                dropSchema: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(dataSources))
    after(() => closeTestingConnections(dataSources))

    it("should return Number[] column as array", () =>
        Promise.all(
            dataSources.map(async (dataSource) => {
                for (let i = 0; i <= 3; i++) {
                    const user = new User()
                    user.firstName = `username${i}`
                    user.favoriteNumbers = Array(i).fill(10)
                    await dataSource.manager.save(user)
                }
                const loadedUsers = await dataSource.getRepository(User).find()
                expect(loadedUsers).to.have.length(4)
                for (let i = 0; i <= 3; i++) {
                    expect(loadedUsers[i].favoriteNumbers).to.be.eql(
                        Array(i).fill(10),
                    )
                }
            }),
        ))

    // you can add additional tests if needed
})

import type { DataSource } from "../../../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../../../utils/test-utils"
import { UserEntitySchema } from "./entity/User"
import { expect } from "chai"
import { Name } from "./entity/Name"

describe("entity-schema > embedded - class-instance", () => {
    let dataSources: DataSource[]
    before(
        async () =>
            (dataSources = await createTestingConnections({
                entities: [UserEntitySchema],
            })),
    )

    beforeEach(() => reloadTestingDatabases(dataSources))

    after(() => closeTestingConnections(dataSources))

    it("should save entity with embedded", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const userRepository =
                    connection.getRepository(UserEntitySchema)
                const newUser = userRepository.create({
                    isActive: true,
                    name: {
                        first: "firstName",
                        last: "lastName",
                    },
                })
                const savedUser = await userRepository.save(newUser)

                expect(savedUser.name).to.contains({
                    first: "firstName",
                    last: "lastName",
                })
            }),
        ))

    it("should contains instance of target class embedded entity", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const userRepository =
                    connection.getRepository(UserEntitySchema)
                const newUser = userRepository.create({
                    isActive: true,
                    name: {
                        first: "firstName",
                        last: "lastName",
                    },
                })
                const savedUser = await userRepository.save(newUser)

                expect(savedUser.name).instanceOf(Name)
            }),
        ))
})

import { expect } from "chai"
import { DataSource } from "../../../src"
import "../../utils/test-setup"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { User } from "./entity/User"

describe("github issues > #8796 New find select object api should support false values as expected", () => {
    let dataSources: DataSource[]

    const user: User = {
        id: 1,
        firstName: "Christian",
        lastName: "Fleury",
        github: "chfleury",
    }

    const expectedUser: Partial<User> = {
        id: 1,
        firstName: "Christian",
    }

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

    it("should suport false value when selecting fields", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const userRepository = connection.getRepository(User)

                await userRepository.save(user)

                const foundUser = await userRepository.find({
                    where: { id: 1 },
                    select: {
                        id: true,
                        firstName: true,
                        lastName: undefined,
                        github: false,
                    },
                })

                expect(foundUser[0]).to.deep.equal(expectedUser)
            }),
        ))
})

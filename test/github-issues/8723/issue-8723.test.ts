import type { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { Photo } from "./entity/Photo"
import { User } from "./entity/User"

describe("github issues > #8723 Fail on Update when reference exists together with FK: multiple assignments to same column ", () => {
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

    it("should able to update when both reference and the id exist in the update object", () =>
        Promise.all(
            dataSources.map(async (connection) => {
                const photoRepository = connection.getRepository(Photo)
                const userRepository = connection.getRepository(User)

                const user = await userRepository.save({ id: 1, name: "Test" })
                const photo = await photoRepository.save({ id: 1 })

                await photoRepository.update(
                    { id: photo.id },
                    { user, userId: user.id },
                )
            }),
        ))
})

import { expect } from "chai"
import { DataSource } from "../../../src"
import {
    closeTestingConnections,
    createTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { User } from "./entity/User"

describe("github issues > #9420 Get error 'Cannot get metadata of given alias' when order column from subquery.", () => {
    let connections: DataSource[]
    before(async () => {
        connections = await createTestingConnections({
            enabledDrivers: ["postgres"],
            entities: [User],
            schemaCreate: true,
            dropSchema: true,
        })
    })
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("should not throw errors", async () =>
        await Promise.all(
            connections.map(async (connection) => {
                const userSubQb = connection
                    .getRepository(User)
                    .createQueryBuilder("user")
                    .select("user.id", "id")
                    .addSelect("user.name", "name")
                    .where("user.name = :name", {
                        name: "ABCxyz",
                    })
                    .orderBy("user.name", "ASC")

                const userQuery = connection
                    .createQueryBuilder()
                    .select(["sub.id", "sub.name"])
                    .from("(" + userSubQb.getQuery() + ")", "sub")
                    .orderBy("sub.name", "ASC")
                    .setParameters(userSubQb.getParameters())

                expect(await userQuery.getRawMany()).to.deep.eq([])
                await expect(userQuery.getRawMany()).not.to.eventually.throw()
            }),
        ))
})

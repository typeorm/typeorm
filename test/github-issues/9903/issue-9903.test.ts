import "../../utils/test-setup"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"
import { expect } from "chai"
import { User } from "./entity/User"

describe("github issues > #9903 json data type", () => {
    let connections: DataSource[]

    afterEach(() => closeTestingConnections(connections))

    describe("json supported type for mariadb", () => {
        const expectedJsonString = JSON.stringify({
            firstName: "Quality",
            lastName: "Tester",
        })
        const newUser: User = {
            jsonData: expectedJsonString,
        }

        const badJsonUser: User = {
            jsonData: `'''faux---'''`,
        }

        before(
            async () =>
                (connections = await createTestingConnections({
                    entities: [__dirname + "/entity/*{.js,.ts}"],
                    schemaCreate: true,
                    dropSchema: true,
                    enabledDrivers: ["mariadb"],
                })),
        )
        beforeEach(() => reloadTestingDatabases(connections))

        it("should create table with json constraint", () =>
            Promise.all(
                connections.map(async (connection) => {
                    const userRepository = connection.getRepository(User)

                    await userRepository.save(newUser)

                    const savedUser = await userRepository.findOneOrFail({
                        where: { id: newUser.id },
                    })

                    expect(savedUser).to.not.be.null
                    expect(savedUser.jsonData).to.equal(expectedJsonString)

                    // trying to save bad json
                    // here when executing the save the value is passed to JSON.stringify(),
                    // this will ensure its json valid in mariadb so this won't break the constraint
                    try {
                        await userRepository.save(badJsonUser)
                    } catch {
                        expect.fail(
                            null,
                            null,
                            "Should have not thrown an error",
                        )
                    }

                    try {
                        await userRepository.query(
                            "INSERT INTO user values (?, ?)",
                            [3, badJsonUser.jsonData],
                        )
                        expect.fail(null, null, "Should have thrown an error")
                    } catch (err) {
                        expect(err).not.to.be.undefined
                        expect(err.sqlMessage).not.to.be.undefined
                        expect(err.sqlMessage).to.equal(
                            "CONSTRAINT `user.jsonData` failed for `test`.`user`",
                        )
                    }
                }),
            ))
    })
})

// @ts
import "../../utils/test-setup"
import {
    createTestingConnections,
    closeTestingConnections,
    reloadTestingDatabases,
} from "../../utils/test-utils"
import { DataSource } from "../../../src"
import { Test } from "./entity/Test"
import { expect } from "chai"

describe("github issues > #9118 ES2022 Repository create method include undefined field that breaks DB update", () => {
    let connections: DataSource[]
    before(
        async () =>
            (connections = await createTestingConnections({
                entities: [__dirname + "/entity/*{.js,.ts}"],
                enabledDrivers: ["postgres"],
                schemaCreate: true,
            })),
    )
    beforeEach(() => reloadTestingDatabases(connections))
    after(() => closeTestingConnections(connections))

    it("it should not create undefined fields", () =>
        Promise.all(
            connections.map(async (connection) => {
                const testRepository = connection.getRepository(Test)
                const result = testRepository.create({
                    name: "test name",
                })

                expect(Object.getOwnPropertyNames(result)).to.have.same.members(
                    ["name"],
                )
            }),
        ))
})
